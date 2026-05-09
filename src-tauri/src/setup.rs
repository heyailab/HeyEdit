use std::fs;

use serde_json::Value;
use tauri::{App, Manager};

use crate::tray;

fn read_language(app: &App) -> String {
    if let Ok(data_dir) = app.path().app_data_dir() {
        let config_path = data_dir.join("config.json");
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(json) = serde_json::from_str::<Value>(&content) {
                if let Some(lang) = json
                    .get("config")
                    .and_then(|c| c.get("language"))
                    .and_then(|v| v.as_str())
                {
                    return lang.to_string();
                }
            }
        }
    }
    "en".to_string()
}

pub fn init(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("Initializing HeyEdit application");

    let language = read_language(app);
    tray::create_tray(app.handle(), &language)?;

    // Hide the window to tray on close (handled via frontend)
    let main_window = app.get_webview_window("main").unwrap();
    let main_window_clone = main_window.clone();
    main_window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = main_window_clone.hide();
        }
    });

    log::info!("Application setup complete");
    Ok(())
}
