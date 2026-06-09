"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { getFieldError, hasFieldError, type FieldErrors } from "@/lib/admin/field-errors";
import { sanitizeProductHtml } from "@/lib/admin/sanitize-html";

type Props = {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (html: string) => void;
  errors?: FieldErrors;
};

type BlockType = "paragraph" | "h2" | "h3";

export function AdminRichTextEditor({
  label,
  fieldKey,
  value,
  onChange,
  errors,
}: Props) {
  const error = getFieldError(errors ?? {}, fieldKey);
  const invalid = hasFieldError(errors ?? {}, fieldKey);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-lagari-brass underline" },
      }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded-sm" } }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "admin-tiptap-editor min-h-[180px] px-4 py-3 outline-none",
        "aria-label": label,
        "aria-invalid": error ? "true" : "false",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(sanitizeProductHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "<p></p>";
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div data-admin-field={fieldKey} className="block">
        <span className="text-sm font-medium text-lagari-muted">{label}</span>
        <div className="admin-card mt-2 min-h-[220px] animate-pulse bg-lagari-elevated" />
      </div>
    );
  }

  const ed = editor;

  const blockType: BlockType = ed.isActive("heading", { level: 2 })
    ? "h2"
    : ed.isActive("heading", { level: 3 })
      ? "h3"
      : "paragraph";

  function setBlockType(type: BlockType) {
    if (type === "paragraph") {
      ed.chain().focus().setParagraph().run();
    } else {
      ed.chain().focus().toggleHeading({ level: type === "h2" ? 2 : 3 }).run();
    }
  }

  function setLink() {
    const prev = ed.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function setImage() {
    const url = window.prompt("Image URL", "https://");
    if (!url?.trim()) return;
    ed.chain().focus().setImage({ src: url.trim() }).run();
  }

  return (
    <div
      data-admin-field={fieldKey}
      className={`block${invalid ? " admin-field-invalid" : ""}`}
    >
      <span className="text-sm font-medium text-lagari-muted">{label}</span>
      <p className="mt-1 text-xs text-lagari-muted">
        Formatted text is saved as HTML on the product page.
      </p>

      <div className="admin-card admin-tiptap mt-2 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-lagari-border bg-lagari-elevated px-2 py-1.5">
          <ToolbarGroup>
            <IconButton
              title="Undo"
              onClick={() => ed.chain().focus().undo().run()}
              disabled={!ed.can().undo()}
            >
              ↶
            </IconButton>
            <IconButton
              title="Redo"
              onClick={() => ed.chain().focus().redo().run()}
              disabled={!ed.can().redo()}
            >
              ↷
            </IconButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <select
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as BlockType)}
            className="admin-input max-w-[8.5rem] px-2 py-1 text-xs"
            aria-label="Text style"
          >
            <option value="paragraph">Paragraph</option>
            <option value="h2">Heading</option>
            <option value="h3">Subheading</option>
          </select>

          <ToolbarDivider />

          <ToolbarGroup>
            <IconButton
              title="Bold"
              active={ed.isActive("bold")}
              onClick={() => ed.chain().focus().toggleBold().run()}
            >
              <strong>B</strong>
            </IconButton>
            <IconButton
              title="Italic"
              active={ed.isActive("italic")}
              onClick={() => ed.chain().focus().toggleItalic().run()}
            >
              <em>I</em>
            </IconButton>
            <IconButton
              title="Underline"
              active={ed.isActive("underline")}
              onClick={() => ed.chain().focus().toggleUnderline().run()}
            >
              <span className="underline">U</span>
            </IconButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <IconButton
              title="Align left"
              active={ed.isActive({ textAlign: "left" })}
              onClick={() => ed.chain().focus().setTextAlign("left").run()}
            >
              ≡
            </IconButton>
            <IconButton
              title="Align center"
              active={ed.isActive({ textAlign: "center" })}
              onClick={() => ed.chain().focus().setTextAlign("center").run()}
            >
              ≡
            </IconButton>
            <IconButton
              title="Align right"
              active={ed.isActive({ textAlign: "right" })}
              onClick={() => ed.chain().focus().setTextAlign("right").run()}
            >
              ≡
            </IconButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <IconButton
              title="Bullet list"
              active={ed.isActive("bulletList")}
              onClick={() => ed.chain().focus().toggleBulletList().run()}
            >
              •
            </IconButton>
            <IconButton
              title="Numbered list"
              active={ed.isActive("orderedList")}
              onClick={() => ed.chain().focus().toggleOrderedList().run()}
            >
              1.
            </IconButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <IconButton
              title="Horizontal rule"
              onClick={() => ed.chain().focus().setHorizontalRule().run()}
            >
              ─
            </IconButton>
            <IconButton title="Link" active={ed.isActive("link")} onClick={setLink}>
              🔗
            </IconButton>
            <IconButton
              title="Remove link"
              onClick={() => ed.chain().focus().unsetLink().run()}
            >
              ⛓
            </IconButton>
            <IconButton title="Image" onClick={setImage}>
              🖼
            </IconButton>
            <IconButton
              title="Clear formatting"
              onClick={() => ed.chain().focus().clearNodes().unsetAllMarks().run()}
            >
              T×
            </IconButton>
          </ToolbarGroup>
        </div>

        <EditorContent editor={ed} />
      </div>

      {error && (
        <p className="admin-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-lagari-border" aria-hidden />;
}

function IconButton({
  children,
  title,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 min-w-7 items-center justify-center rounded-sm border px-1.5 text-xs transition-colors ${
        active
          ? "border-lagari-brass bg-lagari-brass/20 text-lagari-primary"
          : "border-transparent bg-transparent text-lagari-muted hover:border-lagari-border hover:bg-lagari-surface hover:text-lagari-primary"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
