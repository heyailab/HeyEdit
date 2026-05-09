use serde::Serialize;
use tauri::command;

#[derive(Debug, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub tauri_version: String,
    pub os: String,
    pub arch: String,
    pub build_type: String,
    pub rust_version: String,
}

#[command]
pub async fn get_app_info() -> Result<AppInfo, String> {
    let (os_name, arch) = if cfg!(target_os = "windows") {
        let ver = if cfg!(target_arch = "x86_64") { "x64" }
            else if cfg!(target_arch = "aarch64") { "ARM64" }
            else { "unknown" };
        ("Windows".to_string(), ver.to_string())
    } else if cfg!(target_os = "macos") {
        ("macOS".to_string(), if cfg!(target_arch = "aarch64") { "Apple Silicon" } else { "x64" }.to_string())
    } else if cfg!(target_os = "linux") {
        ("Linux".to_string(), if cfg!(target_arch = "x86_64") { "x64" } else { "unknown" }.to_string())
    } else {
        (std::env::consts::OS.to_string(), std::env::consts::ARCH.to_string())
    };

    Ok(AppInfo {
        name: "HeyEdit".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        tauri_version: tauri::VERSION.to_string(),
        os: os_name,
        arch,
        build_type: if cfg!(debug_assertions) { "Debug".into() } else { "Release".into() },
        rust_version: env!("CARGO_PKG_RUST_VERSION", "unknown").to_string(),
    })
}
