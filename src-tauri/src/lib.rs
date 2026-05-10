mod commands;
mod setup;
mod tray;

use std::sync::Mutex;
#[cfg(any(target_os = "macos", target_os = "ios"))]
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_log::{Target, TargetKind, RotationStrategy, TimezoneStrategy};

/// 存储启动时或运行时收到的待打开文件路径（防止前端未就绪时丢失事件）
pub struct PendingFiles(pub Mutex<Vec<String>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("app".to_string()),
                    }),
                ])
                .level(log::LevelFilter::Info)
                .rotation_strategy(RotationStrategy::KeepAll)
                .max_file_size(5_000_000) // 5MB per file
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .manage(PendingFiles(Mutex::new(Vec::new())))
        .setup(setup::init)
        .invoke_handler(tauri::generate_handler![
            commands::window::toggle_maximize,
            commands::window::minimize_window,
            commands::window::close_window,
            commands::window::hide_window,
            commands::window::show_window,
            commands::window::is_maximized,
            commands::config::get_app_config,
            commands::config::set_app_config,
            commands::config::update_tray_language,
            commands::system::get_app_info,
            commands::autostart::get_autostart_enabled,
            commands::autostart::set_autostart_enabled,
            commands::updater::check_for_update,
            commands::file::read_file_with_encoding,
            commands::file::write_file_utf8,
            get_pending_files,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        #[cfg(any(target_os = "macos", target_os = "ios"))]
        if let tauri::RunEvent::Opened { urls } = event {
            for url in urls {
                if let Ok(path) = url.to_file_path() {
                    let path_str = path.to_string_lossy().to_string();
                    log::info!("macOS opened file: {}", path_str);

                    if let Some(pending) = app_handle.try_state::<PendingFiles>() {
                        pending.0.lock().unwrap().push(path_str.clone());
                    }

                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                        let _ = window.emit("open-file", path_str);
                    }
                }
            }
        }

        #[cfg(not(any(target_os = "macos", target_os = "ios")))]
        let _ = (&app_handle, &event);
    });
}

/// 获取并清空待处理的文件路径列表（前端启动时调用，防止丢失启动参数）
#[tauri::command]
fn get_pending_files(state: tauri::State<'_, PendingFiles>) -> Vec<String> {
    let mut pending = state.0.lock().unwrap();
    let files = pending.clone();
    pending.clear();
    files
}
