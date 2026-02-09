use tauri::Manager;
use serde_json::Value;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn db_insert_cmd(
    table: String,
    data: Value,
    state: tauri::State<'_, Arc<Mutex<rusqlite::Connection>>>,
) -> Result<String, String> {
    let conn = state.lock().unwrap();
    database::db_insert(&conn, &table, data).map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_select_cmd(
    table: String,
    query: Value,
    state: tauri::State<'_, Arc<Mutex<rusqlite::Connection>>>,
) -> Result<Value, String> {
    let conn = state.lock().unwrap();
    let result = database::db_select(&conn, &table, query).map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn db_update_cmd(
    table: String,
    query: Value,
    data: Value,
    state: tauri::State<'_, Arc<Mutex<rusqlite::Connection>>>,
) -> Result<usize, String> {
    let conn = state.lock().unwrap();
    database::db_update(&conn, &table, query, data).map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_delete_cmd(
    table: String,
    query: Value,
    state: tauri::State<'_, Arc<Mutex<rusqlite::Connection>>>,
) -> Result<usize, String> {
    let conn = state.lock().unwrap();
    database::db_delete(&conn, &table, query).map_err(|e| e.to_string())
}

mod server;
mod database;

use std::sync::{Arc, Mutex}; // Needed for State in commands

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let db_conn = database::init_database(&app_handle)
                .expect("Failed to initialize database");
            app.manage(db_conn);
            tauri::async_runtime::spawn(server::start_proxy_server(app_handle.clone()));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            db_insert_cmd,
            db_select_cmd,
            db_update_cmd,
            db_delete_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}