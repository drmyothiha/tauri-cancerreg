// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::fs;
use std::path::{Path, PathBuf};

/// Return the path where the DB **should live** (app-config-dir/all.db)
fn db_target_path(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .expect("failed to resolve app config dir")
        .join("all.db")
}

/// Return the *source* path:
///   * dev  → src-tauri/assets/all.db (plain file on disk)
///   * prod → bundled resource (resource_dir()/assets/all.db)
fn db_source_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    // `tauri::Env::DEV` is true only when running `tauri dev`
    if cfg!(debug_assertions) {
        // In dev we point directly to the source file
        let src = std::env::current_exe()
            .map_err(|e| e.to_string())?
            .parent()
            .ok_or("no parent".to_string())?
            .join("../../assets/all.db"); // relative to target/debug/
        Ok(src)
    } else {
        // Production – bundled resource
        let res_dir = app
            .path()
            .resource_dir()
            .map_err(|e| e.to_string())?;
        Ok(res_dir.join("assets").join("all.db"))
    }
}

#[tauri::command]
async fn get_db_path(app: tauri::AppHandle) -> Result<String, String> {
    let target = db_target_path(&app);

    // If the DB already exists where the app expects it → just return it
    if target.exists() {
        return target
            .to_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "invalid path".to_string());
    }

    // Otherwise copy from source (dev file or bundled resource)
    let source = db_source_path(&app)?;

    if !source.exists() {
        return Err(format!("DB source not found: {}", source.display()));
    }

    // Ensure the config directory exists
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::copy(&source, &target).map_err(|e| e.to_string())?;

    target
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "invalid path".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_db_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}