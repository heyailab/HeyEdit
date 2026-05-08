import { memo } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code2,
  Undo2,
  Redo2,
  Eye,
  Pencil,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "primary";
}

function ToolbarButton({ onClick, isActive, disabled, title, children, variant = "default" }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:border disabled:border-border"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        isActive && variant === "default" && "bg-accent text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />;
}

interface EditorToolbarProps {
  editor: Editor | null;
  isPreview: boolean;
  setIsPreview: (v: boolean) => void;
  onSave: () => void;
  canSave: boolean;
}

export const EditorToolbar = memo(function EditorToolbar({ editor, isPreview, setIsPreview, onSave, canSave }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className={cn(
      "flex shrink-0 flex-wrap items-center justify-between gap-0.5 border-b bg-background px-3 py-1.5 select-none",
      // 左侧模式指示条：编辑模式主色，预览模式灰色
      isPreview
        ? "border-l-2 border-l-muted-foreground/30 pl-[10px]"
        : "border-l-2 border-l-primary pl-[10px]"
    )}>
      {/* Left: formatting tools (hidden in preview) */}
      <div className={cn(
        "flex items-center gap-0.5 transition-opacity duration-200",
        isPreview && "opacity-25 pointer-events-none cursor-not-allowed"
      )}>
        {/* Undo / Redo */}
        <ToolbarButton
          title="撤销 (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="重做 (Ctrl+Y)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          title="标题 1"
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="标题 2"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="标题 3"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Inline formatting */}
        <ToolbarButton
          title="加粗 (Ctrl+B)"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="斜体 (Ctrl+I)"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="下划线 (Ctrl+U)"
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="删除线"
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="行内代码"
          isActive={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Blocks */}
        <ToolbarButton
          title="无序列表"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="有序列表"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="引用块"
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="代码块"
          isActive={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="分割线"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Right: mode toggle + save */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          title={isPreview ? "编辑 (Ctrl+E)" : "预览 (Ctrl+E)"}
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </ToolbarButton>
        <ToolbarButton
          title="保存 (Ctrl+S)"
          onClick={onSave}
          disabled={!canSave}
          variant="primary"
        >
          <Save className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </div>
  );
});
