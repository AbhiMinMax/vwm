// FlagProbe.jsx — vigilance probe: tap the sentence that contains a contradiction/irrelevance.

import { useState } from 'react'
import styles from './FlagProbe.module.css'

/**
 * Props:
 *   probe     — probe object (type: 'vigilance', has target_sentence_index, correct_flag, wrong_answer_types)
 *   sentences — array of sentence strings (the full session sentences at probe time)
 *   onAnswer  — ({ flaggedSentences, isCorrect, wrongAnswerType, responseTimeMs }) => void
 */
export default function FlagProbe({ probe, sentences, onAnswer, hideHeader }) {
  const [flagged, setFlagged]     = useState(null)  // sentence index (0-based) or 'none'
  const [confirmed, setConfirmed] = useState(false)
  const startedAt                 = useState(() => Date.now())[0]

  const handleSentenceTap = (idx) => {
    if (confirmed) return
    setFlagged(prev => prev === idx ? null : idx)
  }

  const handleNone = () => {
    if (confirmed) return
    setFlagged(prev => prev === 'none' ? null : 'none')
  }

  const handleConfirm = () => {
    if (flagged === null) return
    setConfirmed(true)
    const responseTimeMs = Date.now() - startedAt

    const correctIndex = probe.correct_flag
    let isCorrect = false
    let wrongAnswerType = null

    if (flagged === 'none') {
      isCorrect = false
      wrongAnswerType = 'miss'
    } else if (flagged === correctIndex) {
      isCorrect = true
    } else {
      isCorrect = false
      wrongAnswerType = probe.wrong_answer_types?.[String(flagged)] ?? 'false_positive'
    }

    onAnswer({
      flaggedSentences: flagged === 'none' ? [] : [flagged],
      isCorrect,
      wrongAnswerType,
      responseTimeMs,
    })
  }

  return (
    <div className={styles.container}>
      {!hideHeader && <div className={styles.typeLabel}>{probe.subtype ?? 'vigilance'}</div>}
      {!hideHeader && <div className={styles.question}>{probe.question}</div>}

      <div className={styles.sentences}>
        {sentences.map((text, idx) => (
          <button
            key={idx}
            className={`${styles.sentence} ${flagged === idx ? styles.flagged : ''}`}
            onClick={() => handleSentenceTap(idx)}
          >
            <span className={styles.num}>{idx + 1}</span>
            <span className={styles.text}>{text}</span>
          </button>
        ))}
      </div>

      <button
        className={`${styles.noneBtn} ${flagged === 'none' ? styles.noneSelected : ''}`}
        onClick={handleNone}
      >
        None detected
      </button>

      {flagged !== null && !confirmed && (
        <button className={styles.confirmBtn} onClick={handleConfirm}>
          Confirm selection
        </button>
      )}
    </div>
  )
}
