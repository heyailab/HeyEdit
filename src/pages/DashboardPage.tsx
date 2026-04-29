import { useTranslation } from "react-i18next";
import {
  AppWindow,
  Palette,
  Globe,
  ScrollText,
  RefreshCw,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: AppWindow, key: "window_management", color: "text-blue-500" },
  { icon: Palette, key: "theme_system", color: "text-purple-500" },
  { icon: Globe, key: "i18n", color: "text-green-500" },
  { icon: ScrollText, key: "logging", color: "text-orange-500" },
  { icon: RefreshCw, key: "auto_update", color: "text-cyan-500" },
  { icon: Monitor, key: "system_tray", color: "text-pink-500" },
];

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("demo.welcome")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("demo.description")}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">{t("demo.features")}</h2>
          <Badge variant="secondary">6</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.key} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${feature.color}`}
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm">
                  {t(`demo.${feature.key}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t(`demo.${feature.key}`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
