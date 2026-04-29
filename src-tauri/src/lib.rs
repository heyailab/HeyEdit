mod commands;
mod setup;
mod tray;

use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_log::{Target, TargetKind, RotationStrategy, TimezoneStrategy};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            commands::system::get_app_info,
            commands::autostart::get_autostart_enabled,
            commands::autostart::set_autostart_enabled,
            commands::updater::check_for_update,
            commands::file::read_file_with_encoding,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
