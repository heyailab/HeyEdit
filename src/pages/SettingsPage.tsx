import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun, Monitor, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfigStore } from "@/stores/config-store";
import { getAutostartEnabled, setAutostartEnabled } from "@/lib/commands";
import { check } from "@tauri-apps/plugin-updater";
import type { AppConfig } from "@/lib/types";

type UpdateStatus =
  | { stage: "idle" }
  | { stage: "checking" }
  | { stage: "up-to-date" }
  | { stage: "available"; version: string; body?: string; date?: string }
  | { stage: "downloading"; progress: number; total?: number }
  | { stage: "installing" }
  | { stage: "done" }
  | { stage: "error"; message: string };

const themes: { value: AppConfig["theme"]; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { value: "light", icon: Sun, labelKey: "settings.theme_light" },
  { value: "dark", icon: Moon, labelKey: "settings.theme_dark" },
  { value: "system", icon: Monitor, labelKey: "settings.theme_system" },
];

const languages = [
  { value: "en", labelKey: "settings.language_en" },
  { value: "zh", labelKey: "settings.language_zh" },
];

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { config, setTheme, setLanguage, update } = useConfigStore();
  const [autostart, setAutostart] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ stage: "idle" });
  const updateRef = useRef<Awaited<ReturnType<typeof check>>>(null);

  useEffect(() => {
    getAutostartEnabled().then(setAutostart).catch(console.error);
  }, []);

  const handleAutostartChange = async (enabled: boolean) => {
    try {
      await setAutostartEnabled(enabled);
      setAutostart(enabled);
      await update({ autostart: enabled });
    } catch (e) {
      console.error("Failed to set autostart:", e);
    }
  };

  const handleThemeChange = async (theme: AppConfig["theme"]) => {
    await setTheme(theme);
  };

  const handleLanguageChange = async (lang: string) => {
    await setLanguage(lang);
    await i18n.changeLanguage(lang);
  };

  const handleCheckUpdate = useCallback(async () => {
    setUpdateStatus({ stage: "checking" });
    try {
      const update = await check();
      updateRef.current = update;
      if (!update) {
        setUpdateStatus({ stage: "up-to-date" });
        return;
      }
      setUpdateStatus({
        stage: "available",
        version: update.version,
        body: update.body,
        date: update.date,
      });
    } catch (e) {
      setUpdateStatus({
        stage: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;
    try {
      let downloaded = 0;
      let totalSize: number | undefined;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalSize = event.data.contentLength;
            setUpdateStatus({ stage: "downloading", progress: 0, total: totalSize });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setUpdateStatus({ stage: "downloading", progress: downloaded, total: totalSize });
            break;
          case "Finished":
            setUpdateStatus({ stage: "done" });
            break;
        }
      });
    } catch (e) {
      setUpdateStatus({
        stage: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("settings.title")}
      </h1>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("settings.theme")}</label>
            <div className="flex gap-2">
              {themes.map(({ value, icon: Icon, labelKey }) => (
                <Button
                  key={value}
                  variant={config.theme === value ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleThemeChange(value)}
                >
                  <Icon className="h-4 w-4" />
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("settings.language")}
            </label>
            <div className="flex gap-2">
              {languages.map(({ value, labelKey }) => (
                <Button
                  key={value}
                  variant={config.language === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLanguageChange(value)}
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.general")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.autostart")}</p>
              <p className="text-xs text-muted-foreground">
                {t("settings.autostart_desc")}
              </p>
            </div>
            <Switch
              checked={autostart}
              onCheckedChange={handleAutostartChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {t("settings.close_to_tray")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("settings.close_to_tray_desc")}
              </p>
            </div>
            <Switch
              checked={config.close_to_tray}
              onCheckedChange={(v) => update({ close_to_tray: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Update */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.update")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Idle / Up-to-date / Error → show Check button */}
          {(updateStatus.stage === "idle" ||
            updateStatus.stage === "up-to-date" ||
            updateStatus.stage === "error") && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckUpdate}
              >
                {t("settings.check_update")}
              </Button>
              {updateStatus.stage === "up-to-date" && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  {t("settings.no_update")}
                </p>
              )}
              {updateStatus.stage === "error" && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {updateStatus.message}
                </p>
              )}
            </div>
          )}

          {/* Checking */}
          {updateStatus.stage === "checking" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在检查更新...
            </div>
          )}

          {/* Available → show version + download button */}
          {updateStatus.stage === "available" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  新版本{" "}
                  <span className="text-primary">{updateStatus.version}</span>
                </p>
                {updateStatus.date && (
                  <p className="text-xs text-muted-foreground">{updateStatus.date}</p>
                )}
                {updateStatus.body && (
                  <div className="text-xs text-muted-foreground max-h-32 overflow-auto whitespace-pre-wrap border rounded-md p-2 mt-2">
                    {updateStatus.body}
                  </div>
                )}
              </div>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5 mr-1" />
                下载并安装
              </Button>
            </div>
          )}

          {/* Downloading → progress bar */}
          {updateStatus.stage === "downloading" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在下载更新...
                <span className="font-medium text-foreground">
                  {updateStatus.total
                    ? `${Math.round((updateStatus.progress / updateStatus.total) * 100)}%`
                    : `${(updateStatus.progress / 1_000_000).toFixed(1)} MB`}
                </span>
              </p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: updateStatus.total
                      ? `${Math.round((updateStatus.progress / updateStatus.total) * 100)}%`
                      : "20%",
                  }}
                />
              </div>
              {updateStatus.total && (
                <p className="text-xs text-muted-foreground">
                  {(updateStatus.progress / 1_000_000).toFixed(1)} /{" "}
                  {(updateStatus.total / 1_000_000).toFixed(1)} MB
                </p>
              )}
            </div>
          )}

          {/* Done */}
          {updateStatus.stage === "done" && (
            <div className="space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                安装完成，请重启应用以完成更新
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
