use serde::Serialize;
#[allow(unused_imports)]  // <-- 添加这一行
use tauri::{command, AppHandle, Manager};
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Serialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
    pub body: Option<String>,
    pub date: Option<String>,
}

#[command]
pub async fn check_for_update(app: AppHandle) -> Result<UpdateInfo, String> {
    // 示例：如何获取全局状态（可取消注释直接使用）
    // let config = app.state::<crate::AppConfig>();
    
    // 示例：如何向前端发送事件
    // app.emit("update-progress", "checking").unwrap();

    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => Ok(UpdateInfo {
            available: true,
            version: Some(update.version.clone()),
            body: update.body.clone(),
            date: update.date.map(|d| d.to_string()),
        }),
        Ok(None) => Ok(UpdateInfo {
            available: false,
            version: None,
            body: None,
            date: None,
        }),
        Err(e) => {
            log::error!("Update check failed: {}", e);
            Err(e.to_string())
        }
    }
}