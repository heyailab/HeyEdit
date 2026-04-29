import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Layout,
  Keyboard,
  Bell,
  ClipboardCopy,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "demo.title", path: "/" },
  { icon: Settings, labelKey: "settings.title", path: "/settings" },
  { icon: Layout, labelKey: "layout.switch", path: "/layout" },
  { icon: Keyboard, labelKey: "shortcuts.title", path: "/shortcuts" },
  { icon: Bell, labelKey: "notifications.title", path: "/notifications" },
  { icon: ClipboardCopy, labelKey: "clipboard.title", path: "/clipboard" },
  { icon: Info, labelKey: "settings.about", path: "/about" },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {t(item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
