// SettingsScreen.jsx — all training parameters, domain toggles, difficulty override,
// data management, and dev mode.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStorage }  from '../hooks/useStorage.js'
import { createDefaultUserProfile, DEFAULT_SETTINGS, DIMENSION_LABELS } from '../engine/defaults.js'
import { domains }     from '../data/domains.js'
import styles          from './SettingsScreen.module.css'

// ─── Tiny re-usable controls ─────────────────────────────────────────────────

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className={styles.segmented}>
      {options.map(o => (
        <button
          key={o.value}
          className={`${styles.segBtn} ${value === o.value ? styles.segActive : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className={styles.toggleKnob} />
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, control }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      {control}
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigate = useNavigate()
  const [settings, setSettings] = useStorage('vwm_settings', DEFAULT_SETTINGS)
  const [profile, setProfile]   = useStorage('vwm_user_profile', createDefaultUserProfile())
  const [history, setHistory]   = useStorage('vwm_session_history', [])
  const [resetStep, setResetStep] = useState(0) // 0=idle, 1=confirm

  function set(key, val) {
    setSettings(s => ({ ...s, [key]: val }))
  }

  function setDim(key, val) {
    setSettings(s => ({
      ...s,
      manualDimensions: { ...s.manualDimensions, [key]: val },
    }))
  }

  function toggleDomain(id) {
    const current = settings.preferredDomains?.length > 0
      ? settings.preferredDomains
      : domains.map(d => d.domain_id)

    const next = current.includes(id)
      ? current.filter(d => d !== id)
      : [...current, id]

    // Enforce: at least 1 domain must remain enabled
    if (next.length === 0) return
    // If all domains are enabled, store empty array (means "all")
    const allIds = domains.map(d => d.domain_id)
    const isAll  = allIds.every(d => next.includes(d))
    set('preferredDomains', isAll ? [] : next)
  }

  function isDomainEnabled(id) {
    if (!settings.preferredDomains || settings.preferredDomains.length === 0) return true
    return settings.preferredDomains.includes(id)
  }

  function enabledCount() {
    if (!settings.preferredDomains || settings.preferredDomains.length === 0) return domains.length
    return settings.preferredDomains.length
  }

  function handleReset() {
    if (resetStep === 0) { setResetStep(1); return }
    setProfile(createDefaultUserProfile())
    setHistory([])
    setResetStep(0)
  }

  const SPEED_OPTIONS = [
    { label: 'Slow',     value: 'slow' },
    { label: 'Normal',   value: 'normal' },
    { label: 'Fast',     value: 'fast' },
    { label: 'Pressure', value: 'pressure' },
  ]
  const LENGTH_OPTIONS = [
    { label: '4',  value: 4 },
    { label: '8',  value: 8 },
    { label: '12', value: 12 },
    { label: '16', value: 16 },
  ]
  const DELAY_OPTIONS = [
    { label: 'None', value: 'immediate' },
    { label: 'Short', value: 'short' },
    { label: 'Med',  value: 'medium' },
    { label: 'Long', value: 'long' },
  ]
  const DIMS_WITH_LABELS = Object.entries(DIMENSION_LABELS)

  return (
    <div className={styles.screen}>
      {/* Nav back */}
      <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
      <div className={styles.heading}>Settings</div>

      {/* Session parameters */}
      <Section title="Session parameters">
        <Row label="Speed" control={
          <SegmentedControl options={SPEED_OPTIONS} value={settings.speed} onChange={v => set('speed', v)} />
        } />
        <Row label="Session length" control={
          <SegmentedControl
            options={LENGTH_OPTIONS}
            value={settings.sessionLength}
            onChange={v => set('sessionLength', v)}
          />
        } />
        <Row label="Probe delay" control={
          <SegmentedControl options={DELAY_OPTIONS} value={settings.probeDelay} onChange={v => set('probeDelay', v)} />
        } />
        <Row label="Auto-advance" control={
          <Toggle checked={settings.autoAdvance} onChange={v => set('autoAdvance', v)} />
        } />
        <Row label="Concurrent stream" control={
          <Toggle checked={settings.concurrentStream} onChange={v => set('concurrentStream', v)} />
        } />
      </Section>

      {/* Domain preferences */}
      <Section title="Domain preferences">
        <div className={styles.domainGrid}>
          {domains.map(d => {
            const enabled = isDomainEnabled(d.domain_id)
            const isLast  = enabledCount() === 1 && enabled
            return (
              <button
                key={d.domain_id}
                className={`${styles.domainBtn} ${enabled ? styles.domainOn : ''}`}
                onClick={() => !isLast && toggleDomain(d.domain_id)}
                disabled={isLast}
                title={isLast ? 'At least one domain must be enabled' : undefined}
              >
                {d.domain_id}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Difficulty override */}
      <Section title="Difficulty override">
        <Row label="Manual override" control={
          <Toggle checked={settings.manualOverride} onChange={v => set('manualOverride', v)} />
        } />
        {settings.manualOverride && (
          <>
            <p className={styles.overrideWarning}>Disables adaptive engine</p>
            {DIMS_WITH_LABELS.map(([key, label]) => (
              <div key={key} className={styles.sliderRow}>
                <span className={styles.sliderLabel}>{label}</span>
                <input
                  type="range"
                  min={1} max={5} step={1}
                  value={settings.manualDimensions?.[key] ?? 3}
                  onChange={e => setDim(key, Number(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderVal}>
                  {settings.manualDimensions?.[key] ?? 3}
                </span>
              </div>
            ))}
          </>
        )}
      </Section>

      {/* Data */}
      <Section title="Data">
        <div className={styles.historyList}>
          <div className={styles.subLabel}>Session history ({history.length})</div>
          {history.slice(-10).reverse().map(s => (
            <div key={s.sessionId} className={styles.historyRow}>
              <span className={styles.histNum}>#{s.sessionNumber}</span>
              <span className={styles.histType}>{s.sessionType}</span>
              <span className={styles.histScore}>
                {Math.round((s.successRate ?? 0) * 100)}%
              </span>
              <span className={styles.histDate}>
                {new Date(s.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
          {history.length === 0 && (
            <p className={styles.empty}>No sessions yet.</p>
          )}
        </div>

        <div className={styles.resetArea}>
          {resetStep === 0 ? (
            <button className={styles.resetBtn} onClick={handleReset}>
              Reset all progress
            </button>
          ) : (
            <div className={styles.resetConfirm}>
              <span className={styles.resetWarning}>This clears all session data.</span>
              <button className={styles.resetConfirmBtn} onClick={handleReset}>
                Yes, reset
              </button>
              <button className={styles.resetCancelBtn} onClick={() => setResetStep(0)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Dev mode */}
      <Section title="Developer">
        <Row label="Dev mode" control={
          <Toggle checked={settings.devMode} onChange={v => set('devMode', v)} />
        } />
      </Section>

      <div style={{ height: 40 }} />
    </div>
  )
}
