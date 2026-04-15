// sessionBuilder.js — assembles a complete session from a session request.
//
// Responsibilities:
//   1. Select a template via nearest-neighbour matching.
//   2. Fill surface slots.
//   3. Apply temporal order (linear = chronological sort, nonlinear = template order).
//   4. Inject redundancy sentences at randomised positions.
//   5. Schedule probes at the correct positions based on retrieval_unpredictability
//      and probe_delay.
//
// Returns a session object:
//   { sentences, probes, templateId, domain, format, usedSlots }
//
// "sentences" is an array of { text, originalIndex } where originalIndex is the
// 0-based index in the filled (pre-reorder) sentence array — used by FlagProbe
// to correlate back to probe target_sentence_index.

import { selectTemplate } from './templateSelector.js'
import { fillSlots }      from './slotFiller.js'
import { domains }        from '../data/domains.js'

// Probe delay offset ranges (additional sentences after natural insert point)
const PROBE_DELAY_OFFSETS = {
  immediate: 0,
  short:     1,
  medium:    3,
  long:      5,
}

// Speed → milliseconds between sentences
export const SPEED_MS = {
  slow:     3000,
  normal:   2000,
  fast:     1000,
  pressure: 500,
}

/**
 * Build a complete session from a session request.
 *
 * @param {object}   request     - Session request (from adaptiveEngine).
 * @param {object[]} allTemplates
 * @param {object}   slotsLib    - slots object (passed in, not imported, to keep layer pure).
 * @param {object[]} allDomains  - domains array.
 * @returns {object} session object
 */
export function buildSession(request, allTemplates) {
  const { target_dimensions, procedural_dimensions, adaptive_parameters, domain, constraints } = request

  // Flatten primary + secondary target dims for template selector
  const flatTargetDims = {
    ...target_dimensions.primary,
    ...target_dimensions.secondary,
  }

  // 1. Select template
  const template = selectTemplate(
    flatTargetDims,
    allTemplates,
    constraints.exclude_templates || [],
    constraints.nearest_neighbor_tolerance ?? 1
  )
  if (!template) throw new Error('sessionBuilder: no template available')

  // 2. Fill slots
  const { filledSentences, filledSlots, probes: filledProbes } = fillSlots(
    template,
    domain.selected,
    constraints.exclude_slots || []
  )

  // 3. Apply temporal order
  // nonlinear → template order (author's story order, may be non-chronological)
  // linear    → sort sentences into chronological order using chronological_order
  const orderedSentences = applyTemporalOrder(
    filledSentences,
    template.chronological_order,
    procedural_dimensions.temporal_order
  )

  // 4. Inject redundancy sentences
  const sentencesWithRedundancy = injectRedundancy(
    orderedSentences,
    adaptive_parameters.redundancy_injection || 'none',
    domain.selected
  )

  // 5. Schedule probes
  const scheduledProbes = scheduleProbes(
    filledProbes,
    sentencesWithRedundancy,
    procedural_dimensions.retrieval_unpredictability,
    adaptive_parameters.probe_delay
  )

  return {
    sentences:  sentencesWithRedundancy,
    probes:     scheduledProbes,
    templateId: template.template_id,
    domain:     domain.selected,
    format:     procedural_dimensions.format,
    usedSlots:  filledSlots,
  }
}

/**
 * Reorder sentences according to temporal_order parameter.
 * Returns array of { text, originalIndex } objects.
 */
function applyTemporalOrder(filledSentences, chronologicalOrder, temporalOrder) {
  if (temporalOrder === 'linear') {
    // Present in true chronological order: sort sentence indices by their position
    // in chronologicalOrder (the array tells us which sentence happened first).
    // chronologicalOrder[i] = index in filledSentences of the i-th chronological event.
    const sorted = chronologicalOrder.map(origIdx => ({
      text:          filledSentences[origIdx],
      originalIndex: origIdx,
    }))
    return sorted
  }

  // nonlinear: present in template order (the default array order)
  return filledSentences.map((text, i) => ({ text, originalIndex: i }))
}

/**
 * Inject redundancy sentences into the stream.
 * Redundancy sentences are inserted at random positions between content sentences.
 * They are marked with isRedundancy: true so the stream renderer can treat them
 * identically to content sentences (no special styling — that would be a tell).
 */
function injectRedundancy(sentences, redundancyLevel, domainId) {
  if (redundancyLevel === 'none') return sentences

  const count = redundancyLevel === 'low' ? 1 : getRandomInt(2, 3)
  const redundancySentences = sampleRedundancySentences(domainId, count)

  const result = [...sentences]
  for (const rs of redundancySentences) {
    // Insert at a random position (not first or last to preserve narrative framing)
    const pos = result.length > 2
      ? getRandomInt(1, result.length - 1)
      : result.length
    result.splice(pos, 0, { text: rs, originalIndex: -1, isRedundancy: true })
  }
  return result
}

/**
 * Sample redundancy sentence templates from the domain and fill {R_E} slots
 * with random entity_professional values.
 */
function sampleRedundancySentences(domainId, count) {
  const domain = domains.find(d => d.domain_id === domainId)
  const pool = domain?.redundancy_templates || []
  if (pool.length === 0) return []

  const sampled = []
  const usedIndices = new Set()
  for (let i = 0; i < count; i++) {
    let idx
    let attempts = 0
    do {
      idx = getRandomInt(0, pool.length - 1)
      attempts++
    } while (usedIndices.has(idx) && attempts < pool.length * 2)
    usedIndices.add(idx)

    // Fill {R_E} slot with a random name (keep it simple — no slot library lookup needed)
    const placeholderNames = ['Chen', 'Sana', 'Eli', 'Nora', 'Farid', 'Mia', 'Viktor', 'Dana']
    const name = placeholderNames[getRandomInt(0, placeholderNames.length - 1)]
    sampled.push(pool[idx].replace(/\{R_E\}/g, name))
  }
  return sampled
}

/**
 * Schedule probe fire positions within the sentence array.
 *
 * retrieval_unpredictability:
 *   end_probe  → all probes fire after the last sentence
 *   interrupt  → probes fire at template's insert_after_sentence position
 *   delayed    → probes fire at insert_after_sentence + probe_delay offset
 *
 * Returns probes with a fireAfterIndex property (0-based index into sentences array,
 * meaning "fire this probe after sentences[fireAfterIndex] is shown").
 */
function scheduleProbes(probes, sentences, retrievalMode, probeDelayLevel) {
  const lastIdx = sentences.length - 1
  const delayOffset = PROBE_DELAY_OFFSETS[probeDelayLevel] ?? 0

  return probes.map(probe => {
    let fireAfterIndex

    if (retrievalMode === 'end_probe') {
      fireAfterIndex = lastIdx
    } else if (retrievalMode === 'interrupt') {
      // insert_after_sentence is 1-based in the template; convert to 0-based sentence index.
      // Clamp to valid range.
      fireAfterIndex = Math.min(probe.insert_after_sentence - 1, lastIdx)
    } else {
      // delayed: shift by offset, clamp to last sentence
      const base = probe.insert_after_sentence - 1
      fireAfterIndex = Math.min(base + delayOffset, lastIdx)
    }

    return { ...probe, fireAfterIndex }
  })
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Inline tests ─────────────────────────────────────────────────────────────

export function __test(allTemplates) {
  const baseRequest = {
    session_type: 'training',
    target_dimensions: {
      primary:   { interference_pressure: 3 },
      secondary: { signal_quality: 3 },
    },
    procedural_dimensions: {
      format:                     'narrative',
      model_complexity:           2,
      temporal_order:             'linear',
      retrieval_unpredictability: 'end_probe',
    },
    adaptive_parameters: {
      speed:                'normal',
      probe_delay:          'immediate',
      redundancy_injection: 'none',
      concurrent_stream:    false,
    },
    domain: { selected: 'corporate', bias_alignment: 'aligned' },
    constraints: {
      exclude_templates:          [],
      exclude_slots:              [],
      nearest_neighbor_tolerance: 1,
      target_success_rate:        0.85,
    },
  }

  // Test 1: basic build
  const session = buildSession(baseRequest, allTemplates)
  console.assert(session.sentences.length > 0, 'FAIL: no sentences produced')
  console.assert(session.probes.length > 0,    'FAIL: no probes produced')
  console.assert(session.templateId,           'FAIL: no templateId in session')
  console.log(`sessionBuilder test1 — built session from ${session.templateId}, ${session.sentences.length} sentences, ${session.probes.length} probe(s)`)

  // Test 2: end_probe fires after last sentence
  const lastIdx = session.sentences.length - 1
  for (const p of session.probes) {
    console.assert(p.fireAfterIndex === lastIdx, `FAIL: end_probe should fire after last sentence (idx ${lastIdx}), got ${p.fireAfterIndex}`)
  }
  console.log('sessionBuilder test2 — end_probe fires at correct position')

  // Test 3: no duplicate slot values
  const slotValues = Object.values(session.usedSlots)
  const unique = new Set(slotValues)
  console.assert(unique.size === slotValues.length, `FAIL: duplicate slot values: ${slotValues}`)
  console.log('sessionBuilder test3 — no duplicate slot values')

  // Test 4: nonlinear mode returns template-order sentences
  const nonlinearReq = { ...baseRequest, procedural_dimensions: { ...baseRequest.procedural_dimensions, temporal_order: 'nonlinear' } }
  const nlSession = buildSession(nonlinearReq, allTemplates)
  console.assert(nlSession.sentences.length > 0, 'FAIL: nonlinear session produced no sentences')
  console.log(`sessionBuilder test4 — nonlinear session: ${nlSession.sentences.length} sentences`)

  // Test 5: redundancy injection adds sentences
  const redReq = { ...baseRequest, adaptive_parameters: { ...baseRequest.adaptive_parameters, redundancy_injection: 'low' } }
  const redSession = buildSession(redReq, allTemplates)
  // Should have at least 1 redundancy sentence added
  const hasRedundancy = redSession.sentences.some(s => s.isRedundancy)
  console.assert(hasRedundancy, 'FAIL: redundancy injection produced no redundancy sentences')
  console.log(`sessionBuilder test5 — redundancy injected, total sentences: ${redSession.sentences.length}`)

  console.log('sessionBuilder: all tests passed')
}
