// DimensionBar.jsx — progress bar for a single cognitive dimension.

import styles from './DimensionBar.module.css'
import { DIMENSION_LABELS } from '../../engine/defaults.js'

function deltaArrow(v) {
  if (v >  0.01) return '↑'
  if (v < -0.01) return '↓'
  return '→'
}

/**
 * Props:
 *   dimensionName — key e.g. 'interference_pressure'
 *   score         — 0–1
 *   delta         — number (may be undefined)
 *   highlight     — boolean (accent colour when true)
 */
export default function DimensionBar({ dimensionName, score, delta, highlight }) {
  const label     = DIMENSION_LABELS[dimensionName] ?? dimensionName
  const pct       = Math.round((score ?? 0) * 100)
  const hasDelta  = delta !== undefined && delta !== null
  const deltaUp   = hasDelta && delta > 0.01
  const deltaDown = hasDelta && delta < -0.01

  return (
    <div className={`${styles.row} ${highlight ? styles.highlight : ''}`}>
      <div className={styles.name}>{label}</div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.right}>
        <span className={styles.score}>{pct}%</span>
        {hasDelta && (
          <span className={`${styles.delta} ${deltaUp ? styles.up : deltaDown ? styles.down : ''}`}>
            {deltaArrow(delta)}
          </span>
        )}
      </div>
    </div>
  )
}
