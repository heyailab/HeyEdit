import { useTranslation } from "react-i18next";
import {
  PanelLeft,
  PanelTop,
  Columns2,
  Maximize,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useConfigStore } from "@/stores/config-store";
import { cn } from "@/lib/utils";
import type { LayoutType } from "@/lib/types";

interface LayoutOption {
  type: LayoutType;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  preview: React.ReactNode;
}

function MiniPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-20 rounded border bg-muted/30 overflow-hidden">
      {children}
    </div>
  );
}

const layouts: LayoutOption[] = [
  {
    type: "sidebar",
    icon: PanelLeft,
    labelKey: "layout.sidebar",
    preview: (
      <MiniPreview>
        <div className="flex h-full">
          <div className="w-1/4 border-r bg-muted/50" />
          <div className="flex-1" />
        </div>
      </MiniPreview>
    ),
  },
  {
    type: "header",
    icon: PanelTop,
    labelKey: "layout.header",
    preview: (
      <MiniPreview>
        <div className="flex h-full flex-col">
          <div className="h-1/4 border-b bg-muted/50" />
          <div className="flex-1" />
        </div>
      </MiniPreview>
    ),
  },
  {
    type: "sidebar-header",
    icon: Columns2,
    labelKey: "layout.sidebar_header",
    preview: (
      <MiniPreview>
        <div className="flex h-full">
          <div className="w-1/4 border-r bg-muted/50" />
          <div className="flex flex-1 flex-col">
            <div className="h-1/4 border-b bg-muted/30" />
            <div className="flex-1" />
          </div>
        </div>
      </MiniPreview>
    ),
  },
  {
    type: "fullscreen",
    icon: Maximize,
    labelKey: "layout.fullscreen",
    preview: (
      <MiniPreview>
        <div className="h-full" />
      </MiniPreview>
    ),
  },
];

export function LayoutPage() {
  const { t } = useTranslation();
  const { config, setLayout } = useConfigStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("layout.switch")}
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {layouts.map((layout) => (
          <Card
            key={layout.type}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              config.layout === layout.type && "ring-2 ring-primary"
            )}
            onClick={() => setLayout(layout.type)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <layout.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{t(layout.labelKey)}</span>
              </div>
              {layout.preview}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
