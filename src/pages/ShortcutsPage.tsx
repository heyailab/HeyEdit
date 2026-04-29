import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Shortcut {
  keys: string[];
  labelKey: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Ctrl", "D"], labelKey: "shortcuts.toggle_theme" },
  { keys: ["Ctrl", "B"], labelKey: "shortcuts.toggle_sidebar" },
  { keys: ["Ctrl", ","], labelKey: "shortcuts.settings" },
  { keys: ["Ctrl", "K"], labelKey: "shortcuts.search" },
];

export function ShortcutsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("shortcuts.title")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("shortcuts.global")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm">{t(shortcut.labelKey)}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key) => (
                    <Badge key={key} variant="outline" className="font-mono text-xs">
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
