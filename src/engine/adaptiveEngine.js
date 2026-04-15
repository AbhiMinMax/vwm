// adaptiveEngine.js — generates session requests based on user profile and settings.
//
// Session type rotation:
//   Every 10th session → assessment (user not informed until summary)
//   Consolidation flag set → consolidation session
//   Otherwise            → training session
//
// Training session logic:
//   1. Identify weakest dimension (lowest rolling average mean)
//   2. Pick a random secondary dimension (non-plateaued, not same as primary)
//   3. Compute target difficulty to hit ~85% success rate
//   4. Add deliberate noise: ±1 level, 30% of the time
//   5. Select domain (bias toward counter-alignment for advanced users)
//   6. Format always random and independent

import { ALL_DIMENSIONS } from './defaults.js'
import { domains }        from '../data/domains.js'

const CONTENT_DIMS = ['interference_pressure', 'signal_quality', 'nesting_depth', 'discourse_structure']
const FORMATS      = ['narrative', 'argument', 'conversation']
const RETRIEVAL_MODES = ['end_probe', 'interrupt', 'delayed']

// Dimensions that have natural capacity ceilings
const CAPACITY_BOUND_DIMS = new Set(['nesting_depth', 'model_complexity'])

/**
 * Determine session type for this session number.
 */
export function determineSessionType(sessionNumber, profile) {
  if (sessionNumber % 10 === 0) return 'assessment'
  if (profile.consolidationFlags && profile.consolidationFlags.length > 0) return 'consolidation'
  return 'training'
}

/**
 * Compute mean of a number array. Returns 0.5 for empty arrays.
 */
function mean(arr) {
  if (arr.length === 0) return 0.5
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

/**
 * Get the weakest dimension — lowest rolling average mean.
 * Falls back to 'interference_pressure' if all histories are empty.
 */
export function getWeakestDimension(rollingAvg) {
  let worst = null
  let worstScore = Infinity

  for (const dim of CONTENT_DIMS) {
    const score = mean(rollingAvg[dim] || [])
    if (score < worstScore) {
      worstScore = score
      worst = dim
    }
  }
  return worst || 'interference_pressure'
}

/**
 * Get a random secondary dimension, avoiding the primary and plateaued ones.
 */
function getSecondaryDimension(profile, primaryDim) {
  const available = CONTENT_DIMS.filter(d => {
    if (d === primaryDim) return false
    // Skip capacity-bound dims if user is already strong at them
    if (CAPACITY_BOUND_DIMS.has(d)) {
      const score = mean(profile.dimensionRollingAvg[d] || [])
      if (score > 0.85) return false
    }
    return true
  })

  if (available.length === 0) return CONTENT_DIMS.find(d => d !== primaryDim) || CONTENT_DIMS[0]
  return available[Math.floor(Math.random() * available.length)]
}

/**
 * Compute target difficulty level (1–5) to hit the target success rate.
 * Uses the rolling average to estimate current skill level, then offsets:
 *   Higher skill → higher difficulty (to maintain challenge)
 *   Target 85% success: if recent score is 0.85, current level is about right
 *   If score > 0.85, increase difficulty; if < 0.85, decrease
 *
 * Capacity-bound dimensions cap at 2 (nesting_depth) or 4 (model_complexity).
 */
function getDifficultyForSuccessRate(profile, dimension, targetRate) {
  const history  = profile.dimensionRollingAvg[dimension] || []
  const baseline = profile.dimensionBaselines[dimension] || 0.5
  const recent   = mean(history)

  // Skill estimate: weighted blend of baseline and recent
  const skill = history.length > 0 ? (recent * 0.7 + baseline * 0.3) : baseline

  // Map skill to difficulty: skill 0.5 → level 2; skill 0.85 → level 3; skill 1.0 → level 5
  let level = 1 + Math.round(skill * 4)
  level = Math.max(1, Math.min(5, level))

  // Adjust based on whether we're above/below target success rate
  if (recent > targetRate + 0.05 && history.length >= 2) level = Math.min(5, level + 1)
  if (recent < targetRate - 0.05 && history.length >= 2) level = Math.max(1, level - 1)

  // Capacity ceiling
  if (dimension === 'nesting_depth')    level = Math.min(2, level)
  if (dimension === 'model_complexity') level = Math.min(4, level)

  return level
}

/**
 * Select a domain for the session.
 * Advanced users (mean skill > 0.75) get counter-alignment (domain biases that
 * stress their weakest dimensions). Beginners get any enabled domain.
 */
function selectDomain(profile, settings, primaryDim) {
  const enabledDomains = settings.preferredDomains && settings.preferredDomains.length > 0
    ? domains.filter(d => settings.preferredDomains.includes(d.domain_id))
    : domains

  if (enabledDomains.length === 0) return { selected: 'corporate', bias_alignment: 'neutral' }

  const overallSkill = mean(
    Object.values(profile.dimensionRollingAvg).map(h => mean(h))
  )

  if (overallSkill > 0.75) {
    // Counter-alignment: prefer domains that naturally stress the primary dimension
    const domainBiasMap = {
      interference_pressure: ['corporate', 'financial', 'emergency'],
      signal_quality:        ['legal', 'medical', 'political'],
      nesting_depth:         ['political', 'family', 'academic'],
      discourse_structure:   ['legal', 'academic', 'political'],
      temporal_order:        ['financial', 'supply_chain', 'emergency'],
    }
    const preferred = domainBiasMap[primaryDim] || []
    const counterDomains = enabledDomains.filter(d => preferred.includes(d.domain_id))
    if (counterDomains.length > 0) {
      const picked = counterDomains[Math.floor(Math.random() * counterDomains.length)]
      return { selected: picked.domain_id, bias_alignment: 'counter' }
    }
  }

  const picked = enabledDomains[Math.floor(Math.random() * enabledDomains.length)]
  return { selected: picked.domain_id, bias_alignment: 'neutral' }
}

/**
 * Get retrieval unpredictability mode based on skill level.
 * Beginners always get end_probe. Intermediate get delayed. Advanced get interrupt.
 */
function getRetrievalMode(profile) {
  const skill = mean(Object.values(profile.dimensionRollingAvg).map(h => mean(h)))
  if (skill < 0.5) return 'end_probe'
  if (skill < 0.75) return 'delayed'
  return RETRIEVAL_MODES[Math.floor(Math.random() * RETRIEVAL_MODES.length)]
}

/**
 * Get model_complexity level based on overall skill.
 */
function getComplexityLevel(profile) {
  const skill = mean(Object.values(profile.dimensionRollingAvg).map(h => mean(h)))
  if (skill < 0.5)  return 2
  if (skill < 0.75) return 3
  return Math.min(4, 3 + Math.floor(skill * 2))
}

/**
 * Get recently exposed templates for exclusion (last 20).
 */
function getRecentTemplates(profile, n = 20) {
  return profile.templateExposure.slice(-n)
}

/**
 * Get recently used slot values for exclusion (last 10).
 */
function getRecentSlots(profile, n = 10) {
  return profile.recentSlots.slice(-n)
}

// ─── Session request builders ──────────────────────────────────────────────────

function buildTrainingRequest(profile, settings, sessionNumber) {
  const primary   = getWeakestDimension(profile.dimensionRollingAvg)
  const secondary = getSecondaryDimension(profile, primary)

  let primaryLevel = getDifficultyForSuccessRate(profile, primary, 0.85)

  // Deliberate noise: ±1 level 30% of the time
  if (Math.random() < 0.3) {
    primaryLevel = Math.max(1, Math.min(5, primaryLevel + (Math.random() < 0.5 ? 1 : -1)))
  }

  const secondaryLevel = getDifficultyForSuccessRate(profile, secondary, 0.85)
  const domain = selectDomain(profile, settings, primary)

  return {
    session_id:   `S${sessionNumber}`,
    session_type: 'training',
    target_dimensions: {
      primary:   { [primary]: primaryLevel },
      secondary: { [secondary]: secondaryLevel },
    },
    procedural_dimensions: {
      format:                     FORMATS[Math.floor(Math.random() * FORMATS.length)],
      model_complexity:           getComplexityLevel(profile),
      temporal_order:             Math.random() < 0.5 ? 'linear' : 'nonlinear',
      retrieval_unpredictability: getRetrievalMode(profile),
    },
    adaptive_parameters: {
      speed:                settings.speed              || 'normal',
      probe_delay:          settings.probeDelay         || 'medium',
      redundancy_injection: settings.redundancyInjection || 'none',
      concurrent_stream:    settings.concurrentStream   || false,
    },
    domain,
    constraints: {
      exclude_templates:          getRecentTemplates(profile, 20),
      exclude_slots:              getRecentSlots(profile, 10),
      nearest_neighbor_tolerance: 1,
      target_success_rate:        0.85,
    },
  }
}

function buildAssessmentRequest(profile, settings, sessionNumber) {
  // Assessment: normal pace, medium difficulty, no feedback
  // Covers all dimensions evenly
  const domain = selectDomain(profile, settings, 'discourse_structure')
  return {
    session_id:   `S${sessionNumber}`,
    session_type: 'assessment',
    target_dimensions: {
      primary:   { interference_pressure: 3 },
      secondary: { signal_quality: 3 },
    },
    procedural_dimensions: {
      format:                     FORMATS[Math.floor(Math.random() * FORMATS.length)],
      model_complexity:           3,
      temporal_order:             'nonlinear',
      retrieval_unpredictability: 'end_probe',
    },
    adaptive_parameters: {
      speed:                'normal',
      probe_delay:          'medium',
      redundancy_injection: 'none',
      concurrent_stream:    false,
    },
    domain,
    constraints: {
      exclude_templates:          getRecentTemplates(profile, 10),
      exclude_slots:              getRecentSlots(profile, 5),
      nearest_neighbor_tolerance: 2,
      target_success_rate:        0.85,
    },
  }
}

function buildConsolidationRequest(profile, settings, sessionNumber) {
  // Consolidation: plateau difficulty on the flagged dimension, vary domain/format widely
  const flaggedDim = profile.consolidationFlags[0]
  const currentLevel = getDifficultyForSuccessRate(profile, flaggedDim, 0.85)

  // Use a random domain (not the usual counter-aligned one)
  const allEnabledDomains = settings.preferredDomains && settings.preferredDomains.length > 0
    ? domains.filter(d => settings.preferredDomains.includes(d.domain_id))
    : domains
  const domain = allEnabledDomains[Math.floor(Math.random() * allEnabledDomains.length)]

  return {
    session_id:   `S${sessionNumber}`,
    session_type: 'consolidation',
    target_dimensions: {
      primary:   { [flaggedDim]: currentLevel },
      secondary: {},
    },
    procedural_dimensions: {
      format:                     FORMATS[Math.floor(Math.random() * FORMATS.length)],
      model_complexity:           getComplexityLevel(profile),
      temporal_order:             Math.random() < 0.5 ? 'linear' : 'nonlinear',
      retrieval_unpredictability: getRetrievalMode(profile),
    },
    adaptive_parameters: {
      speed:                settings.speed              || 'normal',
      probe_delay:          settings.probeDelay         || 'medium',
      redundancy_injection: settings.redundancyInjection || 'none',
      concurrent_stream:    settings.concurrentStream   || false,
    },
    domain: { selected: domain.domain_id, bias_alignment: 'random' },
    constraints: {
      exclude_templates:          getRecentTemplates(profile, 20),
      exclude_slots:              getRecentSlots(profile, 10),
      nearest_neighbor_tolerance: 1,
      target_success_rate:        0.85,
    },
  }
}

/**
 * Main entry point: generate a session request from user profile and settings.
 */
export function generateSessionRequest(profile, settings) {
  const sessionNumber = profile.sessionsCompleted + 1

  // Manual override: bypass adaptive engine
  if (settings.manualOverride) {
    const dims = settings.manualDimensions || {}
    return {
      session_id:   `S${sessionNumber}`,
      session_type: 'training',
      target_dimensions: {
        primary:   { interference_pressure: dims.interference_pressure || 3 },
        secondary: { signal_quality: dims.signal_quality || 3 },
      },
      procedural_dimensions: {
        format:                     FORMATS[Math.floor(Math.random() * FORMATS.length)],
        model_complexity:           dims.model_complexity    || 2,
        temporal_order:             Math.random() < 0.5 ? 'linear' : 'nonlinear',
        retrieval_unpredictability: 'end_probe',
      },
      adaptive_parameters: {
        speed:                settings.speed              || 'normal',
        probe_delay:          settings.probeDelay         || 'medium',
        redundancy_injection: settings.redundancyInjection || 'none',
        concurrent_stream:    settings.concurrentStream   || false,
      },
      domain: { selected: 'corporate', bias_alignment: 'manual' },
      constraints: {
        exclude_templates:          [],
        exclude_slots:              [],
        nearest_neighbor_tolerance: 2,
        target_success_rate:        0.85,
      },
    }
  }

  const sessionType = determineSessionType(sessionNumber, profile)

  if (sessionType === 'assessment')    return buildAssessmentRequest(profile, settings, sessionNumber)
  if (sessionType === 'consolidation') return buildConsolidationRequest(profile, settings, sessionNumber)
  return buildTrainingRequest(profile, settings, sessionNumber)
}

// ─── Inline tests ─────────────────────────────────────────────────────────────

export function __test() {
  const freshProfile = {
    sessionsCompleted:    0,
    dimensionBaselines:   { interference_pressure: 0.5, signal_quality: 0.5, nesting_depth: 0.5, discourse_structure: 0.5, temporal_order: 0.5 },
    dimensionRollingAvg:  { interference_pressure: [], signal_quality: [], nesting_depth: [], discourse_structure: [], temporal_order: [] },
    templateExposure:     [],
    recentSlots:          [],
    lastSessionType:      null,
    consolidationFlags:   [],
  }
  const settings = { speed: 'normal', probeDelay: 'medium', redundancyInjection: 'none', concurrentStream: false, preferredDomains: [], manualOverride: false }

  // Test 1: fresh profile generates a valid training request
  const req = generateSessionRequest(freshProfile, settings)
  console.assert(req.session_type === 'training', `FAIL: fresh profile should yield training session, got ${req.session_type}`)
  console.assert(req.target_dimensions.primary, 'FAIL: no primary dimension in request')
  console.assert(req.domain.selected, 'FAIL: no domain selected')
  console.log(`adaptiveEngine test1 — fresh profile → ${req.session_type}, domain: ${req.domain.selected}`)

  // Test 2: every 10th session is assessment
  const profileAt9 = { ...freshProfile, sessionsCompleted: 9 }
  const req10 = generateSessionRequest(profileAt9, settings)
  console.assert(req10.session_type === 'assessment', `FAIL: session 10 should be assessment, got ${req10.session_type}`)
  console.log(`adaptiveEngine test2 — session 10 is assessment`)

  // Test 3: consolidation flag triggers consolidation session
  const profileWithFlag = { ...freshProfile, sessionsCompleted: 1, consolidationFlags: ['signal_quality'] }
  const reqConsolid = generateSessionRequest(profileWithFlag, settings)
  console.assert(reqConsolid.session_type === 'consolidation', `FAIL: consolidation flag should yield consolidation session, got ${reqConsolid.session_type}`)
  console.log(`adaptiveEngine test3 — consolidation flag → consolidation session`)

  // Test 4: assessment takes precedence over consolidation at session 20
  const profileAt19Flag = { ...freshProfile, sessionsCompleted: 19, consolidationFlags: ['nesting_depth'] }
  const req20 = generateSessionRequest(profileAt19Flag, settings)
  console.assert(req20.session_type === 'assessment', `FAIL: session 20 should be assessment even with flag, got ${req20.session_type}`)
  console.log(`adaptiveEngine test4 — session 20 is assessment even with consolidation flag`)

  // Test 5: manual override bypasses adaptive engine
  const overrideSettings = { ...settings, manualOverride: true, manualDimensions: { interference_pressure: 4 } }
  const reqOverride = generateSessionRequest(freshProfile, overrideSettings)
  console.assert(reqOverride.session_type === 'training', 'FAIL: manual override should produce training session')
  console.assert(reqOverride.target_dimensions.primary.interference_pressure === 4, 'FAIL: manual dimension not applied')
  console.log(`adaptiveEngine test5 — manual override applied`)

  console.log('adaptiveEngine: all tests passed')
}
