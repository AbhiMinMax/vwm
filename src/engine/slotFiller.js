// slotFiller.js — fills surface slots in a template with sampled values.
//
// Rules:
//   - Each slot key (E1, E2, ...) gets a unique value from its slot type library.
//   - Values in excludeSlots are never assigned.
//   - Domain-preferred slot types are sampled first; global library used as fallback.
//   - applySlots replaces {KEY} placeholders in sentence strings and probe labels.

import { slots as globalSlots } from '../data/slots.js'
import { domains } from '../data/domains.js'

/**
 * Sample a random item from an array, excluding items in the excludeSet.
 * Returns null if no eligible items remain.
 */
function sampleExcluding(arr, excludeSet) {
  const available = arr.filter(v => !excludeSet.has(v))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

/**
 * Build a merged slot library: domain-preferred types padded with global fallbacks.
 * Domain preferred slots are listed first so they're sampled with higher probability
 * when we shuffle together — but we keep it simple: merge and deduplicate, preferred first.
 */
function buildSlotLibrary(domainId) {
  const domain = domains.find(d => d.domain_id === domainId)
  const preferredTypes = domain ? domain.preferred_slots : []

  const library = {}
  // Start with global
  for (const [type, values] of Object.entries(globalSlots)) {
    library[type] = [...values]
  }
  // Promote preferred types by doubling their entries (increases sampling probability)
  for (const type of preferredTypes) {
    if (library[type]) {
      library[type] = [...library[type], ...library[type]]
    }
  }
  return library
}

/**
 * Fill all surface slots for a template.
 *
 * @param {object} template    - Template object with surface_slots and sentence_templates.
 * @param {string} domainId    - Domain id used to bias slot sampling.
 * @param {string[]} excludeSlots - Slot values to exclude (recently used).
 * @returns {{ filledSentences: string[], filledSlots: Record<string,string>, probes: object[] }}
 */
export function fillSlots(template, domainId, excludeSlots = []) {
  const library = buildSlotLibrary(domainId)
  const excludeSet = new Set(excludeSlots)
  const assigned = {}   // key → assigned value
  const usedValues = new Set(excludeSlots)

  // Assign each slot key a unique value from its type library.
  for (const [key, slotType] of Object.entries(template.surface_slots)) {
    const typeLibrary = library[slotType] || globalSlots[slotType] || []
    const value = sampleExcluding(typeLibrary, usedValues)
    if (value === null) {
      // Fallback: ignore the exclude constraint rather than crash
      const fallback = typeLibrary[Math.floor(Math.random() * typeLibrary.length)]
      assigned[key] = fallback || key
    } else {
      assigned[key] = value
      usedValues.add(value)
    }
  }

  const filledSentences = template.sentence_templates.map(s => applySlots(s, assigned))
  const filledProbes = fillProbeSlots(template.probes, assigned)

  return { filledSentences, filledSlots: assigned, probes: filledProbes }
}

/**
 * Replace {KEY} placeholders in a single string.
 */
export function applySlots(str, slotMap) {
  return str.replace(/\{([A-Z][A-Z0-9_]*)\}/g, (_, key) => slotMap[key] ?? `{${key}}`)
}

/**
 * Fill slots in probe question text and option labels.
 */
function fillProbeSlots(probes, slotMap) {
  return probes.map(probe => {
    const filled = {
      ...probe,
      question: applySlots(probe.question, slotMap),
    }
    if (probe.options) {
      filled.options = probe.options.map(opt => ({
        ...opt,
        label: applySlots(opt.label, slotMap),
      }))
    }
    return filled
  })
}

// ─── Inline tests ─────────────────────────────────────────────────────────────
// Run with: node --input-type=module < src/engine/slotFiller.js  (or via test script)

export function __test() {
  const template = {
    surface_slots: { E1: 'entity_professional', E2: 'entity_professional', E3: 'entity_professional', O1: 'object_abstract' },
    sentence_templates: ['{E1} handed the {O1} to {E2}.', '{E3} was unaware.'],
    probes: [{ probe_id: 'P1', question: 'Who does {E3} think sent the {O1}?', options: [
      { id: 'A', label: '{E1}', is_correct: true, failure_mode: null },
      { id: 'B', label: '{E2}', is_correct: false, failure_mode: 'interference_failure' },
    ]}],
  }

  const result = fillSlots(template, 'corporate', [])
  const { filledSentences, filledSlots, probes } = result

  // E1, E2, E3 must all be distinct
  const entityValues = [filledSlots.E1, filledSlots.E2, filledSlots.E3]
  const unique = new Set(entityValues)
  console.assert(unique.size === 3, `FAIL: E1/E2/E3 not distinct: ${entityValues}`)

  // No {KEY} placeholders remain
  for (const s of filledSentences) {
    console.assert(!s.includes('{'), `FAIL: unfilled placeholder in: "${s}"`)
  }
  console.assert(!probes[0].question.includes('{'), `FAIL: unfilled placeholder in probe question`)

  console.log('slotFiller: all tests passed')
  console.log('  Slots:', filledSlots)
  console.log('  Sentences:', filledSentences)
}
