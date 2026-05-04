import { useState, useEffect } from 'react'
import {
  listDiagrams, deleteDiagram, updateDiagram,
  listFolders, createFolder, renameFolder, deleteFolder,
  type DiagramMeta, type DiagramFolder,
} from '../../api/diagrams'
import './ServerStorageModal.css'

interface Props {
  onClose: () => void
  onLoad: (id: string, name: string) => void
  onSaveNew: (name: string, folderId: string | null) => Promise<void>
  currentDiagramName: string
}

export default function ServerStorageModal({ onClose, onLoad, onSaveNew, currentDiagramName }: Props) {
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([])
  const [folders, setFolders] = useState<DiagramFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Navigace složkami
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [currentFolderName, setCurrentFolderName] = useState('')

  // Přejmenování diagramu inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Přejmenování složky inline
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')

  // Nová složka
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderLoading, setNewFolderLoading] = useState(false)

  // Přesun diagramu
  const [movingId, setMovingId] = useState<string | null>(null)

  // Uložení nového diagramu
  const [savingNew, setSavingNew] = useState(false)
  const [newName, setNewName] = useState(currentDiagramName || '')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveFolderId, setSaveFolderId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listDiagrams(), listFolders()])
      .then(([d, f]) => { setDiagrams(d); setFolders(f) })
      .catch(() => setFetchError('Nepodařilo se načíst data ze serveru.'))
      .finally(() => setLoading(false))
  }, [])

  // Synchronizuj saveFolderId s aktuální složkou při otevření formuláře
  const handleShowSave = () => {
    setSaveFolderId(currentFolderId)
    setShowSaveForm(true)
  }

  const displayedDiagrams = currentFolderId
    ? diagrams.filter(d => d.folderId === currentFolderId)
    : diagrams.filter(d => !d.folderId)

  // --- Diagramy ---

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

  const handleMove = async (id: string, folderId: string | null) => {
    setMovingId(null)
    try {
      await updateDiagram(id, { folderId })
      setDiagrams(prev => prev.map(d => d.id === id ? { ...d, folderId } : d))
    } catch {
      alert('Chyba při přesunu.')
    }
  }

  const handleSaveNew = async () => {
    const name = newName.trim()
    if (!name) return
    setSavingNew(true)
    try {
      await onSaveNew(name, saveFolderId)
      onClose()
    } catch {
      alert('Chyba při ukládání.')
      setSavingNew(false)
    }
  }

  // --- Složky ---

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    setNewFolderLoading(true)
    try {
      const folder = await createFolder(name)
      setFolders(prev => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name, 'cs')))
      setNewFolderName('')
      setShowNewFolder(false)
    } catch {
      alert('Chyba při vytváření složky.')
    } finally {
      setNewFolderLoading(false)
    }
  }

  const handleFolderRenameStart = (f: DiagramFolder) => {
    setEditingFolderId(f.id)
    setEditingFolderName(f.name)
  }

  const handleFolderRenameCommit = async (id: string) => {
    const name = editingFolderName.trim()
    setEditingFolderId(null)
    if (!name) return
    try {
      const updated = await renameFolder(id, name)
      setFolders(prev =>
        prev.map(f => f.id === id ? updated : f).sort((a, b) => a.name.localeCompare(b.name, 'cs'))
      )
      if (currentFolderId === id) setCurrentFolderName(updated.name)
    } catch {
      alert('Chyba při přejmenování složky.')
    }
  }

  const handleDeleteFolder = async (id: string, name: string, count: number) => {
    if (count > 0) return
    if (!confirm(`Smazat složku „${name}"?`)) return
    try {
      await deleteFolder(id)
      setFolders(prev => prev.filter(f => f.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Chyba při mazání složky.')
    }
  }

  const enterFolder = (id: string, name: string) => {
    setCurrentFolderId(id)
    setCurrentFolderName(name)
    setMovingId(null)
  }

  const exitFolder = () => {
    setCurrentFolderId(null)
    setCurrentFolderName('')
    setMovingId(null)
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' })

  const diagramCount = (folderId: string) => diagrams.filter(d => d.folderId === folderId).length

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
              <select
                className="ssm-folder-select"
                value={saveFolderId ?? ''}
                onChange={e => setSaveFolderId(e.target.value || null)}
              >
                <option value="">Bez složky</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button className="ssm-btn-primary" onClick={handleSaveNew} disabled={savingNew}>
                {savingNew ? 'Ukládám…' : 'Uložit'}
              </button>
              <button className="ssm-btn-cancel" onClick={() => setShowSaveForm(false)}>Zrušit</button>
            </div>
          ) : (
            <button className="ssm-btn-primary" onClick={handleShowSave}>
              + Uložit aktuální diagram jako nový
            </button>
          )}
        </div>

        <div className="ssm-body">
          {loading && <p className="ssm-info">Načítám…</p>}
          {fetchError && <p className="ssm-error">{fetchError}</p>}

          {!loading && !fetchError && (
            <>
              {/* In-folder view: breadcrumb */}
              {currentFolderId && (
                <div className="ssm-breadcrumb">
                  <button className="ssm-back-btn" onClick={exitFolder}>← Zpět</button>
                  <span className="ssm-breadcrumb-name">📁 {currentFolderName}</span>
                </div>
              )}

              {/* Root view: složky */}
              {!currentFolderId && (
                <div className="ssm-section">
                  <div className="ssm-section-header">
                    <span className="ssm-section-title">Složky</span>
                    <button
                      className="ssm-btn-new-folder"
                      onClick={() => { setShowNewFolder(v => !v); setNewFolderName('') }}
                    >
                      + Nová složka
                    </button>
                  </div>

                  {showNewFolder && (
                    <div className="ssm-new-folder-row">
                      <input
                        autoFocus
                        className="ssm-inline-input"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="Název složky"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleCreateFolder()
                          if (e.key === 'Escape') setShowNewFolder(false)
                        }}
                      />
                      <button
                        className="ssm-btn-primary"
                        onClick={handleCreateFolder}
                        disabled={newFolderLoading}
                      >
                        {newFolderLoading ? '…' : 'Vytvořit'}
                      </button>
                      <button className="ssm-btn-cancel" onClick={() => setShowNewFolder(false)}>Zrušit</button>
                    </div>
                  )}

                  {folders.length === 0 && !showNewFolder && (
                    <p className="ssm-info ssm-info-small">Žádné složky.</p>
                  )}

                  {folders.map(f => {
                    const count = diagramCount(f.id)
                    return (
                      <div key={f.id} className="ssm-folder-row">
                        <div className="ssm-folder-main" onClick={() => enterFolder(f.id, f.name)}>
                          <span className="ssm-folder-icon">📁</span>
                          {editingFolderId === f.id ? (
                            <input
                              autoFocus
                              className="ssm-inline-input ssm-folder-name-input"
                              value={editingFolderName}
                              onChange={e => setEditingFolderName(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              onBlur={() => handleFolderRenameCommit(f.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleFolderRenameCommit(f.id)
                                if (e.key === 'Escape') setEditingFolderId(null)
                                e.stopPropagation()
                              }}
                            />
                          ) : (
                            <span className="ssm-folder-name">{f.name}</span>
                          )}
                          <span className="ssm-folder-count">
                            {count === 0 ? 'prázdná' : `${count} ${count === 1 ? 'diagram' : count < 5 ? 'diagramy' : 'diagramů'}`}
                          </span>
                        </div>
                        <div className="ssm-row-actions" onClick={e => e.stopPropagation()}>
                          <button
                            className="ssm-btn-icon"
                            title="Přejmenovat"
                            onClick={() => handleFolderRenameStart(f)}
                          >
                            ✏️
                          </button>
                          <button
                            className="ssm-btn-delete"
                            title={count > 0 ? 'Nejdříve přesuňte diagramy ze složky' : 'Smazat složku'}
                            disabled={count > 0}
                            onClick={() => handleDeleteFolder(f.id, f.name, count)}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="ssm-section-divider" />
                  <span className="ssm-section-title ssm-section-title-sub">Bez složky</span>
                </div>
              )}

              {/* Diagramy v aktuálním pohledu */}
              {displayedDiagrams.length === 0 ? (
                <p className="ssm-info ssm-info-small">
                  {currentFolderId ? 'Složka je prázdná.' : 'Žádné diagramy bez složky.'}
                </p>
              ) : (
                displayedDiagrams.map(d => (
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
                      {movingId === d.id ? (
                        <select
                          autoFocus
                          className="ssm-move-select"
                          defaultValue={d.folderId ?? ''}
                          onChange={e => handleMove(d.id, e.target.value || null)}
                          onBlur={() => setMovingId(null)}
                        >
                          <option value="">Bez složky</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          className="ssm-btn-icon"
                          title="Přesunout do složky"
                          onClick={() => setMovingId(d.id)}
                        >
                          ↗
                        </button>
                      )}
                      <button className="ssm-btn-load" onClick={() => { onLoad(d.id, d.name); onClose() }}>
                        Načíst
                      </button>
                      <button className="ssm-btn-delete" onClick={() => handleDelete(d.id, d.name)} title="Smazat">
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
