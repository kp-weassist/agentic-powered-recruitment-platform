"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, Strikethrough, List, ListOrdered } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-24 rounded-md border bg-background p-3 text-sm focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { parseOptions: { preserveWhitespace: "full" } });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant={editor.isActive('bold') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleBold().run()} aria-pressed={editor.isActive('bold')}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant={editor.isActive('italic') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleItalic().run()} aria-pressed={editor.isActive('italic')}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant={editor.isActive('strike') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleStrike().run()} aria-pressed={editor.isActive('strike')}>
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button type="button" size="sm" variant={editor.isActive('bulletList') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-pressed={editor.isActive('bulletList')}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant={editor.isActive('orderedList') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-pressed={editor.isActive('orderedList')}>
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <div className="tiptap">
        <EditorContent editor={editor} />
      </div>
      <style jsx>{`
        .tiptap :global(ul) {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        .tiptap :global(ol) {
          list-style: decimal;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        .tiptap :global(li) {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}


