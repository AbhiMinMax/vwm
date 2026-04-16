// useStorage.js — persistent localStorage hook with JSON serialization.

import { useState, useCallback } from 'react'

/**
 * useStorage(key, defaultValue) → [value, setValue]
 * Reads from localStorage on mount. Writes on every setValue call.
 * Falls back to defaultValue on missing key or JSON parse error.
 */
export function useStorage(key, defaultValue) {
  const [value, setInternalValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw)
    } catch (err) {
      console.error(`[useStorage] Failed to parse key "${key}":`, err)
      return defaultValue
    }
  })

  const setValue = useCallback((newValue) => {
    try {
      const toStore = typeof newValue === 'function' ? newValue(value) : newValue
      localStorage.setItem(key, JSON.stringify(toStore))
      setInternalValue(toStore)
    } catch (err) {
      console.error(`[useStorage] Failed to write key "${key}":`, err)
    }
  }, [key, value])

  return [value, setValue]
}
