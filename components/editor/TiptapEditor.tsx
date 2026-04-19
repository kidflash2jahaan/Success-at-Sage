'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface TiptapEditorProps {
  onChange: (json: object) => void
  initialContent?: object
}

export default function TiptapEditor({ onChange, initialContent }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? '',
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10">
        {[
          { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
          { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
          { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
          { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
          { label: '•', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        ].map(btn => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              btn.active ? 'bg-sage-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
