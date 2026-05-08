/**
 * HeyEdit 文件系统操作工具
 * 基于 Tauri commands + @tauri-apps/plugin-dialog
 * 读取文件使用 Rust 端自动编码检测，解决 GBK 乱码问题
 */
import { invoke } from "@tauri-apps/api/core";
import { open as dialogOpen, save as dialogSave } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "@/stores/editor-store";
import { showToast } from "@/components/ui/toast";
import type { OpenFile } from "@/stores/editor-store";

const MD_FILTERS = [
  { name: "Markdown", extensions: ["md", "markdown", "txt"] },
  { name: "All Files", extensions: ["*"] },
];

/** 从路径中提取文件名 */
function baseName(filePath: string): string {
  return filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
}

/** 打开文件对话框并读取文件（自动检测编码） */
export async function openFile(): Promise<OpenFile | null> {
  const selected = await dialogOpen({
    multiple: false,
    filters: MD_FILTERS,
  });

  if (!selected || Array.isArray(selected)) return null;

  // 使用 Rust 端命令，自动检测 GBK/UTF-8/UTF-16 等编码
  interface ReadResult {
    content: string;
    encoding: string;
    size_warning?: string;
  }
  const result = await invoke<ReadResult>(
    "read_file_with_encoding",
    { path: selected }
  );

  if (result.size_warning) {
    showToast(result.size_warning, "warning");
  }

  return {
    path: selected,
    name: baseName(selected),
    content: result.content,
    isDirty: false,
  };
}

/** 保存到已知路径 */
export async function saveFile(
  path: string,
  content: string
): Promise<void> {
  await invoke("write_file_utf8", { path, content });
}

/** 另存为：弹出对话框选择路径 */
export async function saveFileAs(content: string): Promise<{ path: string; name: string } | null> {
  const savePath = await dialogSave({
    defaultPath: "untitled.md",
    filters: MD_FILTERS,
  });

  if (!savePath) return null;

  await invoke("write_file_utf8", { path: savePath, content });
  return { path: savePath, name: baseName(savePath) };
}

/** 新建文件（直接在 store 中创建内存文件） */
export function newFile(): OpenFile {
  return {
    path: "",
    name: "untitled.md",
    content: "",
    isDirty: false,
  };
}

/**
 * 执行保存逻辑（Ctrl+S）：
 * - 有路径 → 直接保存
 * - 无路径（新建文件）→ 触发另存为
 * 成功后更新 store。
 */
export async function handleSave(currentContent: string): Promise<boolean> {
  const { openFile: file, markSaved } = useEditorStore.getState();
  if (!file) return false;

  if (file.path) {
    await saveFile(file.path, currentContent);
    markSaved(file.path, file.name, currentContent);
    return true;
  } else {
    // 新建文件：另存为
    const result = await saveFileAs(currentContent);
    if (result) {
      markSaved(result.path, result.name, currentContent);
      return true;
    }
    return false;
  }
}
