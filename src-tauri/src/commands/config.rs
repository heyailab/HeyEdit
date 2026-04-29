use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub language: String,
    pub theme: String, // "light" | "dark" | "system"
    pub layout: String, // "sidebar" | "header" | "sidebar-header" | "fullscreen"
    pub autostart: bool,
    pub close_to_tray: bool,
    pub update_endpoint: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            language: "en".to_string(),
            theme: "system".to_string(),
            layout: "sidebar".to_string(),
            autostart: false,
            close_to_tray: true,
            update_endpoint: String::new(),
        }
    }
}

#[command]
pub async fn get_app_config() -> Result<AppConfig, String> {
    Ok(AppConfig::default())
}

#[command]
pub async fn set_app_config(config: AppConfig) -> Result<(), String> {
    log::info!("Config updated: {:?}", config);
    Ok(())
}
