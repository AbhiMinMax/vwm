// ProbeResult.jsx — correct/incorrect feedback shown after a probe answer.

import { useEffect } from 'react'
import styles from './ProbeResult.module.css'

const FAILURE_LABELS = {
  interference_confusion: 'Confused with interfering information',
  recency_bias:           'Over-weighted most recent item',
  primacy_bias:           'Over-weighted first item',
  missing_update:         'Missed a belief or state update',
  order_confusion:        'Confused event order',
  false_positive:         'Flagged a sentence that was consistent',
  miss:                   'Missed the inconsistency',
  wrong_location:         'Flagged the wrong sentence',
}

/**
 * Props:
 *   isCorrect    — boolean
 *   correctLabel — string (shown for incorrect answers)
 *   failureMode  — string key | null
 *   onDismiss    — () => void (called after 1800ms)
 */
export default function ProbeResult({ isCorrect, correctLabel, failureMode, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (onDismiss) onDismiss()
    }, 1800)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className={`${styles.result} ${isCorrect ? styles.correct : styles.incorrect}`}>
      <div className={styles.icon}>{isCorrect ? '✓' : '✗'}</div>
      {isCorrect ? (
        <div className={styles.label}>Correct</div>
      ) : (
        <>
          <div className={styles.label}>Incorrect</div>
          {correctLabel && (
            <div className={styles.correctAnswer}>Correct: {correctLabel}</div>
          )}
          {failureMode && FAILURE_LABELS[failureMode] && (
            <div className={styles.failureMode}>{FAILURE_LABELS[failureMode]}</div>
          )}
        </>
      )}
    </div>
  )
}
