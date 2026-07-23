"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Strikethrough } from "lucide-react";

import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-1">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="굵게"
      >
        <Bold className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="기울임"
      >
        <Italic className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="취소선"
      >
        <Strikethrough className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="제목"
      >
        <Heading2 className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="글머리 목록"
      >
        <List className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="번호 목록"
      >
        <ListOrdered className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="인용"
      >
        <Quote className="size-4" />
      </Toggle>
    </div>
  );
}

export function RichTextEditor({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: placeholder ?? "내용을 입력하세요..." })],
    content: defaultValue ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-40 px-3 py-2 focus:outline-none",
        ),
      },
    },
  });

  const html = editor?.getHTML() ?? defaultValue ?? "";

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  return (
    <div className="rounded-lg border">
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
