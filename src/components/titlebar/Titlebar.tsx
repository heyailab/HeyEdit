import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { Minus, X, Maximize2, Copy } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

const appWindow = getCurrentWindow();

export function Titlebar() {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);
  const { openFile } = useEditorStore();

  const checkMaximized = useCallback(async () => {
    const maximized = await appWindow.isMaximized();
    setIsMaximized(maximized);
  }, []);

  useEffect(() => {
    checkMaximized();
    const unlisten = appWindow.onResized(() => {
      checkMaximized();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [checkMaximized]);

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.hide();

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    appWindow.toggleMaximize();
  };

  const titleText = openFile
    ? `${openFile.isDirty ? "● " : ""}${openFile.name} — HeyEdit`
    : "HeyEdit";

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="flex h-8 shrink-0 items-center justify-between border-b bg-background select-none"
    >
      {/* Left: Drag handle + App title / current file */}
      <div
        className="flex h-full flex-1 items-center gap-2 px-3 text-xs font-medium text-muted-foreground"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {openFile?.isDirty && (
          <span className="text-amber-500 text-xs leading-none">●</span>
        )}
        <span>{openFile ? openFile.name : "HeyEdit"}</span>
      </div>

      {/* Center: App name */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground pointer-events-none"
        title={titleText}
      >
        HeyEdit
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <Tooltip content={t("titlebar.minimize")}>
          <button
            onClick={handleMinimize}
            className={cn(
              "inline-flex h-8 w-10 items-center justify-center",
              "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            )}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        <Tooltip content={isMaximized ? t("titlebar.restore") : t("titlebar.maximize")}>
          <button
            onClick={handleMaximize}
            className={cn(
              "inline-flex h-8 w-10 items-center justify-center",
              "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            )}
          >
            {isMaximized ? (
              <Copy className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </Tooltip>

        <Tooltip content={t("titlebar.close")}>
          <button
            onClick={handleClose}
            className={cn(
              "inline-flex h-8 w-10 items-center justify-center",
              "text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
