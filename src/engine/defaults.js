// defaults.js — default user profile and settings for first-time users.

function generateId() {
  return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function createDefaultUserProfile() {
  return {
    userId: generateId(),
    createdAt: new Date().toISOString(),
    sessionsCompleted: 0,
    dimensionBaselines: {
      interference_pressure: 0.5,
      signal_quality:        0.5,
      nesting_depth:         0.5,
      discourse_structure:   0.5,
      temporal_order:        0.5,
    },
    dimensionRollingAvg: {
      interference_pressure: [],
      signal_quality:        [],
      nesting_depth:         [],
      discourse_structure:   [],
      temporal_order:        [],
    },
    templateExposure:   [],
    recentSlots:        [],
    lastSessionType:    null,
    consolidationFlags: [],
  }
}

export const DEFAULT_SETTINGS = {
  speed:                'normal',
  probeDelay:           'medium',
  redundancyInjection:  'none',
  concurrentStream:     false,
  preferredDomains:     [],        // empty = all domains enabled
  sessionLength:        8,
  autoAdvance:          true,
  devMode:              false,
  manualOverride:       false,
  manualDimensions: {
    interference_pressure: 3,
    signal_quality:        3,
    nesting_depth:         1,
    discourse_structure:   2,
    temporal_order:        3,
  },
}

export const ALL_DIMENSIONS = [
  'interference_pressure',
  'signal_quality',
  'nesting_depth',
  'discourse_structure',
  'temporal_order',
]

export const DIMENSION_LABELS = {
  interference_pressure: 'Interference Pressure',
  signal_quality:        'Signal Quality',
  nesting_depth:         'Nesting Depth',
  discourse_structure:   'Discourse Structure',
  temporal_order:        'Temporal Order',
}
