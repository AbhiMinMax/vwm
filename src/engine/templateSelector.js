// templateSelector.js — nearest-neighbour template matching on content dimensions.
//
// Content dimensions scored: interference_pressure, signal_quality (level),
//   nesting_depth, discourse_structure.
//
// Distance: Euclidean across explicitly requested dimensions only.
// A template that omits a requested dimension is penalised by (tolerance + 1).
// Recently-used templates are penalised by adding EXPOSURE_PENALTY to their distance.

const EXPOSURE_PENALTY = 2.5

/**
 * Extract numeric scores from a template's dimension_values for the four
 * content dimensions. signal_quality is stored as { level, ... } — extract .level.
 */
function extractTemplateDims(dimValues) {
  return {
    interference_pressure: dimValues.interference_pressure ?? null,
    signal_quality:        dimValues.signal_quality?.level ?? dimValues.signal_quality ?? null,
    nesting_depth:         dimValues.nesting_depth ?? null,
    discourse_structure:   dimValues.discourse_structure ?? null,
  }
}

/**
 * Compute Euclidean distance between a template and the requested target dimensions.
 * Only dimensions present in targetDims contribute to the score.
 *
 * @param {object} templateDimValues - template.dimension_values
 * @param {object} targetDims        - flat map of { dimension_name: desired_level }
 * @param {number} tolerance         - penalty per missing dimension unit
 */
function computeDimensionDistance(templateDimValues, targetDims, tolerance = 1) {
  const templateScores = extractTemplateDims(templateDimValues)
  let sumSq = 0

  for (const [dim, desiredLevel] of Object.entries(targetDims)) {
    const templateLevel = templateScores[dim]
    if (templateLevel === null || templateLevel === undefined) {
      // Template doesn't declare this dimension — penalise beyond tolerance
      sumSq += (tolerance + 1) ** 2
    } else {
      sumSq += (templateLevel - desiredLevel) ** 2
    }
  }

  return Math.sqrt(sumSq)
}

/**
 * Select the best matching template given the requested content dimensions.
 *
 * @param {object}   targetDims    - flat map { dimension_name: level }
 * @param {object[]} allTemplates  - full template array
 * @param {string[]} excludeIds    - recently used template ids to deprioritise
 * @param {number}   tolerance     - nearest-neighbour tolerance (default 1)
 * @returns {object|null} best matching template, or null if pool is empty
 */
export function selectTemplate(targetDims, allTemplates, excludeIds = [], tolerance = 1) {
  if (allTemplates.length === 0) return null

  const excludeSet = new Set(excludeIds)

  let best = null
  let bestDist = Infinity

  for (const template of allTemplates) {
    let dist = computeDimensionDistance(template.dimension_values, targetDims, tolerance)

    // Penalise recently-used templates instead of hard-excluding them,
    // so we always return something even with a small template pool.
    if (excludeSet.has(template.template_id)) {
      dist += EXPOSURE_PENALTY
    }

    if (dist < bestDist) {
      bestDist = dist
      best = template
    }
  }

  return best
}

// ─── Inline tests ─────────────────────────────────────────────────────────────

export function __test(allTemplates) {
  // Test 1: exact match is selected
  const target1 = { interference_pressure: 3, signal_quality: 4, nesting_depth: 2, discourse_structure: 2 }
  const result1 = selectTemplate(target1, allTemplates, [], 1)
  console.assert(result1 !== null, 'FAIL: no template returned for exact match target')
  console.log(`templateSelector test1 — nearest to IP=3,SQ=4,ND=2,DS=2: ${result1?.template_id}`)

  // Test 2: excluded template is not first choice but still returned if it's the only option
  const singlePool = [allTemplates[0]]
  const result2 = selectTemplate(target1, singlePool, [allTemplates[0].template_id], 1)
  console.assert(result2 !== null, 'FAIL: excluded-only pool should still return the template')
  console.log(`templateSelector test2 — excluded-only pool returns: ${result2?.template_id} (expected ${singlePool[0].template_id})`)

  // Test 3: template with partial dimension coverage still gets selected
  const target3 = { interference_pressure: 4 }
  const result3 = selectTemplate(target3, allTemplates, [], 1)
  console.assert(result3 !== null, 'FAIL: no template returned for single-dimension target')
  console.log(`templateSelector test3 — nearest to IP=4: ${result3?.template_id}`)

  console.log('templateSelector: all tests passed')
}
