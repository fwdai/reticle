use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

// ── State ────────────────────────────────────────────────────────────────────

pub struct RunnerManager {
    runs: HashMap<String, CommandChild>,
}

impl RunnerManager {
    pub fn new() -> Self {
        Self {
            runs: HashMap::new(),
        }
    }
}

pub type RunnerState = Arc<Mutex<RunnerManager>>;

// ── Event payloads emitted to the frontend ───────────────────────────────────

#[derive(Clone, Serialize)]
pub struct RunnerOutput {
    pub id: String,
    pub data: String,
}

#[derive(Clone, Serialize)]
pub struct RunnerExit {
    pub id: String,
    pub code: Option<i32>,
}

// ── Deno permission config ────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct RunnerPermissions {
    pub allow_net: Option<String>,
    pub allow_read: Option<String>,
    pub allow_write: Option<String>,
    pub allow_env: Option<bool>,
    pub allow_run: Option<String>,
}

// ── Commands ─────────────────────────────────────────────────────────────────

/// Spawn a new Deno subprocess.
///
/// `id`          – caller-supplied unique identifier (used in all subsequent events)
/// `script`      – path to the .ts/.js file Deno should run
/// `args`        – extra CLI args forwarded to the script (after `--`)
/// `permissions` – Deno permission flags; omit a field to deny that permission
///
/// Events emitted on `AppHandle`:
///   "runner-stdout"  → RunnerOutput { id, data }
///   "runner-stderr"  → RunnerOutput { id, data }
///   "runner-exit"    → RunnerExit   { id, code }
#[tauri::command]
pub async fn runner_spawn(
    id: String,
    script: String,
    args: Vec<String>,
    permissions: Option<RunnerPermissions>,
    state: tauri::State<'_, RunnerState>,
    app: AppHandle,
) -> Result<(), String> {
    {
        let manager = state.lock().unwrap();
        if manager.runs.contains_key(&id) {
            return Err(format!("runner '{}' is already running", id));
        }
    }

    let mut deno_args = vec!["run".to_string(), "--no-prompt".to_string()];

    if let Some(perms) = permissions {
        if let Some(v) = perms.allow_net {
            deno_args.push(format!("--allow-net={v}"));
        }
        if let Some(v) = perms.allow_read {
            deno_args.push(format!("--allow-read={v}"));
        }
        if let Some(v) = perms.allow_write {
            deno_args.push(format!("--allow-write={v}"));
        }
        if perms.allow_env.unwrap_or(false) {
            deno_args.push("--allow-env".to_string());
        }
        if let Some(v) = perms.allow_run {
            deno_args.push(format!("--allow-run={v}"));
        }
    }

    deno_args.push(script);
    if !args.is_empty() {
        deno_args.push("--".to_string());
        deno_args.extend(args);
    }

    let (mut rx, child) = app
        .shell()
        .sidecar("binaries/deno")
        .map_err(|e| e.to_string())?
        .args(&deno_args)
        .spawn()
        .map_err(|e| e.to_string())?;

    state.lock().unwrap().runs.insert(id.clone(), child);

    // Forward process events to the frontend on a background task.
    let state_arc = state.inner().clone();
    let app_handle = app.clone();
    let run_id = id.clone();

    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    app_handle
                        .emit(
                            "runner-stdout",
                            RunnerOutput {
                                id: run_id.clone(),
                                data: String::from_utf8_lossy(&bytes).into_owned(),
                            },
                        )
                        .ok();
                }
                CommandEvent::Stderr(bytes) => {
                    app_handle
                        .emit(
                            "runner-stderr",
                            RunnerOutput {
                                id: run_id.clone(),
                                data: String::from_utf8_lossy(&bytes).into_owned(),
                            },
                        )
                        .ok();
                }
                CommandEvent::Terminated(payload) => {
                    state_arc.lock().unwrap().runs.remove(&run_id);
                    app_handle
                        .emit(
                            "runner-exit",
                            RunnerExit {
                                id: run_id.clone(),
                                code: payload.code,
                            },
                        )
                        .ok();
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

/// Send a string to the runner's stdin.
#[tauri::command]
pub fn runner_send(
    id: String,
    input: String,
    state: tauri::State<'_, RunnerState>,
) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    match manager.runs.get_mut(&id) {
        Some(child) => child.write(input.as_bytes()).map_err(|e| e.to_string()),
        None => Err(format!("no runner with id '{}'", id)),
    }
}

/// Kill a running subprocess.
#[tauri::command]
pub fn runner_kill(
    id: String,
    state: tauri::State<'_, RunnerState>,
) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    match manager.runs.remove(&id) {
        Some(child) => child.kill().map_err(|e| e.to_string()),
        None => Ok(()),
    }
}

/// List IDs of all currently running subprocesses.
#[tauri::command]
pub fn runner_list(state: tauri::State<'_, RunnerState>) -> Vec<String> {
    state.lock().unwrap().runs.keys().cloned().collect()
}
