import { useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { LayoutProvider } from "@/components/layouts";
import { FileSidebar } from "@/components/sidebar/FileSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/ui/toast";
import { EditorPage } from "@/pages/EditorPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AboutPage } from "@/pages/AboutPage";
import { useConfigStore } from "@/stores/config-store";
import { useEditorStore } from "@/stores/editor-store";
import { useThemeSync } from "@/stores/theme-store";
import { useLogAttach, useConsoleForward } from "@/hooks/use-Log";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { openFile, newFile } from "@/lib/file-system";
import { getPendingFiles } from "@/lib/commands";

function AppContent() {
  const { i18n } = useTranslation();
  const { config, load, loaded, setTheme } = useConfigStore();
  const { setOpenFile } = useEditorStore();

  // 统一的文件打开逻辑（供启动恢复 + 运行时事件共用）
  const openFileAtPath = useCallback(
    async (path: string) => {
      console.log("[openFileAtPath] opening:", path);
      interface ReadResult {
        content: string;
        encoding: string;
        size_warning?: string;
      }
      try {
        const result = await invoke<ReadResult>("read_file_with_encoding", { path });
        console.log("[openFileAtPath] loaded, encoding:", result.encoding, "size:", result.content.length);
        if (result.size_warning) {
          console.warn(result.size_warning);
        }
        setOpenFile({
          path,
          name: path.replace(/\\/g, "/").split("/").pop() ?? path,
          content: result.content,
          isDirty: false,
        });
      } catch (err) {
        console.error("[openFileAtPath] failed:", err);
      }
    },
    [setOpenFile],
  );

  // Load persisted config on mount
  useEffect(() => {
    load();
  }, [load]);

  // Sync language when config loads
  useEffect(() => {
    if (loaded && config.language !== i18n.language) {
      i18n.changeLanguage(config.language);
    }
  }, [loaded, config.language, i18n]);

  // Sync tray menu language to backend
  useEffect(() => {
    if (loaded) {
      invoke("update_tray_language", { language: config.language }).catch(() => {});
    }
  }, [loaded, config.language]);

  // 检查启动时通过文件关联/右键打开传入的文件路径
  useEffect(() => {
    getPendingFiles()
      .then((files) => {
        console.log("[startup] getPendingFiles returned:", files.length, "files:", files);
        for (const path of files) {
          openFileAtPath(path);
        }
      })
      .catch((err) => {
        console.error("[startup] getPendingFiles failed:", err);
      });
  }, [openFileAtPath]);

  // Sync theme to DOM
  useThemeSync();

  // Attach log bridge
  useLogAttach();
  useConsoleForward();

  // 监听系统文件关联/右键打开事件（运行时）
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<string>("open-file", (event) => {
      const path = event.payload;
      console.log("[open-file event] received path:", path);
      if (!path) return;
      openFileAtPath(path);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [openFileAtPath]);

  // Global keyboard shortcuts
  const handleOpenFile = useCallback(async () => {
    try {
      const file = await openFile();
      if (file) setOpenFile(file);
    } catch (e) {
      console.error("Open file failed:", e);
    }
  }, [setOpenFile]);

  useKeyboardShortcut([
    {
      key: "d",
      ctrl: true,
      handler: () => {
        const next = config.theme === "dark" ? "light" : "dark";
        setTheme(next);
      },
    },
    {
      key: "n",
      ctrl: true,
      handler: () => {
        setOpenFile(newFile());
      },
    },
    {
      key: "o",
      ctrl: true,
      handler: () => {
        handleOpenFile();
      },
    },
    // Ctrl+S is handled inside MarkdownEditor to get editor HTML
  ]);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <LayoutProvider
      sidebar={<FileSidebar />}
    >
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route
          path="/settings"
          element={
            <div className="flex-1 overflow-auto p-6">
              <SettingsPage />
            </div>
          }
        />
        <Route
          path="/about"
          element={
            <div className="flex-1 overflow-auto p-6">
              <AboutPage />
            </div>
          }
        />
      </Routes>
      <ToastContainer />
    </LayoutProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
