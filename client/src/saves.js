import { useSyncExternalStore } from 'react'

const KEY = 'solid-tester:saves'
const MAX_SLOTS = 3
const MAX_FIELD = 100 * 1024
const LANGS = ['js', 'go', 'rust']

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s && Array.isArray(s.slots)) return s
  } catch (e) {
    console.warn('Corrupt saves, resetting', e)
  }
  return { activeId: null, slots: [] }
}

let state = load()
const listeners = new Set()

let saveError = null

function commit(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    saveError = "Couldn't save — browser storage is full"
    listeners.forEach((l) => l())
    throw new Error(saveError)
  }
  saveError = null
  state = next
  listeners.forEach((l) => l())
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useSaves = () => useSyncExternalStore(subscribe, () => state)

export const useSaveError = () => useSyncExternalStore(subscribe, () => saveError)

export const activeSlot = (s = state) => s.slots.find((x) => x.id === s.activeId) || null

export function createSlot(name, data = {}) {
  if (state.slots.length >= MAX_SLOTS) throw new Error(`All ${MAX_SLOTS} slots are in use`)
  const now = Date.now()
  const slot = { id: crypto.randomUUID(), name: name.slice(0, 40) || 'Slot', createdAt: now, updatedAt: now, data }
  commit({ activeId: slot.id, slots: [...state.slots, slot] })
  return slot
}

const patchSlot = (id, fn) =>
  commit({ ...state, slots: state.slots.map((s) => (s.id === id ? fn(s) : s)) })

export const renameSlot = (id, name) => patchSlot(id, (s) => ({ ...s, name: name.slice(0, 40) || s.name }))

export function deleteSlot(id) {
  const slots = state.slots.filter((s) => s.id !== id)
  commit({ activeId: state.activeId === id ? (slots[0]?.id ?? null) : state.activeId, slots })
}

export const setActive = (id) => commit({ ...state, activeId: id })

export const getExercise = (lang, name) => activeSlot()?.data[lang]?.[name]

export function saveExercise(lang, name, patch) {
  try {
    const slot = activeSlot() || (state.slots.length < MAX_SLOTS ? createSlot('Slot 1') : null)
    if (!slot) return
    const cur = slot.data[lang]?.[name]
    if (cur && Object.keys(patch).every((k) => cur[k] === patch[k])) return
    patchSlot(slot.id, (s) => ({
      ...s,
      updatedAt: Date.now(),
      data: { ...s.data, [lang]: { ...s.data[lang], [name]: { ...s.data[lang]?.[name], ...patch } } },
    }))
  } catch {
    // commit() already exposed the message through useSaveError
  }
}

export const passedCount = (slot) =>
  Object.values(slot.data).reduce((n, ex) => n + Object.values(ex).filter((e) => e.passed).length, 0)

export function exportSlot(id) {
  const slot = state.slots.find((s) => s.id === id)
  const blob = new Blob([JSON.stringify({ name: slot.name, data: slot.data }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `solid-tester-${slot.name.replace(/[^\w-]+/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const bad = (msg) => { throw new Error(`Invalid save file: ${msg}`) }

// Rebuilds data field by field so nothing unexpected from the file is kept
function cleanData(data) {
  if (!isObj(data)) bad('data must be an object')
  return Object.fromEntries(Object.entries(data).map(([lang, exs]) => {
    if (!LANGS.includes(lang)) bad(`unknown language "${lang}"`)
    if (!isObj(exs)) bad('exercises must be an object')
    return [lang, Object.fromEntries(Object.entries(exs).map(([name, e]) => {
      if (!isObj(e)) bad('exercise entry must be an object')
      const out = {}
      for (const f of ['code', 'main']) {
        if (e[f] === undefined) continue
        if (typeof e[f] !== 'string' || e[f].length > MAX_FIELD) bad(`${f} must be a string up to 100KB`)
        out[f] = e[f]
      }
      if (e.passed !== undefined) {
        if (typeof e.passed !== 'boolean') bad('passed must be a boolean')
        out.passed = e.passed
      }
      return [name.slice(0, 200), out]
    }))]
  }))
}

export async function importSlot(file) {
  if (state.slots.length >= MAX_SLOTS) throw new Error(`All ${MAX_SLOTS} slots are in use`)
  if (file.size > 5 * 1024 * 1024) bad('file too large')
  let json
  try {
    json = JSON.parse(await file.text())
  } catch {
    bad('not valid JSON')
  }
  if (!isObj(json) || typeof json.name !== 'string') bad('missing name')
  return createSlot(json.name, cleanData(json.data))
}
