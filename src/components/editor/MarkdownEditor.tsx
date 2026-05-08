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


export function MarkdownEditor() {
  const { t } = useTranslation();
  const { openFile, markDirty, setDirty } = useEditorStore();

  // New files (no path) start in edit mode; saved files start in preview
  const [isPreview, _setIsPreview] = useState(() => !!openFile?.path);

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
        }
      }
    }
    _setIsPreview(value);
  }, [markDirty]);
  // Local dirty state for instant UI response (large files: avoids full serialization on every keystroke)
  const [isDirtyLocal, setIsDirtyLocal] = useState(false);

  // Track current editor content so preview always shows latest edits
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
    content: openFile?.content ?? "",
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
      }, 300);
    },
  });

  // When the open file changes, reset editor content and switch to preview
  useEffect(() => {
    if (!editor) return;
    editorRef.current = editor;
    const newContent = openFile?.content ?? "";
    const currentMd = editor.getMarkdown();
    if (currentMd !== newContent) {
      editor.commands.setContent(newContent, { contentType: "markdown" });
      setCurrentContent(newContent);
      // Reset dirty state when file changes
      isDirtyRef.current = false;
      setIsDirtyLocal(false);
      // Reset to preview for existing files; stay in edit for new files
      if (openFile?.path) {
        setIsPreview(true);
      }
    }
  }, [editor, openFile?.path]);

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
        isDirtyRef.current = false;
        setIsDirtyLocal(false);
        showToast("文件已保存", "success");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`保存失败：${msg}`, "error");
    }
  }, [markDirty]);

  // Keyboard shortcut: Ctrl+S / Cmd+S → save
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        await doSave();
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
      <div className="flex-1 overflow-auto select-text">
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
