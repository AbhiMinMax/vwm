export { buildSession, SPEED_MS }       from './sessionBuilder.js'
export { selectTemplate }                from './templateSelector.js'
export { fillSlots, applySlots }         from './slotFiller.js'
export {
  computeSessionScores,
  computeDeltas,
  updateUserProfile,
  checkConsolidationTriggers,
}                                        from './performanceTracker.js'
export {
  generateSessionRequest,
  determineSessionType,
  getWeakestDimension,
}                                        from './adaptiveEngine.js'
export { createDefaultUserProfile, DEFAULT_SETTINGS, ALL_DIMENSIONS, DIMENSION_LABELS } from './defaults.js'
