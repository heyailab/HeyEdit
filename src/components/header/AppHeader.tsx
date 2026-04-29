import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "demo.title",
  "/settings": "settings.title",
  "/layout": "layout.switch",
  "/shortcuts": "shortcuts.title",
  "/notifications": "notifications.title",
  "/clipboard": "clipboard.title",
  "/about": "settings.about",
};

export function AppHeader() {
  const { t } = useTranslation();
  const location = useLocation();

  const titleKey = routeTitles[location.pathname] ?? "app.name";

  return (
    <div className="flex flex-1 items-center justify-between">
      <span className="text-sm font-medium">{t(titleKey)}</span>
    </div>
  );
}
