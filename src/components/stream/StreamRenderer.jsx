// StreamRenderer.jsx — renders sentences one-at-a-time, stacked, with timing.

import { useState, useEffect, useRef, useCallback } from 'react'
import SentenceCard from './SentenceCard'
import PauseMarker from './PauseMarker'
import styles from './StreamRenderer.module.css'

const SPEED_MS = {
  slow:     3000,
  normal:   2000,
  fast:     1000,
  pressure: 500,
}

/**
 * Props:
 *   sentences      — array of sentence strings
 *   speed          — 'slow' | 'normal' | 'fast' | 'pressure'
 *   autoAdvance    — boolean
 *   onComplete     — () => void
 *   onSentenceReveal — (index, timestampMs) => void
 */
export default function StreamRenderer({
  sentences,
  speed = 'normal',
  autoAdvance = true,
  onComplete,
  onSentenceReveal,
}) {
  const [revealed, setRevealed]         = useState(0)   // count of revealed sentences
  const [showPause, setShowPause]       = useState(false)
  const [newIndex, setNewIndex]         = useState(null) // index that just appeared
  const bottomRef                       = useRef(null)
  const timerRef                        = useRef(null)
  const completedRef                    = useRef(false)

  const reveal = useCallback((index) => {
    setNewIndex(index)
    setRevealed(index + 1)
    setShowPause(false)
    if (onSentenceReveal) onSentenceReveal(index, Date.now())
  }, [onSentenceReveal])

  // Reveal sentence at `revealed` index
  useEffect(() => {
    if (sentences.length === 0) return
    reveal(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance) return
    if (revealed === 0) return
    if (revealed >= sentences.length) {
      if (!completedRef.current) {
        completedRef.current = true
        if (onComplete) onComplete()
      }
      return
    }

    setShowPause(true)
    timerRef.current = setTimeout(() => {
      reveal(revealed)
    }, SPEED_MS[speed] ?? 2000)

    return () => clearTimeout(timerRef.current)
  }, [revealed, autoAdvance, speed, sentences.length, reveal, onComplete])

  // Manual advance on tap
  const handleTap = useCallback(() => {
    if (autoAdvance) return
    if (revealed >= sentences.length) {
      if (!completedRef.current) {
        completedRef.current = true
        if (onComplete) onComplete()
      }
      return
    }
    reveal(revealed)
  }, [autoAdvance, revealed, sentences.length, reveal, onComplete])

  // Scroll to bottom on each new reveal
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [revealed])

  const notDone = revealed < sentences.length

  return (
    <div
      className={styles.container}
      onClick={!autoAdvance ? handleTap : undefined}
    >
      {sentences.slice(0, revealed).map((text, i) => (
        <SentenceCard
          key={i}
          number={i + 1}
          text={text}
          isNew={i === newIndex}
        />
      ))}

      {autoAdvance && showPause && notDone && <PauseMarker />}

      {!autoAdvance && notDone && (
        <div className={styles.tapHint}>tap anywhere to continue</div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
