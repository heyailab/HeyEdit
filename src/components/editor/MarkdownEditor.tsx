import { useEffect, useCallback, useMemo, useState, useRef, useDeferredValue, startTransition } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "@tiptap/markdown";
import markdownit from "markdown-it";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "@/stores/editor-store";
import { handleSave } from "@/lib/file-system";
import { showToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { EditorToolbar } from "./EditorToolbar";

const lowlight = createLowlight(common);

function hastToHtml(node: any): string {
  if (node.type === "text") {
    return node.value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  if (node.type === "element") {
    const classes = (node.properties?.className || []).join(" ");
    const cls = classes ? ` class="${classes}"` : "";
    const children = (node.children || []).map(hastToHtml).join("");
    return `<${node.tagName}${cls}>${children}</${node.tagName}>`;
  }
  if (node.type === "root") {
    return (node.children || []).map(hastToHtml).join("");
  }
  return "";
}

const md = markdownit({
  html: true,
  breaks: true,
  linkify: true,
  highlight(str: string, lang: string): string {
    if (lang) {
      try {
        const tree = lowlight.highlight(lang, str);
        if (tree.children && tree.children.length > 0) {
          return hastToHtml(tree);
        }
      } catch {
        // unsupported language — fall through to auto-escaped plain text
      }
    }
    return "";
  },
});

function isAbsolutePath(p: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith("/");
}

function resolvePath(baseDir: string, relative: string): string {
  const base = baseDir.replace(/\\/g, "/");
  const rel = relative.replace(/\\/g, "/");
  if (!base) return rel;
  const parts = base.split("/");
  for (const seg of rel.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") { parts.pop(); continue; }
    parts.push(seg);
  }
  return parts.join("/");
}

function getFileDir(filePath: string): string {
  if (!filePath) return "";
  const normalized = filePath.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(0, idx) : "";
}


// 大文件阈值：超过此大小默认编辑模式 + 显示加载进度
const LARGE_FILE_SIZE = 500_000; // 500KB

export function MarkdownEditor() {
  const { t } = useTranslation();
  const { openFile, markDirty, setDirty, syncDirtyContent } = useEditorStore();

  const contentSize = openFile?.content?.length ?? 0;
  const isLargeFile = contentSize > LARGE_FILE_SIZE;

  // 大文件始终从编辑模式开始（跳过昂贵的预览渲染）
  const [isPreview, _setIsPreview] = useState(
    () => !!(openFile?.path && !isLargeFile)
  );

  // Wrap setter: flush debounced content when switching to preview
  const setIsPreview = useCallback((value: boolean) => {
    if (value) {
      // Switching to preview — flush pending debounce so preview is current
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        const ed = editorRef.current;
        if (ed) {
          const markdown = ed.getMarkdown();
          startTransition(() => {
            setCurrentContent(markdown);
          });
          markDirty(markdown);
          syncDirtyContent(markdown);
        }
      }
    }
    _setIsPreview(value);
  }, [markDirty]);
  // 加载状态：大文件解析期间显示进度提示
  const [isLoading, setIsLoading] = useState(() => isLargeFile);
  const [loadingProgress, setLoadingProgress] = useState(0); // 0-100
  // 记录已加载完成的文件路径，避免重复解析
  const loadedPathRef = useRef<string | undefined>(undefined);

  // Local dirty state for instant UI response
  const [isDirtyLocal, setIsDirtyLocal] = useState(false);

  // Track current editor content for preview
  const [currentContent, setCurrentContent] = useState(
    () => openFile?.content ?? ""
  );

  // Refs for debounced serialization (critical for large files)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const isDirtyRef = useRef(false);

  // Defer heavy preview content to avoid blocking UI
  const deferredContent = useDeferredValue(currentContent);

  const fileDir = getFileDir(openFile?.path ?? "");

  // Post-process rendered HTML: replace local img src with asset:// URLs
  const resolveHtmlImages = useCallback(
    (html: string): string => {
      if (!fileDir) return html;
      // Fast bailout: skip expensive DOMParser for files without images
      if (html.indexOf("<img") === -1) return html;
      const doc = new DOMParser().parseFromString(html, "text/html");
      let changed = false;
      doc.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (!src || /^https?:\/\//i.test(src) || src.startsWith("data:")) return;
        const resolved = isAbsolutePath(src) ? src : resolvePath(fileDir, src);
        img.setAttribute("src", convertFileSrc(resolved));
        changed = true;
      });
      return changed ? doc.body.innerHTML : html;
    },
    [fileDir]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Markdown.configure({
        indentation: { style: "space", size: 2 },
      }),
      Placeholder.configure({
        placeholder: t("editor.placeholder"),
      }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    // 初始用空内容快速挂载，大文件内容由 useEffect 异步加载
    content: "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor }) => {
      // Keep a mutable ref so debounced callbacks always see the latest editor
      editorRef.current = editor;

      // Fast path: mark dirty immediately (boolean, no serialization)
      if (!isDirtyRef.current) {
        isDirtyRef.current = true;
        setIsDirtyLocal(true);
        setDirty();
      }

      // Debounce heavy serialization (getMarkdown is O(n) over full document)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const markdown = editor.getMarkdown();
        startTransition(() => {
          setCurrentContent(markdown);
        });
        markDirty(markdown); // accurate dirty check (compares full strings)
        syncDirtyContent(markdown); // keep store in sync for close-with-save
      }, 300);
    },
  });

  // 文件切换时加载内容（空文件/大文件避免重复解析）
  useEffect(() => {
    if (!editor) return;
    editorRef.current = editor;

    const newPath = openFile?.path ?? "";
    const newContent = openFile?.content ?? "";

    // 已加载过同一路径的内容，跳过
    if (loadedPathRef.current === newPath) return;

    // 清除上一文件的去抖定时器，防止旧回调污染新文件
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // 重置状态
    isDirtyRef.current = false;
    setIsDirtyLocal(false);

    // 小文件/空内容：用 addToHistory: false 防止计入 undo 历史
    if (!isLargeFile) {
      const { state: s, view: v } = editor;
      const { tr: t, doc: d, schema: sc } = s;
      if (newContent) {
        const storage = editor.storage as Record<string, any>;
        const manager = storage.markdown?.manager;
        const json = manager?.parse?.(newContent);
        if (json) {
          const node = sc.nodeFromJSON(json);
          t.setMeta("addToHistory", false);
          t.replaceWith(0, d.content.size, node.content);
          v.dispatch(t);
        } else {
          editor.commands.setContent(newContent, { contentType: "markdown" });
        }
      } else {
        editor.commands.setContent("", { contentType: "markdown" });
      }
      setCurrentContent(newContent);
      loadedPathRef.current = newPath;
      setIsLoading(false);
      if (openFile?.path) {
        _setIsPreview(true);
      }
      return;
    }

    // 大文件：分块加载，每块之间让出主线程保证 UI 响应
    _setIsPreview(false); // 大文件强制编辑模式，禁止预览
    setIsLoading(true);
    setLoadingProgress(0);

    // 按 ~100KB 分块，确保每块解析时间可控
    const CHUNK_SIZE = 100_000;
    const totalLen = newContent.length;
    const chunks: string[] = [];
    for (let i = 0; i < totalLen; i += CHUNK_SIZE) {
      chunks.push(newContent.slice(i, i + CHUNK_SIZE));
    }

    let cancelled = false;
    let chunkIndex = 0;

    function processNext() {
      if (cancelled || chunkIndex >= chunks.length) {
        if (!cancelled) {
          setCurrentContent(newContent);
          loadedPathRef.current = newPath;
          setIsLoading(false);
        }
        return;
      }

      const chunk = chunks[chunkIndex]!;
      const { state, view } = editor;
      const { tr, doc, schema } = state;
      const storage = editor.storage as Record<string, any>;

      // 用 MarkdownManager.parse 解析块 → ProseMirror Node
      const manager = storage.markdown?.manager;
      let parsedNode: any = null;
      if (manager?.parse) {
        try {
          const json = manager.parse(chunk);
          if (json && typeof json === "object") {
            parsedNode = schema.nodeFromJSON(json);
          }
        } catch { /* 解析失败回退 */ }
      }

      // 关键：禁止分块加载进入 undo 历史
      tr.setMeta("addToHistory", false);

      if (chunkIndex === 0) {
        if (parsedNode) {
          tr.replaceWith(0, doc.content.size, parsedNode.content);
        } else {
          tr.insertText(chunk, 0, doc.content.size);
        }
      } else {
        if (parsedNode) {
          let offset = doc.content.size;
          parsedNode.content.forEach((child: any) => {
            tr.insert(offset, child);
            offset += child.nodeSize;
          });
        } else {
          tr.insertText(chunk, doc.content.size);
        }
      }

      view.dispatch(tr);

      chunkIndex++;
      setLoadingProgress(Math.round((chunkIndex / chunks.length) * 100));
      requestAnimationFrame(() => {
        if (cancelled) return;
        requestAnimationFrame(processNext);
      });

      chunkIndex++;
      setLoadingProgress(Math.round((chunkIndex / chunks.length) * 100));

      // 双 rAF：让浏览器在块之间绘制 UI 和进度条
      requestAnimationFrame(() => {
        if (cancelled) return;
        requestAnimationFrame(processNext);
      });
    }

    // 第一帧先确保加载动画已绘制
    requestAnimationFrame(() => {
      if (cancelled) return;
      requestAnimationFrame(processNext);
    });

    return () => { cancelled = true; };
  }, [editor, openFile?.path, isLargeFile]);

  // Clean up editor instance + pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      editor?.destroy();
    };
  }, [editor]);

  const doSave = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    // Flush any pending debounce — save always uses the latest content
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    try {
      const markdown = ed.getMarkdown();
      const ok = await handleSave(markdown);
      if (ok) {
        startTransition(() => {
          setCurrentContent(markdown);
        });
        markDirty(markdown); // sync store to clean state
        syncDirtyContent(markdown);
        isDirtyRef.current = false;
        setIsDirtyLocal(false);
        showToast("文件已保存", "success");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`保存失败：${msg}`, "error");
    }
  }, [markDirty]);

  // Keyboard shortcut: Ctrl+S save
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        doSave();
      }
    },
    [doSave]
  );

  if (!openFile) {
    return null;
  }

  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  // Preview — only render when in preview mode (skip heavy parsing during edit)
  const previewHtml = useMemo(() => {
    if (!isPreview) return "";
    const raw = md.render(deferredContent);
    return resolveHtmlImages(raw);
  }, [isPreview, deferredContent, resolveHtmlImages]);

  return (
    <div className="flex flex-1 flex-col min-h-0" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        isPreview={isPreview}
        setIsPreview={setIsPreview}
        onSave={doSave}
        canSave={isDirtyLocal}
      />

      {/* Content area */}
      <div className="flex-1 overflow-auto select-text relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              正在加载文件...
              <span className="block text-xs mt-1">
                文件较大（{(contentSize / 1_000_000).toFixed(1)} MB），已加载 {loadingProgress}%
              </span>
            </p>
            <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}
        {isPreview ? (
          <div className="mx-auto px-12 py-8">
            <div
              className="tiptap-editor max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        ) : (
          <div className="mx-auto px-12 py-8">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between border-t bg-muted/30 px-4 py-1 text-xs text-muted-foreground select-none">
        <span className="truncate max-w-xs">
          {openFile.path || openFile.name}
          {(openFile.isDirty || isDirtyLocal) && (
            <span className="ml-2 text-amber-500">●</span>
          )}
        </span>
        <div className="flex gap-4">
          <span>{t("editor.word_count", { count: wordCount })}</span>
          <span>{t("editor.char_count", { count: charCount })}</span>
        </div>
      </div>
    </div>
  );
}
