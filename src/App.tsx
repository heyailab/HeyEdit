import { useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutProvider } from "@/components/layouts";
import { FileSidebar } from "@/components/sidebar/FileSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EditorPage } from "@/pages/EditorPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AboutPage } from "@/pages/AboutPage";
import { useConfigStore } from "@/stores/config-store";
import { useEditorStore } from "@/stores/editor-store";
import { useThemeSync } from "@/stores/theme-store";
import { useLogAttach, useConsoleForward } from "@/hooks/use-Log";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { openFile, newFile } from "@/lib/file-system";

function AppContent() {
  const { i18n } = useTranslation();
  const { config, load, loaded, setTheme } = useConfigStore();
  const { setOpenFile } = useEditorStore();

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

  // Sync theme to DOM
  useThemeSync();

  // Attach log bridge
  useLogAttach();
  useConsoleForward();

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
