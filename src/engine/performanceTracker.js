// performanceTracker.js — computes dimension scores from probe results,
// calculates deltas against rolling averages, and updates the user profile.
//
// Scoring:
//   Each probe has a dimension_target.
//   Score per probe = rt-weighted correctness:
//     correct + responseTimeMs < 5000 → 1.0
//     correct + responseTimeMs >= 5000 → 0.8
//     incorrect                        → 0.0
//   Dimension score = mean of all probe scores for that dimension in the session.
//   Dimensions with no probes this session are not updated.

/**
 * Compute per-dimension scores from an array of probe results.
 *
 * @param {object[]} probeResults - Array of probe result objects.
 *   Each: { probeId, dimensionTarget, correct, responseTimeMs, failureMode }
 * @returns {object} dimensionScores — { dimension_name: score (0–1) }
 */
export function computeSessionScores(probeResults) {
  const totals = {}
  const counts = {}

  for (const result of probeResults) {
    const dim = result.dimensionTarget
    if (!dim) continue

    let score
    if (result.correct) {
      score = result.responseTimeMs < 5000 ? 1.0 : 0.8
    } else {
      score = 0.0
    }

    if (totals[dim] === undefined) { totals[dim] = 0; counts[dim] = 0 }
    totals[dim] += score
    counts[dim]++
  }

  const dimensionScores = {}
  for (const dim of Object.keys(totals)) {
    dimensionScores[dim] = totals[dim] / counts[dim]
  }
  return dimensionScores
}

/**
 * Compute per-dimension deltas: new score minus the most recent rolling average value.
 * If a dimension has no rolling history, delta is 0.
 *
 * @param {object} newScores   - { dim: score }
 * @param {object} rollingAvg  - { dim: number[] } — arrays of recent scores
 * @returns {object} delta — { dim: delta_value }
 */
export function computeDeltas(newScores, rollingAvg) {
  const delta = {}
  for (const [dim, score] of Object.entries(newScores)) {
    const history = rollingAvg[dim] || []
    const prev = history.length > 0 ? history[history.length - 1] : score
    delta[dim] = parseFloat((score - prev).toFixed(3))
  }
  return delta
}

/**
 * Update the user profile with results from a completed session.
 *
 * @param {object} profile       - Current user profile (immutable — returns new copy).
 * @param {object} sessionResult - { sessionId, sessionNumber, sessionType, templateId,
 *                                   dimensionScores, probeResults, usedSlots }
 * @returns {object} Updated user profile.
 */
export function updateUserProfile(profile, sessionResult) {
  const p = deepClone(profile)
  const { dimensionScores, sessionType, templateId, usedSlots } = sessionResult

  // Update rolling averages (last 5 sessions per dimension)
  for (const [dim, score] of Object.entries(dimensionScores)) {
    if (!p.dimensionRollingAvg[dim]) p.dimensionRollingAvg[dim] = []
    p.dimensionRollingAvg[dim].push(score)
    if (p.dimensionRollingAvg[dim].length > 5) {
      p.dimensionRollingAvg[dim].shift()
    }
  }

  // Assessment sessions update baselines instead of deltas
  if (sessionType === 'assessment') {
    for (const [dim, score] of Object.entries(dimensionScores)) {
      p.dimensionBaselines[dim] = score
    }
    // Clear consolidation flags after assessment calibration
    p.consolidationFlags = []
  }

  // Check consolidation triggers: rapid improvement = delta > 0.15 over last 3 sessions
  p.consolidationFlags = checkConsolidationTriggers(p)

  // Log template exposure (cap at 50)
  p.templateExposure.push(templateId)
  if (p.templateExposure.length > 50) p.templateExposure.shift()

  // Log used slot values (cap at 30)
  if (usedSlots) {
    p.recentSlots.push(...Object.values(usedSlots))
    if (p.recentSlots.length > 30) {
      p.recentSlots = p.recentSlots.slice(-30)
    }
  }

  p.sessionsCompleted++
  p.lastSessionType = sessionType

  return p
}

/**
 * Inspect rolling averages and flag dimensions showing rapid improvement.
 * Trigger: score improved by > 0.15 from the oldest to the newest value
 * across the last 3 sessions.
 */
export function checkConsolidationTriggers(profile) {
  const flags = [...(profile.consolidationFlags || [])]

  for (const [dim, history] of Object.entries(profile.dimensionRollingAvg)) {
    if (history.length < 3) continue
    const recent = history.slice(-3)
    const delta = recent[recent.length - 1] - recent[0]
    if (delta > 0.15 && !flags.includes(dim)) {
      flags.push(dim)
    }
  }

  return flags
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// ─── Inline tests ─────────────────────────────────────────────────────────────

export function __test() {
  // Test 1: scoring formula
  const probeResults = [
    { dimensionTarget: 'interference_pressure', correct: true,  responseTimeMs: 2000, failureMode: null },
    { dimensionTarget: 'interference_pressure', correct: true,  responseTimeMs: 7000, failureMode: null },
    { dimensionTarget: 'signal_quality',        correct: false, responseTimeMs: 3000, failureMode: 'binding_failure' },
    { dimensionTarget: 'temporal_order',        correct: true,  responseTimeMs: 1500, failureMode: null },
  ]

  const scores = computeSessionScores(probeResults)
  console.assert(
    Math.abs(scores.interference_pressure - 0.9) < 0.001,
    `FAIL: interference_pressure score should be 0.9, got ${scores.interference_pressure}`
  )
  console.assert(scores.signal_quality === 0.0, `FAIL: signal_quality score should be 0.0, got ${scores.signal_quality}`)
  console.assert(scores.temporal_order === 1.0,  `FAIL: temporal_order score should be 1.0, got ${scores.temporal_order}`)
  console.log('performanceTracker test1 — scoring formula correct')

  // Test 2: delta calculation
  const rollingAvg = {
    interference_pressure: [0.6, 0.7, 0.75],
    signal_quality:        [0.5],
  }
  const deltas = computeDeltas(scores, rollingAvg)
  console.assert(
    Math.abs(deltas.interference_pressure - (0.9 - 0.75)) < 0.001,
    `FAIL: interference delta incorrect: ${deltas.interference_pressure}`
  )
  console.log('performanceTracker test2 — delta calculation correct')

  // Test 3: profile update increments sessionsCompleted
  const DEFAULT_PROFILE = {
    sessionsCompleted:    0,
    dimensionBaselines:   { interference_pressure: 0.5 },
    dimensionRollingAvg:  { interference_pressure: [] },
    templateExposure:     [],
    recentSlots:          [],
    lastSessionType:      null,
    consolidationFlags:   [],
  }
  const updated = updateUserProfile(DEFAULT_PROFILE, {
    sessionId:       'S001',
    sessionNumber:   1,
    sessionType:     'training',
    templateId:      'T001',
    dimensionScores: scores,
    usedSlots:       { E1: 'Elena', E2: 'Marcus', O1: 'budget' },
  })
  console.assert(updated.sessionsCompleted === 1, 'FAIL: sessionsCompleted not incremented')
  console.assert(updated.templateExposure.includes('T001'), 'FAIL: template exposure not logged')
  console.assert(updated.recentSlots.includes('Elena'), 'FAIL: usedSlots not logged to recentSlots')
  console.log('performanceTracker test3 — profile update correct')

  // Test 4: consolidation trigger fires when rapid improvement detected
  const fastImproveProfile = {
    ...DEFAULT_PROFILE,
    dimensionRollingAvg: { signal_quality: [0.4, 0.5, 0.6] }, // delta = 0.2 > 0.15
    consolidationFlags: [],
  }
  const flags = checkConsolidationTriggers(fastImproveProfile)
  console.assert(flags.includes('signal_quality'), 'FAIL: consolidation flag not set for rapid improvement')
  console.log('performanceTracker test4 — consolidation trigger correct')

  console.log('performanceTracker: all tests passed')
}
