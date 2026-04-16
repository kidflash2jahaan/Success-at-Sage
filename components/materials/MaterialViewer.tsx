interface Material {
  contentJson: unknown
}

export default function MaterialViewer({ material }: { material: Material }) {
  const text = (material.contentJson as { text?: string } | null)?.text ?? ''
  return (
    <pre className="p-5 text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-sans">
      {text || <span className="text-white/25 italic">No content.</span>}
    </pre>
  )
}
