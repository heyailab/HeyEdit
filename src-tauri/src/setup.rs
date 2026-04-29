use tauri::{App, Manager};

use crate::tray;

pub fn init(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("Initializing TauriBase application");

    tray::create_tray(app.handle())?;

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
