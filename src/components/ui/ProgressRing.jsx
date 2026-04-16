// ProgressRing.jsx — SVG circle progress indicator.

import styles from './ProgressRing.module.css'

const R  = 16
const C  = 2 * Math.PI * R

/**
 * Props:
 *   current — sentences revealed so far
 *   total   — total sentences in session
 */
export default function ProgressRing({ current, total }) {
  const pct    = total > 0 ? current / total : 0
  const offset = C - pct * C

  return (
    <svg className={styles.ring} width="40" height="40" viewBox="0 0 40 40">
      <circle
        className={styles.track}
        cx="20" cy="20" r={R}
        fill="none"
        strokeWidth="3"
      />
      <circle
        className={styles.fill}
        cx="20" cy="20" r={R}
        fill="none"
        strokeWidth="3"
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text className={styles.label} x="20" y="24" textAnchor="middle">
        {current}
      </text>
    </svg>
  )
}
