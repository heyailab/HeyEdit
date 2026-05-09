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
  dirtyContent: string;     // 当前编辑器内容的实时镜像（用于侧边栏关闭时保存）

  // 设置当前打开的文件
  setOpenFile: (file: OpenFile | null) => void;
  // 标记内容已被修改（dirty），需传入当前内容做比较
  markDirty: (content: string) => void;
  // 轻量标记 dirty，不做字符串比较（大文件场景每次按键使用）
  setDirty: () => void;
  // 同步当前的 dirty 内容到 store（去抖后调用）
  syncDirtyContent: (content: string) => void;
  // 标记为已保存（clean），更新 content 基准
  markSaved: (path: string, name: string, content: string) => void;
  // 添加到最近文件列表
  addRecentFile: (path: string) => void;
  // 从最近文件列表中移除
  removeRecentFile: (path: string) => void;
}

const MAX_RECENT = 20;

export const useEditorStore = create<EditorState>()((set, get) => ({
  openFile: null,
  recentFiles: [],
  dirtyContent: "",

  setOpenFile: (file) => {
    set({ openFile: file });
    if (file?.path) {
      get().addRecentFile(file.path);
    }
  },

  markDirty: (content) => {
    const { openFile } = get();
    if (!openFile) return;
    const dirty = content !== openFile.content;
    set({ openFile: { ...openFile, isDirty: dirty } });
  },

  // 轻量标记 — 不做完整字符串比较，大文件场景每次按键调用
  setDirty: () => {
    const { openFile } = get();
    if (!openFile || openFile.isDirty) return;
    set({ openFile: { ...openFile, isDirty: true } });
  },

  // 同步当前编辑器内容到 store（关闭时保存用）
  syncDirtyContent: (content) => {
    set({ dirtyContent: content });
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

  removeRecentFile: (path) => {
    set((state) => ({
      recentFiles: state.recentFiles.filter((p) => p !== path),
    }));
  },
}));
