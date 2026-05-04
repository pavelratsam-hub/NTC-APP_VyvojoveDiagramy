import { useState, useEffect } from 'react'
import { listDiagrams, deleteDiagram, updateDiagram, type DiagramMeta } from '../../api/diagrams'
import './ServerStorageModal.css'

interface Props {
  onClose: () => void
  onLoad: (id: string, name: string) => void
  onSaveNew: (name: string) => Promise<void>
  currentDiagramName: string
}

export default function ServerStorageModal({ onClose, onLoad, onSaveNew, currentDiagramName }: Props) {
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingNew, setSavingNew] = useState(false)
  const [newName, setNewName] = useState(currentDiagramName || '')
  const [showSaveForm, setShowSaveForm] = useState(false)

  useEffect(() => {
    listDiagrams()
      .then(setDiagrams)
      .catch(() => setFetchError('Nepodařilo se načíst seznam diagramů.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Smazat diagram „${name}"?`)) return
    try {
      await deleteDiagram(id)
      setDiagrams(prev => prev.filter(d => d.id !== id))
    } catch {
      alert('Chyba při mazání.')
    }
  }

  const handleRenameStart = (d: DiagramMeta) => {
    setEditingId(d.id)
    setEditingName(d.name)
  }

  const handleRenameCommit = async (id: string) => {
    const name = editingName.trim()
    setEditingId(null)
    if (!name) return
    try {
      await updateDiagram(id, { name })
      setDiagrams(prev => prev.map(d => d.id === id ? { ...d, name } : d))
    } catch {
      alert('Chyba při přejmenování.')
    }
  }

  const handleSaveNew = async () => {
    const name = newName.trim()
    if (!name) return
    setSavingNew(true)
    try {
      await onSaveNew(name)
      onClose()
    } catch {
      alert('Chyba při ukládání.')
      setSavingNew(false)
    }
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="ssm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ssm-modal">
        <div className="ssm-header">
          <h2>Diagramy na serveru</h2>
          <button className="ssm-close" onClick={onClose}>✕</button>
        </div>

        <div className="ssm-save-bar">
          {showSaveForm ? (
            <div className="ssm-save-form">
              <input
                autoFocus
                className="ssm-name-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveNew()
                  if (e.key === 'Escape') setShowSaveForm(false)
                }}
                placeholder="Název diagramu"
              />
              <button className="ssm-btn-primary" onClick={handleSaveNew} disabled={savingNew}>
                {savingNew ? 'Ukládám…' : 'Uložit jako nový'}
              </button>
              <button className="ssm-btn-cancel" onClick={() => setShowSaveForm(false)}>Zrušit</button>
            </div>
          ) : (
            <button className="ssm-btn-primary" onClick={() => setShowSaveForm(true)}>
              + Uložit aktuální diagram jako nový
            </button>
          )}
        </div>

        <div className="ssm-body">
          {loading && <p className="ssm-info">Načítám…</p>}
          {fetchError && <p className="ssm-error">{fetchError}</p>}
          {!loading && !fetchError && diagrams.length === 0 && (
            <p className="ssm-info">Zatím nejsou uloženy žádné diagramy.</p>
          )}
          {diagrams.map(d => (
            <div key={d.id} className="ssm-row">
              <div className="ssm-row-main">
                {editingId === d.id ? (
                  <input
                    autoFocus
                    className="ssm-inline-input"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => handleRenameCommit(d.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameCommit(d.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <span className="ssm-name" title="Klikněte pro přejmenování" onClick={() => handleRenameStart(d)}>
                    {d.name}
                  </span>
                )}
                <div className="ssm-meta">
                  <span className="ssm-owner">{d.user.name} {d.user.surname}</span>
                  <span className="ssm-date">{fmt(d.updatedAt)}</span>
                </div>
              </div>
              <div className="ssm-row-actions">
                <button className="ssm-btn-load" onClick={() => { onLoad(d.id, d.name); onClose() }}>
                  Načíst
                </button>
                <button className="ssm-btn-delete" onClick={() => handleDelete(d.id, d.name)} title="Smazat">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
