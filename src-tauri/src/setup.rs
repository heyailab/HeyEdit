use std::fs;
use std::path::Path;

use serde_json::Value;
use tauri::{App, Emitter, Manager};

use crate::tray;
use crate::PendingFiles;

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

/// 解析命令行参数中的文件路径（Windows 上右键打开 / 文件关联传参）
fn parse_cli_file_paths() -> Vec<String> {
    let args: Vec<String> = std::env::args().collect();
    // args[0] = 可执行文件路径，后续可能是文件路径
    args.iter()
        .skip(1)
        .filter(|arg| {
            let p = Path::new(arg);
            p.is_absolute() && p.exists() && p.is_file()
        })
        .cloned()
        .collect()
}

pub fn init(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("Initializing HeyEdit application");

    let language = read_language(app);
    tray::create_tray(app.handle(), &language)?;

    // Hide the window to tray on close
    let main_window = app.get_webview_window("main").unwrap();
    let main_window_clone = main_window.clone();
    main_window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = main_window_clone.hide();
        }
    });

    // 处理启动时通过文件关联 / 右键打开传入的文件路径
    let file_paths = parse_cli_file_paths();
    if !file_paths.is_empty() {
        log::info!("CLI file paths detected: {:?}", file_paths);
        let handle = app.handle();

        // 存入待处理列表（前端未就绪时 fallback）
        if let Some(pending) = handle.try_state::<PendingFiles>() {
            pending.0.lock().unwrap().extend(file_paths.clone());
        }

        // 显示并聚焦窗口，通知前端打开文件
        if let Some(window) = handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
            for path in &file_paths {
                let _ = window.emit("open-file", path);
            }
        }
    }

    log::info!("Application setup complete");
    Ok(())
}
