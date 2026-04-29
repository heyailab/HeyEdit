import { create } from "zustand";

export interface OpenFile {
  path: string;         // 磁盘绝对路径，新建未保存则为空字符串
  name: string;         // 文件名（含扩展名）
  content: string;      // 磁盘上原始内容（用于判断是否有未保存更改）
  isDirty: boolean;     // 是否有未保存更改
}

interface EditorState {
  openFile: OpenFile | null;
  recentFiles: string[];    // 最近打开的文件路径列表

  // 设置当前打开的文件
  setOpenFile: (file: OpenFile | null) => void;
  // 标记内容已被修改（dirty）
  markDirty: (content: string) => void;
  // 标记为已保存（clean），更新 content 基准
  markSaved: (path: string, name: string, content: string) => void;
  // 添加到最近文件列表
  addRecentFile: (path: string) => void;
}

const MAX_RECENT = 20;

export const useEditorStore = create<EditorState>()((set, get) => ({
  openFile: null,
  recentFiles: [],

  setOpenFile: (file) => {
    set({ openFile: file });
    if (file?.path) {
      get().addRecentFile(file.path);
    }
  },

  markDirty: (content) => {
    const { openFile } = get();
    if (!openFile) return;
    // Only mark dirty if content actually differs from saved baseline
    const dirty = content !== openFile.content;
    set({ openFile: { ...openFile, isDirty: dirty } });
  },

  markSaved: (path, name, content) => {
    set({
      openFile: { path, name, content, isDirty: false },
    });
    if (path) get().addRecentFile(path);
  },

  addRecentFile: (path) => {
    set((state) => {
      const filtered = state.recentFiles.filter((p) => p !== path);
      return { recentFiles: [path, ...filtered].slice(0, MAX_RECENT) };
    });
  },
}));
