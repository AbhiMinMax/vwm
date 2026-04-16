// SessionScreen.jsx — workout container + single-session runner.
//
// WorkoutContainer builds all N sessions at mount, then renders SingleSession
// components one at a time (key-based reset between sessions). After each
// session, the result is recorded and history is written. After the last
// session the user is sent to the summary screen.

import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAdaptive }         from '../hooks/useAdaptive.js'
import { useSession }          from '../hooks/useSession.js'
import { useTimer }            from '../hooks/useTimer.js'
import { useStorage }          from '../hooks/useStorage.js'
import { buildSession }        from '../engine/sessionBuilder.js'
import { templates }           from '../data/templates.js'
import StreamRenderer          from '../components/stream/StreamRenderer.jsx'
import ProbeOverlay            from '../components/probes/ProbeOverlay.jsx'
import ProgressRing            from '../components/ui/ProgressRing.jsx'
import styles                  from './SessionScreen.module.css'

// ─── Single session runner ─────────────────────────────────────────────────────
//
// Extracted so a key prop on WorkoutContainer can remount it between sessions,
// cleanly resetting all hooks (useSession, useTimer, useState).

function SingleSession({
  sessionData,
  sessionRequest,
  sessionIndex,
  workoutLength,
  settings,
  sessionNumber,
  onDone,
}) {
  const { startTimer, getElapsedMs }   = useTimer()
  const [revealedCount, setRevealedCount] = useState(0)

  const {
    phase,
    activeProbe,
    sentencesAtProbe,
    handleSentenceReveal,
    handleStreamComplete,
    handleProbeComplete,
    sessionResult,
  } = useSession(sessionData)

  const wrappedSentenceReveal = (index, ts) => {
    setRevealedCount(index + 1)
    handleSentenceReveal(index, ts)
  }

  useEffect(() => { startTimer() }, [startTimer])

  useEffect(() => {
    if (phase !== 'complete' || !sessionResult) return
    onDone({
      ...sessionResult,
      sessionId:    sessionRequest.session_id,
      sessionType:  sessionRequest.session_type,
      sessionNumber,
      domain:       sessionData.domain,
      format:       sessionData.format,
      durationMs:   getElapsedMs(),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const sentenceTexts = sessionData.sentences.map(s => s.text)
  const totalCount    = sentenceTexts.length

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.badges}>
          <span className={styles.badge}>{sessionData.domain}</span>
          <span className={styles.badge}>{sessionData.format}</span>
          {workoutLength > 1 && (
            <span className={styles.badge}>{sessionIndex + 1}/{workoutLength}</span>
          )}
        </div>
        <ProgressRing current={revealedCount} total={totalCount} />
      </div>

      <div className={styles.streamWrap}>
        <StreamRenderer
          sentences={sentenceTexts}
          speed={settings.speed ?? 'normal'}
          autoAdvance={phase === 'streaming' ? (settings.autoAdvance ?? true) : false}
          onSentenceReveal={wrappedSentenceReveal}
          onComplete={handleStreamComplete}
        />
      </div>

      {phase === 'probe' && activeProbe && (
        <ProbeOverlay
          probe={activeProbe}
          sentences={sentencesAtProbe}
          filledSlots={sessionData.usedSlots}
          onComplete={handleProbeComplete}
        />
      )}
    </div>
  )
}

// ─── Workout container ─────────────────────────────────────────────────────────

const EMPTY_SESSION = {
  sentences: [], probes: [], templateId: '', domain: '', format: '', usedSlots: {},
}

export default function SessionScreen() {
  const navigate = useNavigate()
  const { profile, settings, generateRequest, recordResult } = useAdaptive()
  const [, setHistory] = useStorage('vwm_session_history', [])

  const workoutLength      = settings.workoutLength ?? 1
  const initialSessionCount = profile.sessionsCompleted  // captured once at mount

  // Build all sessions upfront. Sessions use the profile at mount time; the
  // adaptive engine will use the updated profile on the next workout start.
  const [sessions] = useState(() => {
    const result = []
    for (let i = 0; i < workoutLength; i++) {
      try {
        const request = generateRequest()
        const data    = buildSession(request, templates)
        result.push({ request, data, error: null })
      } catch (err) {
        console.error('[SessionScreen] Failed to build session:', err)
        result.push({ request: null, data: null, error: err.message || 'Failed to build session' })
      }
    }
    return result
  })

  const [sessionIndex,   setSessionIndex]   = useState(0)
  const [workoutResults, setWorkoutResults] = useState([])

  function handleSessionDone(result) {
    // Record result so the adaptive engine can update baselines
    const { deltas } = recordResult({
      sessionId:       result.sessionId,
      sessionType:     result.sessionType,
      templateId:      result.templateId,
      usedSlots:       result.usedSlots,
      dimensionScores: result.dimensionScores,
      probeResults:    result.probeResults,
      successRate:     result.successRate,
    })

    const fullResult  = { ...result, deltas }
    const newResults  = [...workoutResults, fullResult]
    setWorkoutResults(newResults)

    // Write this session to history immediately
    const historyEntry = {
      sessionId:     fullResult.sessionId,
      sessionNumber: fullResult.sessionNumber,
      sessionType:   fullResult.sessionType,
      successRate:   fullResult.successRate,
      domain:        fullResult.domain,
      format:        fullResult.format,
      ts:            Date.now(),
    }
    setHistory(prev => [...prev, historyEntry].slice(-50))

    if (sessionIndex + 1 < sessions.length) {
      setSessionIndex(i => i + 1)
    } else {
      navigate('/summary', {
        state: {
          sessionResult:  fullResult,   // last session (for backward compat)
          workoutResults: newResults,
          isWorkout:      workoutLength > 1,
        },
        replace: true,
      })
    }
  }

  const current = sessions[sessionIndex]

  if (current.error) {
    return (
      <div className={styles.error}>
        <p className={styles.errorText}>Could not start session</p>
        <p className={styles.errorDetail}>{current.error}</p>
        <button className={styles.backBtn} onClick={() => navigate('/')}>Back</button>
      </div>
    )
  }

  return (
    <SingleSession
      key={sessionIndex}
      sessionData={current.data ?? EMPTY_SESSION}
      sessionRequest={current.request}
      sessionIndex={sessionIndex}
      workoutLength={workoutLength}
      settings={settings}
      sessionNumber={initialSessionCount + sessionIndex + 1}
      onDone={handleSessionDone}
    />
  )
}
