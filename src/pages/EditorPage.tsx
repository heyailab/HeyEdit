import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileText, FolderOpen } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { openFile, newFile } from "@/lib/file-system";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";

export function EditorPage() {
  const { t } = useTranslation();
  const { openFile: currentFile, setOpenFile } = useEditorStore();

  const handleOpenFile = useCallback(async () => {
    try {
      const file = await openFile();
      if (file) setOpenFile(file);
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  }, [setOpenFile]);

  const handleNewFile = useCallback(() => {
    setOpenFile(newFile());
  }, [setOpenFile]);

  // If a file is open, show the editor
  if (currentFile) {
    return <MarkdownEditor />;
  }

  // Empty state
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 select-none">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">{t("editor.no_open_file")}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("editor.open_or_new")}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleNewFile}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileText className="h-4 w-4" />
          {t("editor.new_button")}
        </button>
        <button
          onClick={handleOpenFile}
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <FolderOpen className="h-4 w-4" />
          {t("editor.open_button")}
        </button>
      </div>
    </div>
  );
}
