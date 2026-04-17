'use client'
import { useRef, useState } from 'react'

interface Props {
  files: File[]
  onChange: (files: File[]) => void
  label?: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileDropZone({ files, onChange, label = 'Attachments' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const newFiles = Array.from(incoming).filter(
      f => !files.some(existing => existing.name === f.name && existing.size === f.size)
    )
    if (newFiles.length > 0) onChange([...files, ...newFiles])
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index))
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
        {label} <span className="text-white/25 normal-case">(optional)</span>
      </label>

      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-white/[0.08]">
              <svg className="w-4 h-4 text-emerald-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-white/80 text-sm truncate">{file.name}</div>
                <div className="text-white/30 text-xs">{formatBytes(file.size)}</div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-white/25 hover:text-white/60 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-xl px-4 py-5 flex items-center justify-center gap-2.5 transition-all border-2 border-dashed select-none"
        style={{
          borderColor: dragging ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.07)',
          background: dragging ? 'rgba(124,58,237,0.08)' : 'transparent',
        }}
      >
        <svg className="w-5 h-5 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-white/35 text-sm">
          {files.length > 0 ? 'Add another file' : 'Drop files or '}
          {files.length === 0 && <span className="text-violet-400">browse</span>}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => addFiles(e.target.files)}
      />
    </div>
  )
}
