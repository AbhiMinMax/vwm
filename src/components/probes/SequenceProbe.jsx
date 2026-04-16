// SequenceProbe.jsx — tap-to-order temporal sequencing probe.

import { useState } from 'react'
import styles from './SequenceProbe.module.css'

function fillLabel(text, filledSlots) {
  if (!text || !filledSlots) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => filledSlots[key] ?? `{${key}}`)
}

/**
 * Props:
 *   probe       — probe object with correct_sequence and options
 *   filledSlots — slot values map
 *   onAnswer    — ({ sequence, isCorrect, responseTimeMs }) => void
 */
export default function SequenceProbe({ probe, filledSlots, onAnswer }) {
  const [order, setOrder]   = useState([]) // array of option ids in tap order
  const startedAt           = useState(() => Date.now())[0]

  const tapped   = new Set(order)
  const allDone  = order.length === probe.options.length

  const handleTap = (id) => {
    if (tapped.has(id)) return
    setOrder(prev => [...prev, id])
  }

  const handleUndo = () => {
    setOrder(prev => prev.slice(0, -1))
  }

  const handleSubmit = () => {
    const responseTimeMs = Date.now() - startedAt
    const isCorrect =
      JSON.stringify(order) === JSON.stringify(probe.correct_sequence)
    onAnswer({ sequence: order, isCorrect, responseTimeMs })
  }

  return (
    <div className={styles.container}>
      <div className={styles.typeLabel}>temporal sequencing</div>
      <div className={styles.question}>{fillLabel(probe.question, filledSlots)}</div>
      <div className={styles.instruction}>Tap items in chronological order</div>

      <div className={styles.grid}>
        {probe.options.map(option => {
          const tapPos = order.indexOf(option.id)
          const isTapped = tapPos !== -1
          return (
            <button
              key={option.id}
              className={`${styles.item} ${isTapped ? styles.tapped : ''}`}
              onClick={() => handleTap(option.id)}
            >
              {isTapped && <span className={styles.badge}>{tapPos + 1}</span>}
              <span className={styles.label}>{fillLabel(option.label, filledSlots)}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.actions}>
        {order.length > 0 && (
          <button className={styles.undoBtn} onClick={handleUndo}>
            undo
          </button>
        )}
        {allDone && (
          <button className={styles.submitBtn} onClick={handleSubmit}>
            submit
          </button>
        )}
      </div>
    </div>
  )
}
