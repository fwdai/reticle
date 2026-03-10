use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Returns the app data root (Reticle or Reticle-dev folder).
/// Uses "Reticle-dev" when running with `tauri dev` to avoid conflicts with the built app.
pub fn app_data_root(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(test_dir) = std::env::var("RETICLE_DB_DIR") {
        return Ok(PathBuf::from(test_dir));
    }

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let parent_dir = app_data_dir
        .parent()
        .ok_or("Failed to get parent of app data directory")?;
    let folder_name = if tauri::is_dev() {
        "Reticle-dev"
    } else {
        "Reticle"
    };
    Ok(parent_dir.join(folder_name))
}
