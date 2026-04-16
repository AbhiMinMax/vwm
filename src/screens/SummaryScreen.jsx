// SummaryScreen.jsx — session summary (functional placeholder for Step 7).
// Full polish is in Step 8; this version shows real data and enables the
// end-to-end session flow.

import { useLocation, useNavigate } from 'react-router-dom'
import { DIMENSION_LABELS } from '../engine/defaults.js'
import styles from './SummaryScreen.module.css'

function deltaArrow(v) {
  if (v > 0.01)  return '↑'
  if (v < -0.01) return '↓'
  return '→'
}

function pct(v) {
  return `${Math.round((v ?? 0) * 100)}%`
}

export default function SummaryScreen() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const result    = location.state?.sessionResult

  if (!result) {
    // Navigated here directly (e.g. dev refresh) — show fallback
    return (
      <div className={styles.screen}>
        <p className={styles.noData}>No session data.</p>
        <button className={styles.btn} onClick={() => navigate('/')}>Home</button>
      </div>
    )
  }

  const {
    sessionNumber,
    sessionType,
    domain,
    format,
    successRate,
    totalProbes,
    correctCount,
    dimensionScores,
    deltas,
    durationMs,
  } = result

  const isAssessment = sessionType === 'assessment'

  // Dimensions that were actually tested this session
  const testedDims = Object.keys(dimensionScores ?? {})

  // Weakest dimension = lowest score
  const weakestDim = testedDims.reduce((worst, dim) =>
    (dimensionScores[dim] ?? 1) < (dimensionScores[worst] ?? 1) ? dim : worst,
    testedDims[0]
  )

  return (
    <div className={styles.screen}>
      {/* Session label */}
      <div className={styles.sessionLabel}>
        Session {sessionNumber ?? '—'}
        <span className={styles.typeTag}>
          {isAssessment ? 'Calibration' : sessionType}
        </span>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{pct(successRate)}</span>
          <span className={styles.statLabel}>accuracy</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{correctCount ?? 0}/{totalProbes ?? 0}</span>
          <span className={styles.statLabel}>probes</span>
        </div>
        {durationMs != null && (
          <div className={styles.stat}>
            <span className={styles.statNum}>{Math.round(durationMs / 1000)}s</span>
            <span className={styles.statLabel}>duration</span>
          </div>
        )}
      </div>

      {/* Domain / format */}
      <div className={styles.meta}>
        <span className={styles.metaTag}>{domain}</span>
        <span className={styles.metaTag}>{format}</span>
      </div>

      {/* Dimension scores */}
      {testedDims.length > 0 && (
        <div className={styles.dims}>
          <div className={styles.dimsHeading}>Dimension scores</div>
          {testedDims.map(dim => {
            const score = dimensionScores[dim] ?? 0
            const delta = deltas?.[dim] ?? 0
            const isWeak = dim === weakestDim && testedDims.length > 1
            return (
              <div key={dim} className={`${styles.dimRow} ${isWeak ? styles.weak : ''}`}>
                <div className={styles.dimName}>
                  {DIMENSION_LABELS[dim] ?? dim}
                  {isWeak && <span className={styles.weakTag}> focus</span>}
                </div>
                <div className={styles.dimBar}>
                  <div className={styles.dimFill} style={{ width: `${score * 100}%` }} />
                </div>
                <div className={styles.dimScore}>{pct(score)}</div>
                {!isAssessment && (
                  <div className={`${styles.dimDelta} ${delta > 0.01 ? styles.up : delta < -0.01 ? styles.down : ''}`}>
                    {deltaArrow(delta)}{Math.abs(delta) > 0.005 ? ` ${Math.round(Math.abs(delta) * 100)}` : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isAssessment && (
        <p className={styles.assessNote}>
          Baselines updated. Future sessions will be calibrated to your profile.
        </p>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={() => navigate('/session')}>
          Next session
        </button>
        <button className={styles.secondaryBtn} onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    </div>
  )
}
