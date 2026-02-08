use rusqlite::{Connection, Result, params, Statement};
use rusqlite_migration::{Migrations, M};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use serde_json::{Value, Map};
use anyhow::{anyhow, Result as AnyhowResult};

// Define the migrations
fn get_migrations() -> Migrations<'static> {
    Migrations::new(vec![
        M::up(include_str!("../migrations/0001_initial_schema.sql")),
    ])
}

// Initialize the database connection and run migrations
pub fn init_database(app_handle: &AppHandle) -> AnyhowResult<Arc<Mutex<Connection>>> {
    let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data directory");
    std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
    let db_path = app_dir.join("reticle.db");
    
    let mut conn = Connection::open(&db_path)?;
    
    let migrations = get_migrations();
    migrations.to_latest(&mut conn)?;
    
    Ok(Arc::new(Mutex::new(conn)))
}

// Helper to convert serde_json::Value to rusqlite::ToSql
fn value_to_sql(value: &Value) -> anyhow::Result<Box<dyn rusqlite::ToSql + '_>> {
    let boxed: Box<dyn rusqlite::ToSql + '_> = match value {
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
        Value::String(s) => Box::new(s.clone()),
        _ => return Err(anyhow!("Unsupported JSON type for SQL conversion")),
    };
    Ok(boxed)
}

// Generic INSERT operation
pub fn db_insert(conn: &Connection, table: &str, data: Value) -> AnyhowResult<usize> {
    let data_map = data.as_object().ok_or_else(|| anyhow!("Data must be a JSON object for insert"))?;
    if data_map.is_empty() {
        return Err(anyhow!("Cannot insert empty data"));
    }

    let columns: Vec<&String> = data_map.keys().collect();
    let placeholders: Vec<String> = (0..columns.len()).map(|i| format!("?{}", i + 1)).collect();

    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        table,
        columns.join(", "),
        placeholders.join(", ")
    );

    let mut stmt = conn.prepare(&sql)?;
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    for col in columns {
        params_vec.push(value_to_sql(&data_map[col])?);
    }
    
    let changes = stmt.execute(rusqlite::params_from_iter(params_vec))?;
    Ok(changes)
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
            params_vec.push(value_to_sql(val)?);
        }
    }

    if !where_clauses.is_empty() {
        sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
    }

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
        let mut map = Map::new();
        for (i, col_name) in row.column_names().iter().enumerate() {
            let value = row.get_ref(i)?.to_json().map_err(|e| rusqlite::Error::ToSqlConversionFailure(e.into()))?;
            map.insert(col_name.to_string(), value);
        }
        Ok(map)
    })?.filter_map(|r| r.ok()).collect();

    Ok(rows)
}

// Generic UPDATE operation
pub fn db_update(conn: &Connection, table: &str, query: Value, data: Value) -> AnyhowResult<usize> {
    let query_map = query.as_object().ok_or_else(|| anyhow!("Query must be a JSON object for update"))?;
    let data_map = data.as_object().ok_or_else(|| anyhow!("Data must be a JSON object for update"))?;
    if data_map.is_empty() {
        return Err(anyhow!("Cannot update with empty data"));
    }

    let mut set_clauses = Vec::new();
    let mut where_clauses = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    for (i, (col, val)) in data_map.iter().enumerate() {
        set_clauses.push(format!("{} = ?{}", col, i + 1));
        params_vec.push(value_to_sql(val)?);
    }

    if let Some(where_obj) = query_map.get("where").and_then(|v| v.as_object()) {
        for (i, (col, val)) in where_obj.iter().enumerate() {
            where_clauses.push(format!("{} = ?{}", col, params_vec.len() + i + 1));
            params_vec.push(value_to_sql(val)?);
        }
    }

    let mut sql = format!("UPDATE {} SET {}", table, set_clauses.join(", "));
    if !where_clauses.is_empty() {
        sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
    }

    let mut stmt = conn.prepare(&sql)?;
    let changes = stmt.execute(rusqlite::params_from_iter(params_vec))?;
    Ok(changes)
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
            params_vec.push(value_to_sql(val)?);
        }
    }

    if !where_clauses.is_empty() {
        sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
    }

    let mut stmt = conn.prepare(&sql)?;
    let changes = stmt.execute(rusqlite::params_from_iter(params_vec))?;
    Ok(changes)
}