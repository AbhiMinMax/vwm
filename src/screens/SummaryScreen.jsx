// SummaryScreen.jsx — session or workout summary with dimension scores, deltas, and next focus.

import { useLocation, useNavigate } from 'react-router-dom'
import { useStorage }   from '../hooks/useStorage.js'
import { ALL_DIMENSIONS } from '../engine/defaults.js'
import DimensionBar     from '../components/ui/DimensionBar.jsx'
import SessionStats     from '../components/summary/SessionStats.jsx'
import styles           from './SummaryScreen.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avgDimScores(workoutResults) {
  const sums   = {}
  const counts = {}
  for (const r of workoutResults) {
    for (const [dim, score] of Object.entries(r.dimensionScores ?? {})) {
      sums[dim]   = (sums[dim]   ?? 0) + score
      counts[dim] = (counts[dim] ?? 0) + 1
    }
  }
  return Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, v / counts[k]])
  )
}

function avgDeltas(workoutResults) {
  const sums   = {}
  const counts = {}
  for (const r of workoutResults) {
    for (const [dim, delta] of Object.entries(r.deltas ?? {})) {
      sums[dim]   = (sums[dim]   ?? 0) + delta
      counts[dim] = (counts[dim] ?? 0) + 1
    }
  }
  return Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, v / counts[k]])
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SummaryScreen() {
  const location = useLocation()
  const navigate = useNavigate()

  // For a single session: { sessionResult }
  // For a workout:        { sessionResult (last), workoutResults, isWorkout }
  const result         = location.state?.sessionResult
  const workoutResults = location.state?.workoutResults ?? []
  const isWorkout      = location.state?.isWorkout ?? false

  // Session history — only written here for single-session flow.
  // Workout sessions are written in SessionScreen as they complete.
  const [, setHistory] = useStorage('vwm_session_history', [])

  if (!isWorkout && result && typeof window !== 'undefined') {
    const key  = 'vwm_session_history'
    const prev = (() => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] } })()
    const last = prev[prev.length - 1]
    if (!last || last.sessionId !== result.sessionId) {
      const entry = {
        sessionId:     result.sessionId,
        sessionNumber: result.sessionNumber,
        sessionType:   result.sessionType,
        successRate:   result.successRate,
        domain:        result.domain,
        format:        result.format,
        ts:            Date.now(),
      }
      const next = [...prev, entry].slice(-50)
      localStorage.setItem(key, JSON.stringify(next))
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

  // ── Aggregate stats for workout, or use single-session fields ──
  let displaySessionNumber, displayType, displayDomain, displayFormat
  let displayDimScores, displayDeltas, displayDurationMs
  let displayTotalProbes, displayCorrectCount, displayStimuliCount

  if (isWorkout && workoutResults.length > 0) {
    displaySessionNumber  = null
    displayType           = result.sessionType
    displayDomain         = result.domain
    displayFormat         = result.format
    displayDimScores      = avgDimScores(workoutResults)
    displayDeltas         = avgDeltas(workoutResults)
    displayTotalProbes    = workoutResults.reduce((s, r) => s + (r.totalProbes  ?? 0), 0)
    displayCorrectCount   = workoutResults.reduce((s, r) => s + (r.correctCount ?? 0), 0)
    displayStimuliCount   = workoutResults.reduce((s, r) => s + (r.probeResults?.length ?? r.totalProbes ?? 0), 0)
    displayDurationMs     = workoutResults.reduce((s, r) => s + (r.durationMs   ?? 0), 0)
  } else {
    const {
      sessionNumber, sessionType, domain, format,
      totalProbes, correctCount, dimensionScores = {},
      deltas = {}, durationMs, probeResults = [],
    } = result

    displaySessionNumber = sessionNumber
    displayType          = sessionType
    displayDomain        = domain
    displayFormat        = format
    displayDimScores     = dimensionScores
    displayDeltas        = deltas
    displayTotalProbes   = totalProbes
    displayCorrectCount  = correctCount
    displayStimuliCount  = probeResults.length > 0 ? probeResults.length : totalProbes ?? 0
    displayDurationMs    = durationMs
  }

  const isAssessment = displayType === 'assessment'

  const testedDims  = ALL_DIMENSIONS.filter(d => displayDimScores[d] !== undefined)
  const weakestDim  = testedDims.length > 0
    ? testedDims.reduce((w, d) => (displayDimScores[d] ?? 1) < (displayDimScores[w] ?? 1) ? d : w, testedDims[0])
    : null

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.sessionLabel}>
          {isWorkout
            ? 'Workout'
            : `Session ${displaySessionNumber ?? '—'}`}
        </div>
        <span className={styles.typeTag}>
          {isWorkout
            ? `${workoutResults.length} sessions`
            : isAssessment ? 'Calibration' : displayType}
        </span>
      </div>

      {/* Stats */}
      <SessionStats
        stimuliCount={displayStimuliCount}
        probeCount={displayTotalProbes ?? 0}
        correctCount={displayCorrectCount ?? 0}
      />

      {/* Meta badges */}
      <div className={styles.metaRow}>
        <span className={styles.metaBadge}>{displayDomain}</span>
        <span className={styles.metaBadge}>{displayFormat}</span>
        {displayDurationMs != null && (
          <span className={styles.metaBadge}>{Math.round(displayDurationMs / 1000)}s</span>
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
              score={displayDimScores[dim]}
              delta={isAssessment ? undefined : displayDeltas[dim]}
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
          {isWorkout ? 'New workout' : 'Next session'}
        </button>
        <button className={styles.secondaryBtn} onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    </div>
  )
}
