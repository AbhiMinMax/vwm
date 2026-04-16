// SessionScreen.jsx — full session flow: adaptive request → stream → probe → summary.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdaptive }     from '../hooks/useAdaptive.js'
import { useSession }      from '../hooks/useSession.js'
import { useTimer }        from '../hooks/useTimer.js'
import { buildSession }    from '../engine/sessionBuilder.js'
import { templates }       from '../data/templates.js'
import StreamRenderer      from '../components/stream/StreamRenderer.jsx'
import ProbeOverlay        from '../components/probes/ProbeOverlay.jsx'
import styles              from './SessionScreen.module.css'

// ─── Session header ───────────────────────────────────────────────────────────

function SessionHeader({ domain, format, revealedCount, totalCount }) {
  const pct = totalCount > 0 ? Math.round((revealedCount / totalCount) * 100) : 0
  return (
    <div className={styles.header}>
      <div className={styles.badges}>
        <span className={styles.badge}>{domain}</span>
        <span className={styles.badge}>{format}</span>
      </div>
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressText}>{revealedCount}/{totalCount}</span>
      </div>
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SessionScreen() {
  const navigate = useNavigate()
  const { profile, settings, generateRequest, recordResult } = useAdaptive()
  const { startTimer, getElapsedMs } = useTimer()

  // Build session once on mount — stored in state so it never changes mid-session.
  // Error state if session generation fails (e.g. no templates available).
  const [initResult] = useState(() => {
    try {
      const request = generateRequest()
      const data    = buildSession(request, templates)
      return { request, data, error: null }
    } catch (err) {
      console.error('[SessionScreen] Failed to build session:', err)
      return { request: null, data: null, error: err.message || 'Failed to build session' }
    }
  })

  const { request: sessionRequest, data: sessionData, error: initError } = initResult

  // Session state machine (only wired when sessionData is available)
  const {
    phase,
    activeProbe,
    sentencesAtProbe,
    handleSentenceReveal,
    handleStreamComplete,
    handleProbeComplete,
    sessionResult,
  } = useSession(sessionData ?? EMPTY_SESSION)

  // Track sentences revealed for the progress indicator
  const [revealedCount, setRevealedCount] = useState(0)

  const wrappedSentenceReveal = (index, ts) => {
    setRevealedCount(index + 1)
    handleSentenceReveal(index, ts)
  }

  // Start timer on mount
  useEffect(() => {
    startTimer()
  }, [startTimer])

  // Navigate to summary when session is complete
  useEffect(() => {
    if (phase !== 'complete' || !sessionResult || !sessionRequest) return

    const { deltas } = recordResult({
      sessionId:       sessionRequest.session_id,
      sessionType:     sessionRequest.session_type,
      templateId:      sessionResult.templateId,
      usedSlots:       sessionResult.usedSlots,
      dimensionScores: sessionResult.dimensionScores,
      probeResults:    sessionResult.probeResults,
      successRate:     sessionResult.successRate,
    })

    navigate('/summary', {
      state: {
        sessionResult: {
          ...sessionResult,
          sessionId:   sessionRequest.session_id,
          sessionType: sessionRequest.session_type,
          sessionNumber: profile.sessionsCompleted + 1,
          domain:      sessionData.domain,
          format:      sessionData.format,
          deltas,
          durationMs:  getElapsedMs(),
        },
      },
      replace: true,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Error state ─────────────────────────────────────────────────────────

  if (initError) {
    return (
      <div className={styles.error}>
        <p className={styles.errorText}>Could not start session</p>
        <p className={styles.errorDetail}>{initError}</p>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          Back
        </button>
      </div>
    )
  }

  const sentenceTexts = sessionData.sentences.map(s => s.text)
  const totalCount    = sentenceTexts.length

  return (
    <div className={styles.screen}>
      <SessionHeader
        domain={sessionData.domain}
        format={sessionData.format}
        revealedCount={revealedCount}
        totalCount={totalCount}
      />

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

// Fallback so useSession never receives undefined
const EMPTY_SESSION = {
  sentences:  [],
  probes:     [],
  templateId: '',
  domain:     '',
  format:     '',
  usedSlots:  {},
}
