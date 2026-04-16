// useTimer.js — wall-clock timer for measuring session and probe durations.

import { useRef, useCallback } from 'react'

/**
 * useTimer() → { startTimer, getElapsedMs }
 *
 * startTimer() — marks time zero (call on session mount).
 * getElapsedMs() — returns ms since startTimer was last called.
 */
export function useTimer() {
  const startRef = useRef(null)

  const startTimer = useCallback(() => {
    startRef.current = Date.now()
  }, [])

  const getElapsedMs = useCallback(() => {
    if (startRef.current === null) return 0
    return Date.now() - startRef.current
  }, [])

  return { startTimer, getElapsedMs }
}
