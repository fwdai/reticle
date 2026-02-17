use base64::prelude::*;
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Returns the app data root (Reticle folder), matching database.rs logic.
fn app_data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let parent_dir = app_data_dir
        .parent()
        .ok_or("Failed to get parent of app data directory")?;
    Ok(parent_dir.join("Reticle"))
}

/// Stores file content in app data at workspaces/<account_id>/blobs/<sha256>.
/// Returns the full path to the stored file.
/// If the same content already exists (same sha256), the path is returned without overwriting.
#[tauri::command]
pub async fn store_attachment_blob(
    app: tauri::AppHandle,
    file_base64: String,
    account_id: String,
) -> Result<String, String> {
    let bytes = BASE64_STANDARD
        .decode(&file_base64)
        .map_err(|e| format!("Invalid base64: {}", e))?;

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let hash = hasher.finalize();
    let sha256_hex = format!("{:x}", hash);

    let root = app_data_root(&app)?;
    let blob_dir = root
        .join("workspaces")
        .join(&account_id)
        .join("blobs");

    std::fs::create_dir_all(&blob_dir)
        .map_err(|e| format!("Failed to create blob directory: {}", e))?;

    let blob_path = blob_dir.join(&sha256_hex);
    std::fs::write(&blob_path, &bytes)
        .map_err(|e| format!("Failed to write blob: {}", e))?;

    blob_path
        .to_str()
        .map(String::from)
        .ok_or_else(|| "Invalid path".to_string())
}

/// Reads a blob file and returns its content as base64.
/// Validates that the path is within workspaces/<account_id>/blobs/ to prevent path traversal.
#[tauri::command]
pub async fn read_attachment_blob(app: tauri::AppHandle, blob_path: String) -> Result<String, String> {
    let root = app_data_root(&app)?;
    let path = std::path::PathBuf::from(&blob_path);

    if !path.exists() {
        return Err("Blob file not found".to_string());
    }

    let path = path
        .canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;

    let workspaces = root.join("workspaces");
    if !path.starts_with(&workspaces) {
        return Err("Path is outside workspace blobs directory".to_string());
    }

    let bytes = std::fs::read(&path).map_err(|e| format!("Failed to read blob: {}", e))?;
    Ok(BASE64_STANDARD.encode(&bytes))
}

/// Deletes a blob file from the app data workspace folder.
/// Validates that the path is within workspaces/<account_id>/blobs/ to prevent path traversal.
#[tauri::command]
pub async fn delete_attachment_blob(
    app: tauri::AppHandle,
    blob_path: String,
) -> Result<(), String> {
    let root = app_data_root(&app)?;
    let path = std::path::PathBuf::from(&blob_path);

    if !path.exists() {
        return Ok(()); // Already gone, idempotent
    }

    let path = path
        .canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;

    let workspaces = root.join("workspaces");
    if !path.starts_with(&workspaces) {
        return Err("Path is outside workspace blobs directory".to_string());
    }

    std::fs::remove_file(&path).map_err(|e| format!("Failed to delete blob: {}", e))?;

    Ok(())
}
