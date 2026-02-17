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
