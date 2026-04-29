import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FilePlus, FolderOpen, FileText, Settings, Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "@/stores/editor-store";
import { openFile, newFile } from "@/lib/file-system";

export function FileSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { openFile: currentFile, recentFiles, setOpenFile } = useEditorStore();

  const handleNew = useCallback(() => {
    setOpenFile(newFile());
    navigate("/");
  }, [setOpenFile, navigate]);

  const handleOpen = useCallback(async () => {
    try {
      const file = await openFile();
      if (file) {
        setOpenFile(file);
        navigate("/");
      }
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  }, [setOpenFile, navigate]);

  const handleOpenRecent = useCallback(
    async (filePath: string) => {
      try {
        const result = await invoke<{ content: string; encoding: string }>(
          "read_file_with_encoding",
          { path: filePath }
        );
        const name = filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
        setOpenFile({ path: filePath, name, content: result.content, isDirty: false });
        navigate("/");
      } catch (e) {
        console.error("Failed to open recent file:", e);
      }
    },
    [setOpenFile, navigate]
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Action buttons */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <button
          onClick={handleNew}
          title={t("editor.new_file")}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <FilePlus className="h-4 w-4" />
        </button>
        <button
          onClick={handleOpen}
          title={t("editor.open_file")}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
        <span className="ml-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("sidebar.files")}
        </span>
      </div>

      {/* Recent files list */}
      <div className="flex-1 overflow-auto py-1">
        {recentFiles.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            {t("sidebar.no_files")}
          </div>
        ) : (
          recentFiles.map((filePath) => {
            const name = filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
            const isActive = location.pathname === "/" && currentFile?.path === filePath;
            return (
              <button
                key={filePath}
                onClick={() => handleOpenRecent(filePath)}
                title={filePath}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t p-1">
        <button
          onClick={() => navigate("/settings")}
          className={cn(
            "flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors",
            location.pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          {t("settings.title")}
        </button>
        <button
          onClick={() => navigate("/about")}
          className={cn(
            "flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors",
            location.pathname === "/about"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Info className="h-3.5 w-3.5 shrink-0" />
          {t("settings.about")}
        </button>
      </div>
    </div>
  );
}

