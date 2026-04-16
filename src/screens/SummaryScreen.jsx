// SummaryScreen.jsx — session summary with dimension scores, deltas, and next focus.

import { useLocation, useNavigate } from 'react-router-dom'
import { useStorage }   from '../hooks/useStorage.js'
import { ALL_DIMENSIONS } from '../engine/defaults.js'
import DimensionBar     from '../components/ui/DimensionBar.jsx'
import SessionStats     from '../components/summary/SessionStats.jsx'
import styles           from './SummaryScreen.module.css'

export default function SummaryScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const result   = location.state?.sessionResult

  // Session history (last 10 for Settings screen to display)
  const [, setHistory] = useStorage('vwm_session_history', [])

  // Persist this session to history on first render (result present)
  // Using a ref pattern via localStorage directly to avoid double-write
  if (result && typeof window !== 'undefined') {
    const key  = 'vwm_session_history'
    const prev = (() => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] } })()
    // Only add if not already the last entry (prevents double-write on re-render)
    const last = prev[prev.length - 1]
    if (!last || last.sessionId !== result.sessionId) {
      const entry = {
        sessionId:    result.sessionId,
        sessionNumber: result.sessionNumber,
        sessionType:  result.sessionType,
        successRate:  result.successRate,
        domain:       result.domain,
        format:       result.format,
        ts:           Date.now(),
      }
      const next = [...prev, entry].slice(-10)
      localStorage.setItem(key, JSON.stringify(next))
      // Sync React state
      setHistory(next)
    }
  }

  if (!result) {
    return (
      <div className={styles.screen}>
        <p className={styles.noData}>No session data.</p>
        <button className={styles.secondaryBtn} onClick={() => navigate('/')}>Home</button>
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
    dimensionScores = {},
    deltas = {},
    durationMs,
    probeResults = [],
  } = result

  const isAssessment = sessionType === 'assessment'
  const stimuliCount = probeResults.length > 0 ? probeResults.length : totalProbes ?? 0

  // Dimensions tested this session, in canonical order
  const testedDims = ALL_DIMENSIONS.filter(d => dimensionScores[d] !== undefined)

  // Weakest = lowest score among tested dims
  const weakestDim = testedDims.length > 0
    ? testedDims.reduce((w, d) => (dimensionScores[d] ?? 1) < (dimensionScores[w] ?? 1) ? d : w, testedDims[0])
    : null

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.sessionLabel}>Session {sessionNumber ?? '—'}</div>
        <span className={styles.typeTag}>
          {isAssessment ? 'Calibration' : sessionType}
        </span>
      </div>

      {/* Stats */}
      <SessionStats
        stimuliCount={stimuliCount}
        probeCount={totalProbes ?? 0}
        correctCount={correctCount ?? 0}
      />

      {/* Meta badges */}
      <div className={styles.metaRow}>
        <span className={styles.metaBadge}>{domain}</span>
        <span className={styles.metaBadge}>{format}</span>
        {durationMs != null && (
          <span className={styles.metaBadge}>{Math.round(durationMs / 1000)}s</span>
        )}
      </div>

      {/* Dimension scores */}
      {testedDims.length > 0 && (
        <div className={styles.dims}>
          <div className={styles.dimsLabel}>Dimension scores</div>
          {testedDims.map(dim => (
            <DimensionBar
              key={dim}
              dimensionName={dim}
              score={dimensionScores[dim]}
              delta={isAssessment ? undefined : deltas[dim]}
              highlight={dim === weakestDim && testedDims.length > 1}
            />
          ))}

          {weakestDim && testedDims.length > 1 && !isAssessment && (
            <div className={styles.focusHint}>
              Next session focus: <strong>{weakestDim.replace(/_/g, ' ')}</strong>
            </div>
          )}
        </div>
      )}

      {isAssessment && (
        <p className={styles.assessNote}>
          Baselines updated. Future sessions are calibrated to your profile.
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
