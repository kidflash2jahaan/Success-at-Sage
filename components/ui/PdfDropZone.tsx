'use client'
import { useState, useRef } from 'react'
import { isImageFile, isPdfFile } from '@/lib/utils/imagesToPdf'

const ACCEPT = 'application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

interface Props {
  files: File[]
  onChange: (files: File[]) => void
  existingFileName?: string
}

export default function PdfDropZone({ files, onChange, existingFileName }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasPdf = files.length === 1 && isPdfFile(files[0])
  const hasImages = files.length > 0 && files.every(isImageFile)

  function addFiles(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return
    const arr = Array.from(incoming)
    const allImages = arr.every(isImageFile)
    const isPdf = arr.length === 1 && isPdfFile(arr[0])
    if (!allImages && !isPdf) return
    if (allImages && hasImages) {
      onChange([...files, ...arr])
    } else {
      onChange(arr)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function removeFile(i: number) {
    onChange(files.filter((_, j) => j !== i))
  }

  const isEmpty = files.length === 0

  return (
    <div className="flex flex-col gap-1.5">
      {isEmpty && existingFileName && (
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-white/[0.08]">
          <svg className="w-4 h-4 text-rose-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="flex-1 text-white/60 text-sm truncate">{existingFileName}</span>
          <span className="text-white/25 text-xs">Current file kept</span>
        </div>
      )}

      {hasImages && (
        <div className="flex flex-col gap-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-white/[0.08]">
              <svg className="w-4 h-4 text-sky-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="flex-1 text-white/60 text-sm truncate">{f.name}</span>
              <button type="button" onClick={() => removeFile(i)} className="text-white/25 hover:text-red-400/70 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <p className="text-white/25 text-xs px-1">These will be combined into one PDF automatically.</p>
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 glass rounded-xl border-2 border-dashed transition-all cursor-pointer px-6 py-10 ${
          dragging ? 'border-rose-400/60 bg-rose-500/10' :
          hasPdf ? 'border-rose-400/40 bg-rose-500/5' :
          hasImages ? 'border-sky-400/30 bg-sky-500/5' :
          'border-white/10 hover:border-white/20'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={e => addFiles(e.target.files)}
        />

        {hasPdf ? (
          <>
            <svg className="w-8 h-8 text-rose-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <p className="text-white/80 text-sm font-medium">{files[0].name}</p>
              <p className="text-white/30 text-xs mt-0.5">{(files[0].size / 1024 / 1024).toFixed(1)} MB · Click or drop to replace</p>
            </div>
          </>
        ) : hasImages ? (
          <>
            <svg className="w-8 h-8 text-sky-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-white/50 text-sm">Add more photos</p>
          </>
        ) : (
          <>
            <svg className={`w-8 h-8 transition-colors ${dragging ? 'text-rose-400/60' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <p className={`text-sm transition-colors ${dragging ? 'text-white/70' : 'text-white/50'}`}>
                {dragging ? 'Drop here' : existingFileName ? 'Click or drop to replace' : 'Click or drop a PDF or photos'}
              </p>
              <p className="text-white/25 text-xs mt-0.5">PDF or JPG/PNG · Max 50 MB</p>
            </div>
          </>
        )}
      </div>

      {isEmpty && (
        <p className="text-white/25 text-xs px-1">
          Have paper notes? Scan with{' '}
          <a
            href="https://www.geniusscan.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-sage-400/70 hover:text-sage-300 underline underline-offset-2 transition-colors"
          >
            Genius Scan
          </a>
          , then upload the PDF.
        </p>
      )}

      {files.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="self-start text-xs text-white/25 hover:text-red-400/70 transition-colors px-1"
        >
          Remove all
        </button>
      )}
    </div>
  )
}
