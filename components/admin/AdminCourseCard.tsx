'use client'
import { useState, useTransition } from 'react'
import { updateUnitTitle, deleteUnit, createUnit, createAdminMaterial, deleteMaterial, adminEditMaterial } from '@/app/actions/admin'
import { uploadFileWithTUS } from '@/lib/storage/upload'
import FileDropZone from '@/components/ui/FileDropZone'

function fileNameFromPath(path: string) {
  const segment = path.split('/').pop() ?? path
  return segment.replace(/^\d+-/, '')
}

interface Unit { id: string; title: string; orderIndex: number }
interface Material { id: string; title: string; type: string; contentText: string; linkUrl: string; attachmentPaths: string[] }

interface Props {
  courseId: string
  courseName: string
  units: Unit[]
  initialUnitMaterials: Record<string, Material[]>
}

export default function AdminCourseCard({ courseId, courseName, units: initialUnits, initialUnitMaterials }: Props) {
  const [units, setUnits] = useState(initialUnits)
  const [unitMaterials, setUnitMaterials] = useState<Record<string, Material[]>>(initialUnitMaterials)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newUnitTitle, setNewUnitTitle] = useState('')
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null)
  const [addMat, setAddMat] = useState<{ title: string; type: 'note' | 'test'; content: string; linkUrl: string }>({ title: '', type: 'note', content: '', linkUrl: '' })
  const [addAttachmentFiles, setAddAttachmentFiles] = useState<File[]>([])
  // Material view/edit state
  const [viewingMatId, setViewingMatId] = useState<string | null>(null)
  const [editingMatId, setEditingMatId] = useState<string | null>(null)
  const [editMatTitle, setEditMatTitle] = useState('')
  const [editMatContent, setEditMatContent] = useState('')
  const [editMatLinkUrl, setEditMatLinkUrl] = useState('')
  const [editMatAttachmentFiles, setEditMatAttachmentFiles] = useState<File[]>([])
  const [pending, startTransition] = useTransition()

  function startEdit(unit: Unit) { setEditingId(unit.id); setEditTitle(unit.title) }

  function handleSaveTitle(unitId: string) {
    if (!editTitle.trim()) return
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, title: editTitle.trim() } : u))
    setEditingId(null)
    startTransition(() => updateUnitTitle(unitId, editTitle))
  }

  function handleDeleteUnit(unitId: string) {
    setUnits(prev => prev.filter(u => u.id !== unitId))
    if (expandedUnitId === unitId) setExpandedUnitId(null)
    startTransition(() => deleteUnit(unitId))
  }

  function handleAddUnit() {
    if (!newUnitTitle.trim()) return
    const t = newUnitTitle.trim()
    setNewUnitTitle('')
    startTransition(() => createUnit(courseId, t, units.length + 1))
  }

  function handleDeleteMaterial(unitId: string, materialId: string) {
    setUnitMaterials(prev => ({
      ...prev,
      [unitId]: (prev[unitId] ?? []).filter(m => m.id !== materialId),
    }))
    if (viewingMatId === materialId) setViewingMatId(null)
    if (editingMatId === materialId) setEditingMatId(null)
    startTransition(() => deleteMaterial(materialId))
  }

  function handleAddMaterial(unitId: string) {
    if (!addMat.title.trim()) return
    const snap = { ...addMat }
    const filesSnap = [...addAttachmentFiles]
    setAddMat({ title: '', type: 'note', content: '', linkUrl: '' })
    setAddAttachmentFiles([])
    const tempId = `temp-${Date.now()}`
    setUnitMaterials(prev => ({
      ...prev,
      [unitId]: [...(prev[unitId] ?? []), { id: tempId, title: snap.title.trim(), type: snap.type, contentText: snap.content, linkUrl: snap.linkUrl, attachmentPaths: [] }],
    }))
    startTransition(async () => {
      const attachmentPaths: string[] = []
      for (const file of filesSnap) {
        const path = await uploadFileWithTUS(file, unitId)
        attachmentPaths.push(path)
      }
      await createAdminMaterial(unitId, snap.title, snap.type, snap.content, snap.linkUrl, attachmentPaths.length ? attachmentPaths : undefined)
    })
  }

  function startEditMat(m: Material) {
    setViewingMatId(null)
    setEditingMatId(m.id)
    setEditMatTitle(m.title)
    setEditMatContent(m.contentText)
    setEditMatLinkUrl(m.linkUrl)
    setEditMatAttachmentFiles([])
  }

  function handleSaveMat(unitId: string, mat: Material) {
    if (!editMatTitle.trim()) return
    const filesSnap = [...editMatAttachmentFiles]
    setUnitMaterials(prev => ({
      ...prev,
      [unitId]: (prev[unitId] ?? []).map(m => m.id === mat.id
        ? { ...m, title: editMatTitle.trim(), contentText: editMatContent, linkUrl: editMatLinkUrl }
        : m),
    }))
    setEditingMatId(null)
    setEditMatAttachmentFiles([])
    startTransition(async () => {
      const newPaths: string[] = []
      for (const file of filesSnap) {
        const path = await uploadFileWithTUS(file, unitId)
        newPaths.push(path)
      }
      const allPaths = newPaths.length ? [...mat.attachmentPaths, ...newPaths] : undefined
      await adminEditMaterial(mat.id, editMatTitle, editMatContent, editMatLinkUrl, allPaths)
    })
  }

  return (
    <div className="mb-4 glass rounded-xl p-4">
      <div className="text-white font-medium mb-3">{courseName}</div>

      <div className="flex flex-col gap-1 mb-3">
        {units.map((unit) => {
          const mats = unitMaterials[unit.id] ?? []
          const isExpanded = expandedUnitId === unit.id

          return (
            <div key={unit.id}>
              {/* Unit row */}
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg px-2 py-1.5 group">
                {/* Title / inline edit */}
                {editingId === unit.id ? (
                  <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(unit.id); if (e.key === 'Escape') setEditingId(null) }}
                    className="flex-1 bg-transparent border-b border-violet-500/60 text-white text-sm focus:outline-none py-0.5 px-1" />
                ) : (
                  <span className="flex-1 text-white/70 text-sm px-1">{unit.title}</span>
                )}

                {/* Material count pill */}
                {!editingId || editingId !== unit.id ? (
                  <button type="button" onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 px-1.5 py-0.5 rounded transition-colors">
                    <span>{mats.length} file{mats.length !== 1 ? 's' : ''}</span>
                    <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : null}

                {/* Edit / save / delete */}
                <div className="flex items-center gap-1 shrink-0">
                  {editingId === unit.id ? (
                    <>
                      <button type="button" onClick={() => handleSaveTitle(unit.id)} className="text-xs text-green-400 hover:text-green-300 px-1.5 transition-colors">Save</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs text-white/30 hover:text-white/60 px-1 transition-colors">✕</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(unit)}
                        className="text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all p-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" /></svg>
                      </button>
                      <button type="button" onClick={() => handleDeleteUnit(unit.id)}
                        className="text-red-400/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs px-1">
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded materials panel */}
              {isExpanded && (
                <div className="ml-6 mt-1 mb-1 border-l border-white/[0.07] pl-3 flex flex-col gap-1">
                  {mats.length === 0 && (
                    <p className="text-white/20 text-xs py-1">No materials yet.</p>
                  )}
                  {mats.map(m => (
                    <div key={m.id}>
                      {/* Material row */}
                      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] overflow-hidden group/mat">
                        <div className="flex items-start justify-between px-3 py-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingMatId(viewingMatId === m.id ? null : m.id)}
                            className="flex-1 flex flex-col gap-1 text-left min-w-0"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                                style={{
                                  background: m.type === 'note' ? 'rgba(124,58,237,0.2)' : 'rgba(251,191,36,0.15)',
                                  color: m.type === 'note' ? '#a78bfa' : '#fbbf24',
                                }}>
                                {m.type === 'note' ? 'Note' : 'Test'}
                              </span>
                              <span className="text-white/75 text-xs font-medium truncate">{m.title}</span>
                            </div>
                            {/* Indicator row */}
                            <div className="flex items-center gap-2 pl-0.5">
                              {m.contentText ? (
                                <span className="text-[10px] text-white/30 truncate max-w-[220px]">{m.contentText.slice(0, 80)}{m.contentText.length > 80 ? '…' : ''}</span>
                              ) : (
                                <span className="text-[10px] text-white/20 italic">No content</span>
                              )}
                              {m.attachmentPaths.length > 0 && (
                                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/60">
                                  {m.attachmentPaths.length} file{m.attachmentPaths.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {m.linkUrl && (
                                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400/60">Link</span>
                              )}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button type="button"
                              onClick={() => editingMatId === m.id ? setEditingMatId(null) : startEditMat(m)}
                              className="text-white/20 hover:text-white/60 opacity-0 group-hover/mat:opacity-100 text-xs px-1.5 py-0.5 rounded transition-all">
                              {editingMatId === m.id ? '✕' : 'Edit'}
                            </button>
                            <button type="button" onClick={() => handleDeleteMaterial(unit.id, m.id)}
                              className="text-red-400/30 hover:text-red-400 opacity-0 group-hover/mat:opacity-100 text-xs px-1.5 py-0.5 rounded transition-all">
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Expanded content panel */}
                        {viewingMatId === m.id && (
                          <div className="border-t border-white/[0.05] px-3 py-2.5 flex flex-col gap-2">
                            {m.contentText ? (
                              <p className="text-white/50 text-xs leading-relaxed whitespace-pre-wrap">{m.contentText}</p>
                            ) : (
                              <p className="text-white/20 text-xs italic">No content.</p>
                            )}
                            {m.attachmentPaths.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.05]">
                                {[...m.attachmentPaths]
                                  .sort((a, b) => fileNameFromPath(a).localeCompare(fileNameFromPath(b)))
                                  .map((p) => (
                                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/10">
                                      {fileNameFromPath(p)}
                                    </span>
                                  ))}
                              </div>
                            )}
                            {m.linkUrl && (
                              <p className="text-[10px] text-sky-400/50 truncate border-t border-white/[0.05] pt-1">{m.linkUrl}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline edit form */}
                      {editingMatId === m.id && (
                        <div className="mx-1 mb-1 bg-white/[0.02] rounded-lg px-3 py-2 flex flex-col gap-2 border border-white/[0.05]">
                          <input
                            autoFocus
                            value={editMatTitle}
                            onChange={e => setEditMatTitle(e.target.value)}
                            placeholder="Title"
                            className="glass-input w-full rounded-lg px-2 py-1 text-xs"
                          />
                          <textarea
                            value={editMatContent}
                            onChange={e => setEditMatContent(e.target.value)}
                            placeholder="Content"
                            rows={5}
                            className="glass-input w-full rounded-lg px-2 py-1 text-xs resize-y"
                          />
                          <div className="flex flex-col gap-1">
                            {m.attachmentPaths.length > 0 && (
                              <p className="text-xs text-emerald-400/60 px-1">{m.attachmentPaths.length} existing attachment{m.attachmentPaths.length !== 1 ? 's' : ''} kept — upload below to add more</p>
                            )}
                            <FileDropZone files={editMatAttachmentFiles} onChange={setEditMatAttachmentFiles} label="Attachments (optional)" />
                          </div>
                          <input
                            value={editMatLinkUrl}
                            onChange={e => setEditMatLinkUrl(e.target.value)}
                            placeholder="Link URL (optional)"
                            className="glass-input w-full rounded-lg px-2 py-1 text-xs"
                          />
                          <button type="button"
                            onClick={() => handleSaveMat(unit.id, m)}
                            disabled={!editMatTitle.trim() || pending}
                            className="self-start text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-1 rounded-lg transition-colors">
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add material form */}
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input value={addMat.title} onChange={e => setAddMat(p => ({ ...p, title: e.target.value }))}
                        placeholder="Material title..."
                        className="glass-input flex-1 rounded-lg px-3 py-1.5 text-xs" />
                      <div className="flex rounded-lg overflow-hidden border border-white/[0.1]">
                        {(['note', 'test'] as const).map(t => (
                          <button key={t} type="button" onClick={() => setAddMat(p => ({ ...p, type: t }))}
                            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${addMat.type === t ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70'}`}>
                            {t === 'note' ? 'Note' : 'Test'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea value={addMat.content} onChange={e => setAddMat(p => ({ ...p, content: e.target.value }))}
                      placeholder="Content (optional)..."
                      rows={3}
                      className="glass-input w-full rounded-lg px-3 py-1.5 text-xs resize-none" />
                    <FileDropZone files={addAttachmentFiles} onChange={setAddAttachmentFiles} label="Attachments (optional)" />
                    <input value={addMat.linkUrl} onChange={e => setAddMat(p => ({ ...p, linkUrl: e.target.value }))}
                      placeholder="Link URL (optional)..."
                      className="glass-input w-full rounded-lg px-3 py-1.5 text-xs" />
                    <button type="button" onClick={() => handleAddMaterial(unit.id)}
                      disabled={!addMat.title.trim() || pending}
                      className="self-start text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors">
                      Add Material
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {units.length === 0 && <p className="text-white/20 text-xs px-2 py-1">No units yet.</p>}
      </div>

      {/* Add unit */}
      <div className="flex gap-2">
        <input value={newUnitTitle} onChange={e => setNewUnitTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddUnit() }}
          placeholder="New unit title..."
          className="glass-input flex-1 rounded-lg px-3 py-1.5 text-sm" />
        <button type="button" onClick={handleAddUnit} disabled={!newUnitTitle.trim() || pending}
          className="text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors">
          Add Unit
        </button>
      </div>
    </div>
  )
}
