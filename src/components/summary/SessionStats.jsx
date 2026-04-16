// SessionStats.jsx — compact stat display for session summary.

import styles from './SessionStats.module.css'

/**
 * Props:
 *   stimuliCount  — total sentences shown
 *   probeCount    — total probes answered
 *   correctCount  — correct probe answers
 */
export default function SessionStats({ stimuliCount, probeCount, correctCount }) {
  return (
    <div className={styles.row}>
      <div className={styles.stat}>
        <span className={styles.num}>{stimuliCount}</span>
        <span className={styles.label}>stimuli</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <span className={styles.num}>{correctCount}/{probeCount}</span>
        <span className={styles.label}>correct</span>
      </div>
    </div>
  )
}
