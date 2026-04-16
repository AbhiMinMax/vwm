// MultipleChoiceProbe.jsx — binding/belief state multiple-choice probe.

import { useState } from 'react'
import styles from './MultipleChoiceProbe.module.css'

function fillLabel(text, filledSlots) {
  if (!text || !filledSlots) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => filledSlots[key] ?? `{${key}}`)
}

/**
 * Props:
 *   probe       — probe object from template
 *   filledSlots — { E1: 'Alderman', E2: 'Reyes', ... }
 *   onAnswer    — ({ optionId, isCorrect, failureMode, responseTimeMs }) => void
 */
export default function MultipleChoiceProbe({ probe, filledSlots, onAnswer, hideHeader }) {
  const [selected, setSelected] = useState(null)
  const startedAt = useState(() => Date.now())[0]

  const handleTap = (option) => {
    if (selected !== null) return
    setSelected(option.id)
    const responseTimeMs = Date.now() - startedAt
    const correctOption = probe.options.find(o => o.is_correct)
    setTimeout(() => {
      onAnswer({
        optionId: option.id,
        isCorrect: option.is_correct,
        failureMode: option.failure_mode,
        correctLabel: fillLabel(correctOption?.label, filledSlots),
        responseTimeMs,
      })
    }, 180)
  }

  const question = fillLabel(probe.question, filledSlots)

  return (
    <div className={styles.container}>
      {!hideHeader && <div className={styles.typeLabel}>{probe.subtype ?? probe.type}</div>}
      {!hideHeader && <div className={styles.question}>{question}</div>}
      <div className={styles.options}>
        {probe.options.map(option => (
          <button
            key={option.id}
            className={`${styles.option} ${selected === option.id ? styles.selected : ''}`}
            onClick={() => handleTap(option)}
          >
            <span className={styles.optionId}>{option.id}</span>
            <span className={styles.optionLabel}>{fillLabel(option.label, filledSlots)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
