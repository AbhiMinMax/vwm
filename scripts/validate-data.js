// Data validation script — run with: node scripts/validate-data.js
// Checks all templates satisfy structural invariants before the engine uses them.

import { templates } from '../src/data/templates.js'
import { slots } from '../src/data/slots.js'

let errors = 0

function fail(msg) {
  console.error('FAIL:', msg)
  errors++
}

const validSlotTypes = new Set(Object.keys(slots))

for (const t of templates) {
  const tid = t.template_id

  // Required top-level fields
  if (!t.template_id)       fail(`${tid}: missing template_id`)
  if (!t.deep_structure)    fail(`${tid}: missing deep_structure`)
  if (!t.dimension_values)  fail(`${tid}: missing dimension_values`)
  if (!t.surface_slots)     fail(`${tid}: missing surface_slots`)
  if (!t.sentence_templates || t.sentence_templates.length === 0) fail(`${tid}: no sentence_templates`)
  if (!t.probes || t.probes.length === 0) fail(`${tid}: no probes`)
  if (!t.chronological_order) fail(`${tid}: missing chronological_order`)

  // chronological_order length matches sentence count
  if (t.chronological_order && t.chronological_order.length !== t.sentence_templates.length) {
    fail(`${tid}: chronological_order length (${t.chronological_order.length}) !== sentence count (${t.sentence_templates.length})`)
  }

  // chronological_order is a valid permutation
  if (t.chronological_order) {
    const sorted = [...t.chronological_order].sort((a, b) => a - b)
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] !== i) { fail(`${tid}: chronological_order is not a valid permutation`); break }
    }
  }

  // All surface_slots reference valid slot types
  for (const [slotKey, slotType] of Object.entries(t.surface_slots)) {
    if (!validSlotTypes.has(slotType)) {
      fail(`${tid}: slot ${slotKey} references unknown slot type "${slotType}"`)
    }
  }

  // All slot placeholders in sentence_templates have a corresponding surface_slots entry
  const slotPattern = /\{([A-Z][A-Z0-9_]*)\}/g
  for (const sentence of t.sentence_templates) {
    let match
    while ((match = slotPattern.exec(sentence)) !== null) {
      const key = match[1]
      if (!t.surface_slots[key]) {
        fail(`${tid}: sentence references undefined slot {${key}}: "${sentence}"`)
      }
    }
  }

  // Probe validation
  for (const p of t.probes) {
    const pid = `${tid}/${p.probe_id}`

    if (!p.probe_id)         fail(`${pid}: missing probe_id`)
    if (!p.type)             fail(`${pid}: missing type`)
    if (!p.subtype)          fail(`${pid}: missing subtype`)
    if (!p.dimension_target) fail(`${pid}: missing dimension_target`)
    if (p.insert_after_sentence == null) fail(`${pid}: missing insert_after_sentence`)

    if (p.type === 'retrieval' && (p.subtype === 'binding' || p.subtype === 'belief_state')) {
      if (!p.options || p.options.length === 0) fail(`${pid}: missing options`)
      const correctOptions = p.options.filter(o => o.is_correct)
      if (correctOptions.length !== 1) fail(`${pid}: must have exactly 1 correct option, found ${correctOptions.length}`)
      for (const o of p.options) {
        if (!o.is_correct && !o.failure_mode) fail(`${pid}: option ${o.id} is incorrect but has no failure_mode`)
        if (o.is_correct && o.failure_mode !== null && o.failure_mode !== undefined) {
          fail(`${pid}: correct option ${o.id} should have failure_mode null`)
        }
      }
    }

    if (p.subtype === 'temporal_sequencing') {
      if (!p.options || p.options.length === 0) fail(`${pid}: temporal_sequencing missing options`)
      if (!p.correct_sequence) fail(`${pid}: temporal_sequencing missing correct_sequence`)
      if (p.correct_sequence && p.options && p.correct_sequence.length !== p.options.length) {
        fail(`${pid}: correct_sequence length (${p.correct_sequence.length}) !== options length (${p.options.length})`)
      }
      if (p.correct_sequence && p.options) {
        const optionIds = new Set(p.options.map(o => o.id))
        for (const id of p.correct_sequence) {
          if (!optionIds.has(id)) fail(`${pid}: correct_sequence references unknown option id "${id}"`)
        }
      }
    }

    if (p.type === 'vigilance') {
      if (p.target_sentence_index == null) fail(`${pid}: vigilance probe missing target_sentence_index`)
      if (p.correct_flag == null)          fail(`${pid}: vigilance probe missing correct_flag`)
      if (!p.wrong_answer_types)           fail(`${pid}: vigilance probe missing wrong_answer_types`)
      if (p.target_sentence_index != null && t.sentence_templates) {
        if (p.target_sentence_index >= t.sentence_templates.length) {
          fail(`${pid}: target_sentence_index (${p.target_sentence_index}) out of range`)
        }
      }
    }
  }
}

console.log(`\nValidated ${templates.length} templates.`)
if (errors === 0) {
  console.log('All checks passed.')
} else {
  console.error(`${errors} error(s) found.`)
  process.exit(1)
}
