export interface DiagramMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  user: { name: string; surname: string }
}

export interface DiagramFull extends DiagramMeta {
  content: unknown
}

const BASE = '/api/diagrams'

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

export async function createDiagram(name: string, content: unknown): Promise<DiagramMeta> {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content }),
  })
  if (!res.ok) throw new Error('Chyba při ukládání')
  return res.json()
}

export async function updateDiagram(id: string, data: { name?: string; content?: unknown }): Promise<DiagramMeta> {
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
