// useAdaptive.js — thin wrapper around adaptiveEngine + performanceTracker.
// Reads and writes user profile and settings from localStorage.

import { useCallback } from 'react'
import { useStorage } from './useStorage.js'
import { generateSessionRequest }  from '../engine/adaptiveEngine.js'
import { updateUserProfile, computeDeltas } from '../engine/performanceTracker.js'
import { createDefaultUserProfile, DEFAULT_SETTINGS } from '../engine/defaults.js'

/**
 * useAdaptive() → { profile, settings, generateRequest, recordResult }
 *
 * generateRequest() — returns a session request object based on current profile and settings.
 * recordResult(partialResult) — updates and persists the user profile; returns { updatedProfile, deltas }.
 *   partialResult must include: sessionId, sessionType, templateId, usedSlots,
 *                               dimensionScores, probeResults, successRate.
 */
export function useAdaptive() {
  const [profile, setProfile] = useStorage('vwm_user_profile', createDefaultUserProfile())
  const [settings]            = useStorage('vwm_settings', DEFAULT_SETTINGS)

  const generateRequest = useCallback(() => {
    return generateSessionRequest(profile, settings)
  }, [profile, settings])

  const recordResult = useCallback((partialResult) => {
    const deltas = computeDeltas(
      partialResult.dimensionScores,
      profile.dimensionRollingAvg
    )
    const sessionResult = { ...partialResult, deltas }
    const updatedProfile = updateUserProfile(profile, sessionResult)
    setProfile(updatedProfile)
    return { updatedProfile, deltas }
  }, [profile, setProfile])

  return { profile, settings, generateRequest, recordResult }
}
