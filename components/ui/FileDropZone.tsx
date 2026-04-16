'use client'
import { useRef, useState } from 'react'

interface Props {
  file: File | null
  onChange: (file: File | null) => void
  label?: string
}

export default function FileDropZone({ file, onChange, label = 'Attachment' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onChange(dropped)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the zone entirely (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
        {label} <span className="text-white/25 normal-case">(optional)</span>
      </label>

      {file ? (
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-white/[0.08]">
          <svg className="w-5 h-5 text-emerald-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="text-white/80 text-sm truncate">{file.name}</div>
            <div className="text-white/30 text-xs">{formatBytes(file.size)}</div>
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = '' }}
            className="text-white/30 hover:text-white/70 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-xl px-4 py-6 flex flex-col items-center gap-2 transition-all border-2 border-dashed select-none"
          style={{
            borderColor: dragging ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)',
            background: dragging ? 'rgba(124,58,237,0.08)' : 'transparent',
          }}
        >
          <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <div className="text-center">
            <span className="text-white/50 text-sm">Drop a file or </span>
            <span className="text-violet-400 text-sm">browse</span>
          </div>
          <span className="text-white/20 text-xs">Any file type</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f) }}
      />
    </div>
  )
}
