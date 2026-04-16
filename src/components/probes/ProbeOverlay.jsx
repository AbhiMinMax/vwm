// ProbeOverlay.jsx — bottom-sheet overlay that routes to the correct probe component.

import { useState } from 'react'
import MultipleChoiceProbe from './MultipleChoiceProbe'
import SequenceProbe from './SequenceProbe'
import FlagProbe from './FlagProbe'
import ProbeResult from './ProbeResult'
import styles from './ProbeOverlay.module.css'

/**
 * Props:
 *   probe       — probe object from session
 *   sentences   — array of sentence strings revealed so far (used by FlagProbe)
 *   filledSlots — slot value map (used by MC and Sequence probes)
 *   onComplete  — (result) => void  called after ProbeResult dismisses
 */
function fillText(text, filledSlots) {
  if (!text || !filledSlots) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => filledSlots[key] ?? `{${key}}`)
}

export default function ProbeOverlay({ probe, sentences, filledSlots, onComplete }) {
  const [answer, setAnswer] = useState(null)

  const handleAnswer = (rawAnswer) => { setAnswer(rawAnswer) }
  const handleDismiss = () => { if (onComplete) onComplete(answer) }

  const renderBody = () => {
    if (probe.type === 'vigilance') {
      return <FlagProbe probe={probe} sentences={sentences} onAnswer={handleAnswer} hideHeader />
    }
    if (probe.subtype === 'temporal_sequencing') {
      return <SequenceProbe probe={probe} filledSlots={filledSlots} onAnswer={handleAnswer} hideHeader />
    }
    return <MultipleChoiceProbe probe={probe} filledSlots={filledSlots} onAnswer={handleAnswer} hideHeader />
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.sheet}>
        {answer === null ? (
          <>
            <div className={styles.sheetHeader}>
              <div className={styles.handle} />
              <div className={styles.typeLabel}>{probe.subtype ?? probe.type}</div>
              <div className={styles.question}>{fillText(probe.question, filledSlots)}</div>
            </div>
            <div className={styles.sheetBody}>
              {renderBody()}
            </div>
          </>
        ) : (
          <>
            <div className={styles.sheetHeader}>
              <div className={styles.handle} />
            </div>
            <div className={styles.resultWrapper}>
              <ProbeResult
                isCorrect={answer.isCorrect}
                correctLabel={answer.correctLabel ?? null}
                failureMode={answer.failureMode ?? answer.wrongAnswerType ?? null}
                onDismiss={handleDismiss}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
