import { useEffect, useCallback, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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
import { EditorToolbar } from "./EditorToolbar";

const lowlight = createLowlight(common);
const md = markdownit({ html: true, breaks: true, linkify: true });

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
  const { openFile, markDirty } = useEditorStore();
  const [isPreview, setIsPreview] = useState(true);

  const fileDir = getFileDir(openFile?.path ?? "");

  // Post-process rendered HTML: replace local img src with asset:// URLs
  const resolveHtmlImages = useCallback(
    (html: string): string => {
      if (!fileDir) return html;
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
      const markdown = (editor as any).getMarkdown() as string;
      markDirty(markdown);
    },
  });

  // When the open file changes, reset editor content and switch to preview
  useEffect(() => {
    if (!editor) return;
    const newContent = openFile?.content ?? "";
    const currentMd = (editor as any).getMarkdown() as string;
    if (currentMd !== newContent) {
      editor.commands.setContent(newContent, { contentType: "markdown" });
      setIsPreview(true);
    }
  }, [editor, openFile?.path]);

  // Clean up editor instance on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const doSave = useCallback(async () => {
    if (!editor) return;
    const markdown = (editor as any).getMarkdown() as string;
    await handleSave(markdown);
  }, [editor]);

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

  const previewHtml = useMemo(() => {
    const raw = md.render(openFile.content ?? "");
    return resolveHtmlImages(raw);
  }, [openFile.content, resolveHtmlImages]);

  return (
    <div className="flex flex-1 flex-col min-h-0" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        isPreview={isPreview}
        setIsPreview={setIsPreview}
        onSave={doSave}
        canSave={openFile.isDirty}
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
          {openFile.isDirty && (
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
