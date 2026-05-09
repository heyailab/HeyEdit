use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent, TrayIconId},
    AppHandle, Manager,
};

fn tray_strings(language: &str) -> (&'static str, &'static str, &'static str) {
    if language == "zh" {
        ("显示窗口", "隐藏窗口", "退出")
    } else {
        ("Show Window", "Hide Window", "Quit")
    }
}

fn build_tray_menu(app: &AppHandle, language: &str) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let (show_text, hide_text, quit_text) = tray_strings(language);

    let show_i = MenuItem::with_id(app, "show", show_text, true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", hide_text, true, None::<&str>)?;
    let separator = MenuItem::with_id(app, "sep", "─────────", false, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", quit_text, true, None::<&str>)?;

    Ok(Menu::with_items(app, &[&show_i, &hide_i, &separator, &quit_i])?)
}

pub fn create_tray(app: &AppHandle, language: &str) -> Result<(), Box<dyn std::error::Error>> {
    let menu = build_tray_menu(app, language)?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("HeyEdit")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {
                log::warn!("Unhandled tray menu event: {:?}", event.id);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    log::info!("System tray created with language: {}", language);
    Ok(())
}

pub fn update_tray_language(app: &AppHandle, language: &str) -> Result<(), Box<dyn std::error::Error>> {
    let tray_id = TrayIconId::default();
    if let Some(tray) = app.tray_by_id(&tray_id) {
        let menu = build_tray_menu(app, language)?;
        tray.set_menu(Some(menu))?;
        log::info!("Tray menu updated to language: {}", language);
    }
    Ok(())
}
