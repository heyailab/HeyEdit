import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAppInfo } from "@/lib/commands";
import type { AppInfo } from "@/lib/types";

export function AboutPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    getAppInfo().then(setInfo).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("settings.about")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("app.name")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {info ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("app.version")}
                </span>
                <Badge variant="outline">{info.version}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tauri</span>
                <Badge variant="outline">{info.tauri_version}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">App Name</span>
                <span className="text-sm">{info.name}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
