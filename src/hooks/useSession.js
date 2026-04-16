// useSession.js — session phase state machine.
//
// Phases: streaming → probe → streaming → ... → complete
//
// The state machine lives entirely in this hook. SessionScreen renders based
// on the exported phase and data. ProbeOverlay calls onProbeComplete when
// the user answers; StreamRenderer calls onSentenceReveal and onStreamComplete.
//
// Probe firing:
//   Each probe has fireAfterIndex (set by sessionBuilder). When sentence at that
//   index is revealed, the probe queue is activated. Multiple probes at the same
//   index are queued and shown sequentially.
//   The phase transition to 'probe' happens synchronously inside handleSentenceReveal
//   so that React batches it with the reveal state update — preventing StreamRenderer
//   from calling onComplete prematurely at the last sentence.

import { useState, useEffect, useRef, useCallback } from 'react'
import { computeSessionScores } from '../engine/performanceTracker.js'

/**
 * @param {object} sessionData — output of buildSession:
 *   { sentences, probes, templateId, domain, format, usedSlots }
 *
 * Returns:
 *   phase              — 'streaming' | 'probe' | 'complete'
 *   activeProbe        — probe object or null
 *   sentencesAtProbe   — sentence text[] visible when probe fired (for FlagProbe)
 *   handleSentenceReveal(index, timestampMs)
 *   handleStreamComplete()
 *   handleProbeComplete(rawResult)
 *   sessionResult      — set when phase === 'complete'
 */
export function useSession(sessionData) {
  const [phase, setPhase]                   = useState('streaming')
  const [activeProbe, setActiveProbe]       = useState(null)
  const [sentencesAtProbe, setSentencesAtProbe] = useState([])
  const [probeResults, setProbeResults]     = useState([])
  const [streamDone, setStreamDone]         = useState(false)
  const [sessionResult, setSessionResult]   = useState(null)

  // Ref-based queue so we can modify it synchronously inside callbacks
  const probeQueueRef = useRef([])

  // ── sentence reveal ───────────────────────────────────────────────────────

  const handleSentenceReveal = useCallback((sentenceIndex /*, timestampMs */) => {
    const firing = sessionData.probes.filter(p => p.fireAfterIndex === sentenceIndex)
    if (firing.length === 0) return

    // Queue all probes that fire here
    probeQueueRef.current = [...probeQueueRef.current, ...firing]

    // Activate the first queued probe immediately (synchronous state update so
    // React batches this with StreamRenderer's own state update, preventing
    // onComplete from firing prematurely at the last sentence).
    const next = probeQueueRef.current.shift()

    // Capture the sentences visible at this moment (for FlagProbe)
    const visibleTexts = sessionData.sentences
      .slice(0, sentenceIndex + 1)
      .map(s => s.text)

    setSentencesAtProbe(visibleTexts)
    setActiveProbe(next)
    setPhase('probe')
  }, [sessionData.probes, sessionData.sentences])

  // ── stream complete ───────────────────────────────────────────────────────

  const handleStreamComplete = useCallback(() => {
    setStreamDone(true)
  }, [])

  // ── probe complete ────────────────────────────────────────────────────────

  const handleProbeComplete = useCallback((rawResult) => {
    if (!activeProbe) return

    // Normalise result into the shape computeSessionScores expects
    const normalised = {
      probeId:         activeProbe.probe_id,
      dimensionTarget: activeProbe.dimension_target,
      correct:         rawResult.isCorrect,
      responseTimeMs:  rawResult.responseTimeMs ?? 0,
      failureMode:     rawResult.failureMode ?? rawResult.wrongAnswerType ?? null,
    }

    setProbeResults(prev => [...prev, normalised])

    // Dequeue next probe if any
    if (probeQueueRef.current.length > 0) {
      const next = probeQueueRef.current.shift()
      setActiveProbe(next)
      // phase stays 'probe'
    } else {
      setActiveProbe(null)
      setPhase('streaming')
    }
  }, [activeProbe])

  // ── completion check ──────────────────────────────────────────────────────
  //
  // Complete when:
  //   - stream is done AND
  //   - phase is back to 'streaming' (no probe active) AND
  //   - all probes answered
  //
  // probeResults.length === sessionData.probes.length is the all-answered check.
  // (probeQueueRef.current.length is 0 by the time phase goes back to streaming.)

  useEffect(() => {
    if (
      streamDone &&
      phase === 'streaming' &&
      probeResults.length === sessionData.probes.length
    ) {
      const dimensionScores = computeSessionScores(probeResults)
      const totalProbes     = probeResults.length
      const correctCount    = probeResults.filter(r => r.correct).length
      const successRate     = totalProbes > 0 ? correctCount / totalProbes : 1

      setSessionResult({
        templateId:      sessionData.templateId,
        domain:          sessionData.domain,
        format:          sessionData.format,
        usedSlots:       sessionData.usedSlots,
        probeResults,
        dimensionScores,
        successRate,
        totalProbes,
        correctCount,
      })
      setPhase('complete')
    }
  }, [streamDone, phase, probeResults, sessionData.probes.length,
      sessionData.templateId, sessionData.domain, sessionData.format, sessionData.usedSlots])

  return {
    phase,
    activeProbe,
    sentencesAtProbe,
    handleSentenceReveal,
    handleStreamComplete,
    handleProbeComplete,
    sessionResult,
  }
}
