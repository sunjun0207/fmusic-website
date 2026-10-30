import { useSyncExternalStore } from 'react'

export type ToastItem = { id: number; text: string }

let items: ToastItem[] = []
let seq = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function toast(text: string) {
  const id = ++seq
  items = [...items.filter((item) => item.text !== text), { id, text }].slice(-3)
  emit()
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id)
    emit()
  }, 2600)
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => items)
}
