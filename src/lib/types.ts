/** Mirror of Rust AppConfig struct */
export interface AppConfig {
  language: string;
  theme: "light" | "dark" | "system";
  layout: LayoutType;
  autostart: boolean;
  close_to_tray: boolean;
  update_endpoint: string;
}

export type LayoutType = "sidebar" | "header" | "sidebar-header" | "fullscreen";

export interface AppInfo {
  name: string;
  version: string;
  tauri_version: string;
  os: string;
  arch: string;
  build_type: string;
  rust_version: string;
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
  date?: string;
}
