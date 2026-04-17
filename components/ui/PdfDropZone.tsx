'use client'
import { useState, useRef } from 'react'

interface Props {
  file: File | null
  onChange: (file: File | null) => void
  existingFileName?: string
}

export default function PdfDropZone({ file, onChange, existingFileName }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.type === 'application/pdf' || dropped.name.toLowerCase().endsWith('.pdf'))) {
      onChange(dropped)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {!file && existingFileName && (
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-white/[0.08]">
          <svg className="w-4 h-4 text-rose-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="flex-1 text-white/60 text-sm truncate">{existingFileName}</span>
          <span className="text-white/25 text-xs">Current file kept</span>
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 glass rounded-xl border-2 border-dashed transition-all cursor-pointer px-6 py-10 ${
          dragging ? 'border-rose-400/60 bg-rose-500/10' :
          file ? 'border-rose-400/40 bg-rose-500/5' :
          'border-white/10 hover:border-white/20'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={e => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <svg className="w-8 h-8 text-rose-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <p className="text-white/80 text-sm font-medium">{file.name}</p>
              <p className="text-white/30 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB · Click or drop to replace</p>
            </div>
          </>
        ) : (
          <>
            <svg className={`w-8 h-8 transition-colors ${dragging ? 'text-rose-400/60' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <p className={`text-sm transition-colors ${dragging ? 'text-white/70' : 'text-white/50'}`}>
                {dragging ? 'Drop PDF here' : existingFileName ? 'Click or drop to replace PDF' : 'Click or drop a PDF'}
              </p>
              <p className="text-white/25 text-xs mt-0.5">Max 50 MB</p>
            </div>
          </>
        )}
      </div>

      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="self-start text-xs text-white/25 hover:text-red-400/70 transition-colors px-1"
        >
          Remove
        </button>
      )}
    </div>
  )
}
