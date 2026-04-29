import { useState, useCallback } from "react";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (e) {
      console.error("Clipboard write failed:", e);
      return false;
    }
  }, []);

  const paste = useCallback(async () => {
    try {
      return await readText();
    } catch (e) {
      console.error("Clipboard read failed:", e);
      return "";
    }
  }, []);

  return { copy, paste, copied };
}
