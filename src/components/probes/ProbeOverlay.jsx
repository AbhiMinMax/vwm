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
export default function ProbeOverlay({ probe, sentences, filledSlots, onComplete }) {
  const [answer, setAnswer] = useState(null)  // raw answer from probe component

  const handleAnswer = (rawAnswer) => {
    setAnswer(rawAnswer)
  }

  const handleDismiss = () => {
    if (onComplete) onComplete(answer)
  }

  const renderProbe = () => {
    if (probe.type === 'vigilance') {
      return (
        <FlagProbe
          probe={probe}
          sentences={sentences}
          onAnswer={handleAnswer}
        />
      )
    }
    if (probe.subtype === 'temporal_sequencing') {
      return (
        <SequenceProbe
          probe={probe}
          filledSlots={filledSlots}
          onAnswer={handleAnswer}
        />
      )
    }
    // binding, belief_state → MultipleChoiceProbe
    return (
      <MultipleChoiceProbe
        probe={probe}
        filledSlots={filledSlots}
        onAnswer={handleAnswer}
      />
    )
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        {answer === null ? (
          renderProbe()
        ) : (
          <div className={styles.resultWrapper}>
            <ProbeResult
              isCorrect={answer.isCorrect}
              correctLabel={answer.correctLabel ?? null}
              failureMode={answer.failureMode ?? answer.wrongAnswerType ?? null}
              onDismiss={handleDismiss}
            />
          </div>
        )}
      </div>
    </div>
  )
}
