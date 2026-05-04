export interface DiagramMeta {
  id: string
  name: string
  folderId: string | null
  createdAt: string
  updatedAt: string
  user: { name: string; surname: string }
}

export interface DiagramFull extends DiagramMeta {
  content: unknown
}

export interface DiagramFolder {
  id: string
  name: string
  createdAt: string
  _count: { diagrams: number }
}

const BASE = '/api/diagrams'
const FOLDER_BASE = '/api/diagram-folders'

export async function listDiagrams(): Promise<DiagramMeta[]> {
  const res = await fetch(BASE, { credentials: 'include' })
  if (!res.ok) throw new Error('Chyba při načítání')
  return res.json()
}

export async function loadDiagram(id: string): Promise<DiagramFull> {
  const res = await fetch(`${BASE}/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Chyba při načítání')
  return res.json()
}

export async function createDiagram(
  name: string,
  content: unknown,
  folderId?: string | null
): Promise<DiagramMeta> {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content, folderId: folderId ?? null }),
  })
  if (!res.ok) throw new Error('Chyba při ukládání')
  return res.json()
}

export async function updateDiagram(
  id: string,
  data: { name?: string; content?: unknown; folderId?: string | null }
): Promise<DiagramMeta> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Chyba při ukládání')
  return res.json()
}

export async function deleteDiagram(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error('Chyba při mazání')
}

export async function listFolders(): Promise<DiagramFolder[]> {
  const res = await fetch(FOLDER_BASE, { credentials: 'include' })
  if (!res.ok) throw new Error('Chyba při načítání složek')
  return res.json()
}

export async function createFolder(name: string): Promise<DiagramFolder> {
  const res = await fetch(FOLDER_BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Chyba při vytváření složky')
  return res.json()
}

export async function renameFolder(id: string, name: string): Promise<DiagramFolder> {
  const res = await fetch(`${FOLDER_BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Chyba při přejmenování složky')
  return res.json()
}

export async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`${FOLDER_BASE}/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Chyba při mazání složky')
  }
}
