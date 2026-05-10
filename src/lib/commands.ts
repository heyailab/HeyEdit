import { invoke } from "@tauri-apps/api/core";
import type { AppConfig, AppInfo, UpdateInfo } from "./types";

// Window commands
export const toggleMaximize = () => invoke("toggle_maximize");
export const minimizeWindow = () => invoke("minimize_window");
export const closeWindow = () => invoke("close_window");
export const hideWindow = () => invoke("hide_window");
export const showWindow = () => invoke("show_window");
export const isMaximized = () => invoke<boolean>("is_maximized");

// Config commands
export const getAppConfig = () => invoke<AppConfig>("get_app_config");
export const setAppConfig = (config: AppConfig) =>
  invoke("set_app_config", { config });

// System commands
export const getAppInfo = () => invoke<AppInfo>("get_app_info");

// Autostart commands
export const getAutostartEnabled = () =>
  invoke<boolean>("get_autostart_enabled");
export const setAutostartEnabled = (enabled: boolean) =>
  invoke("set_autostart_enabled", { enabled });

// Updater commands
export const checkForUpdate = () => invoke<UpdateInfo>("check_for_update");

// File association commands
export const getPendingFiles = () => invoke<string[]>("get_pending_files");
