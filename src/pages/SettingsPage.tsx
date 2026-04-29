import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfigStore } from "@/stores/config-store";
import {
  getAutostartEnabled,
  setAutostartEnabled,
  checkForUpdate,
} from "@/lib/commands";
import type { AppConfig, UpdateInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

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

  const handleCheckUpdate = async () => {
    setChecking(true);
    try {
      const info = await checkForUpdate();
      setUpdateInfo(info);
    } catch (e) {
      console.error("Update check failed:", e);
    } finally {
      setChecking(false);
    }
  };

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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("settings.update_endpoint")}
            </label>
            <Input
              placeholder={t("settings.update_endpoint_placeholder")}
              value={config.update_endpoint}
              onChange={(e) => update({ update_endpoint: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckUpdate}
              disabled={checking}
            >
              {checking ? "..." : t("settings.check_update")}
            </Button>
            {updateInfo && (
              <span
                className={cn(
                  "text-sm",
                  updateInfo.available
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                {updateInfo.available
                  ? t("settings.update_version", {
                      version: updateInfo.version,
                    })
                  : t("settings.no_update")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
