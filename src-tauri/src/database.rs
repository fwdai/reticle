use rusqlite::{Connection, params_from_iter};
use rusqlite_migration::{Migrations, M};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use serde_json::{Value, Map, json};
use anyhow::{anyhow, Result as AnyhowResult};
use ulid::Ulid; // Added Ulid

// Define the migrations
fn get_migrations() -> Migrations<'static> {
    Migrations::new(vec![
        M::up(include_str!("../migrations/0001_initial_schema.sql")),
        M::up(include_str!("../migrations/0002_create_collections_table.sql")),
        M::up(include_str!("../migrations/0003_create_scenarios_table.sql")),
        M::up(include_str!("../migrations/0004_create_executions_table.sql")),
        M::up(include_str!("../migrations/0005_add_timestamps_to_api_keys.sql")),
        M::up(include_str!("../migrations/0006_create_settings_table.sql")),
        M::up(include_str!("../migrations/0007_create_prompt_templates_table.sql")),
    ])
}

// Initialize the database connection and run migrations
pub fn init_database(app_handle: &AppHandle) -> AnyhowResult<Arc<Mutex<Connection>>> {
    let app_data_dir = app_handle.path().app_data_dir().expect("Failed to get app data directory");
    let parent_dir = app_data_dir.parent().expect("Failed to get parent of app data directory");
    let app_dir = parent_dir.join("Reticle"); // Custom folder name
    
    std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
    let db_path = app_dir.join("reticle.db");
    
    let mut conn = Connection::open(&db_path)?;
    conn.execute_batch("
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA temp_store = MEMORY;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;
    ")?;
    
    let migrations = get_migrations();
    migrations.to_latest(&mut conn)?;
    
    Ok(Arc::new(Mutex::new(conn)))
}

// Helper to convert rusqlite::types::ValueRef to serde_json::Value
fn rusqlite_value_to_json(value_ref: &rusqlite::types::ValueRef) -> AnyhowResult<Value> {
    match value_ref {
        rusqlite::types::ValueRef::Null => Ok(Value::Null),
        rusqlite::types::ValueRef::Integer(i) => Ok(Value::Number(serde_json::Number::from(*i))),
        rusqlite::types::ValueRef::Real(f) => Ok(Value::Number(serde_json::Number::from_f64(*f).ok_or_else(|| anyhow!("Invalid float value"))?)),
        rusqlite::types::ValueRef::Text(s) => Ok(Value::String(String::from_utf8(s.to_vec())?)),
        rusqlite::types::ValueRef::Blob(b) => Ok(Value::Array(b.iter().map(|&byte| Value::Number(serde_json::Number::from(byte))).collect())),
    }
}

// Helper to convert serde_json::Value to rusqlite::ToSql
fn json_value_to_sql<'a>(value: &'a Value) -> anyhow::Result<Box<dyn rusqlite::ToSql + 'a>> {
    let boxed: Box<dyn rusqlite::ToSql + 'a> = match value {
        Value::Null => Box::new(rusqlite::types::Null),
        Value::Bool(b) => Box::new(*b),
        Value::Number(n) => {
            if n.is_i64() {
                Box::new(n.as_i64().unwrap())
            } else if n.is_f64() {
                Box::new(n.as_f64().unwrap())
            } else {
                return Err(anyhow!("Unsupported number type"));
            }
        },
        Value::String(s) => Box::new(s),
        _ => return Err(anyhow!("Unsupported JSON type for SQL conversion")),
    };
    Ok(boxed)
}

// Generic INSERT operation
pub fn db_insert(conn: &Connection, table: &str, mut data: Value) -> AnyhowResult<String> {
    let data_map_original = data.as_object_mut().ok_or_else(|| anyhow!("Data must be a JSON object for insert"))?;
    
    // Generate ULID if no 'id' is provided
    let id_to_insert = if let Some(id_val) = data_map_original.get("id").and_then(|v| v.as_str()) {
        id_val.to_string()
    } else {
        let ulid = Ulid::new().to_string();
        data_map_original.insert("id".to_string(), json!(ulid.clone()));
        ulid
    };

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64;

    // Automatically set created_at and updated_at on insert if not provided
    if !data_map_original.contains_key("created_at") {
        data_map_original.insert("created_at".to_string(), json!(now));
    }
    if !data_map_original.contains_key("updated_at") {
        data_map_original.insert("updated_at".to_string(), json!(now));
    }
    
    let data_map = data_map_original;

    let columns: Vec<&str> = data_map.keys().map(|s| s.as_str()).collect();
    let placeholders: Vec<String> = (0..columns.len()).map(|i| format!("?{}", i + 1)).collect();

    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        table,
        columns.join(", "),
        placeholders.join(", ")
    );

    let mut stmt = conn.prepare(&sql)?;
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    for col in data_map.keys() {
        params_vec.push(json_value_to_sql(&data_map[col])?);
    }
    
    stmt.execute(params_from_iter(params_vec.into_iter()))?;
    Ok(id_to_insert)
}

// Generic SELECT operation
pub fn db_select(conn: &Connection, table: &str, query: Value) -> AnyhowResult<Vec<Map<String, Value>>> {
    let query_map = query.as_object().ok_or_else(|| anyhow!("Query must be a JSON object for select"))?;

    let mut sql = format!("SELECT * FROM {}", table);
    let mut where_clauses = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(where_obj) = query_map.get("where").and_then(|v| v.as_object()) {
        for (i, (col, val)) in where_obj.iter().enumerate() {
            where_clauses.push(format!("{} = ?{}", col, i + 1));
            params_vec.push(json_value_to_sql(val)?);
        }
    }

    if !where_clauses.is_empty() {
        sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
    }

    if let Some(order_by) = query_map.get("orderBy").and_then(|v| v.as_str()) {
        let direction = query_map
            .get("orderDirection")
            .and_then(|v| v.as_str())
            .unwrap_or("ASC");
        let dir = if direction.eq_ignore_ascii_case("desc") { "DESC" } else { "ASC" };
        sql.push_str(&format!(" ORDER BY {} {}", order_by, dir));
    }

    if let Some(limit) = query_map.get("limit").and_then(|v| v.as_i64()) {
        if limit > 0 {
            sql.push_str(&format!(" LIMIT {}", limit));
        }
    }

    if let Some(offset) = query_map.get("offset").and_then(|v| v.as_i64()) {
        if offset >= 0 {
            sql.push_str(&format!(" OFFSET {}", offset));
        }
    }

    let mut stmt = conn.prepare(&sql)?;
    let column_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();

    let rows = stmt.query_map(params_from_iter(params_vec.into_iter()), |row| { // Fix: use params_from_iter
        let mut map = Map::new();
        for (i, col_name) in column_names.iter().enumerate() {
            let value_ref = row.get_ref(i)?;
            let value = rusqlite_value_to_json(&value_ref).map_err(|e| rusqlite::Error::ToSqlConversionFailure(e.into()))?;
            map.insert(col_name.to_string(), value);
        }
        Ok(map)
    })?.filter_map(|r| r.ok()).collect();

    Ok(rows)
}

// Generic UPDATE operation
pub fn db_update(conn: &Connection, table: &str, query: Value, mut data: Value) -> AnyhowResult<usize> {
    let query_map = query.as_object().ok_or_else(|| anyhow!("Query must be a JSON object for update"))?;
    let data_map = data.as_object_mut().ok_or_else(|| anyhow!("Data must be a JSON object for update"))?; // data is now mutable

    if data_map.is_empty() {
        return Err(anyhow!("Cannot update with empty data"));
    }

    // Automatically set updated_at on update
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64;
    data_map.insert("updated_at".to_string(), json!(now));

    let mut set_clauses = Vec::new();
    let mut where_clauses = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    for (i, (col, val)) in data_map.iter().enumerate() {
        set_clauses.push(format!("{} = ?{}", col, i + 1));
        params_vec.push(json_value_to_sql(val)?);
    }

    if let Some(where_obj) = query_map.get("where").and_then(|v| v.as_object()) {
        for (i, (col, val)) in where_obj.iter().enumerate() {
            where_clauses.push(format!("{} = ?{}", col, params_vec.len() + i + 1));
            params_vec.push(json_value_to_sql(val)?);
        }
    }

    let mut sql = format!("UPDATE {} SET {}", table, set_clauses.join(", "));
    if !where_clauses.is_empty() {
        sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
    }

    let mut stmt = conn.prepare(&sql)?;
    let changes = stmt.execute(params_from_iter(params_vec.into_iter()))?; // Fix: use params_from_iter
    Ok(changes)
}

// Generic COUNT operation
pub fn db_count(conn: &Connection, table: &str, query: Value) -> AnyhowResult<i64> {
    let query_map = query.as_object().ok_or_else(|| anyhow!("Query must be a JSON object for count"))?;

    let mut sql = format!("SELECT COUNT(*) FROM {}", table);
    let mut where_clauses = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(where_obj) = query_map.get("where").and_then(|v| v.as_object()) {
        for (i, (col, val)) in where_obj.iter().enumerate() {
            where_clauses.push(format!("{} = ?{}", col, i + 1));
            params_vec.push(json_value_to_sql(val)?);
        }
    }

    if !where_clauses.is_empty() {
        sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
    }

    let count: i64 = conn.query_row(
        &sql,
        params_from_iter(params_vec.into_iter()),
        |row| row.get(0),
    )?;
    Ok(count)
}

// Generic DELETE operation
pub fn db_delete(conn: &Connection, table: &str, query: Value) -> AnyhowResult<usize> {
    let query_map = query.as_object().ok_or_else(|| anyhow!("Query must be a JSON object for delete"))?;

    let mut sql = format!("DELETE FROM {}", table);
    let mut where_clauses = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(where_obj) = query_map.get("where").and_then(|v| v.as_object()) {
        for (i, (col, val)) in where_obj.iter().enumerate() {
            where_clauses.push(format!("{} = ?{}", col, i + 1));
            params_vec.push(json_value_to_sql(val)?);
        }
    }

    if !where_clauses.is_empty() {
        sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
    }

    let mut stmt = conn.prepare(&sql)?;
    let changes = stmt.execute(params_from_iter(params_vec.into_iter()))?; // Fix: use params_from_iter
    Ok(changes)
}