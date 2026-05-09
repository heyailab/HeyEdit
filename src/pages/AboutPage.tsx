import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAppInfo } from "@/lib/commands";
import type { AppInfo } from "@/lib/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function VersionRow({ label, version }: { label: string; version: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline">{version}</Badge>
    </div>
  );
}

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

      {info ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{info.name} v{info.version}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <VersionRow label="Tauri" version={info.tauri_version} />
              <Row label="构建类型" value={info.build_type} />
              <Row label="Rust" value={info.rust_version} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">系统环境</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="操作系统" value={info.os} />
              <Row label="架构" value={info.arch} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">技术栈</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="React" value="19.2" />
              <Row label="Tauri" value="2.10" />
              <Row label="TipTap" value="3.22" />
              <Row label="TypeScript" value="5.9" />
              <Row label="Vite" value="6.3" />
              <Row label="Tailwind CSS" value="4.1" />
              <Row label="Zustand" value="5.0" />
              <Row label="markdown-it" value="14.1" />
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
    </div>
  );
}
