// HomeScreen.jsx — placeholder with storage test (Step 4).

import { useStorage } from '../hooks/useStorage'
import { createDefaultUserProfile, DEFAULT_SETTINGS } from '../engine/defaults'

export default function HomeScreen() {
  const [profile, setProfile] = useStorage('vwm_user_profile', createDefaultUserProfile())
  const [settings, setSettings] = useStorage('vwm_settings', DEFAULT_SETTINGS) // eslint-disable-line no-unused-vars

  return (
    <div style={{ padding: 20, fontFamily: 'var(--font-ui)' }}>
      <h2 style={{ color: 'var(--color-text-primary)' }}>Home</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Sessions completed: <strong style={{ color: 'var(--color-accent)' }}>{profile.sessionsCompleted}</strong>
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
        User ID: {profile.userId}
      </p>
      <button
        style={{
          marginTop: 16,
          padding: '12px 24px',
          background: 'var(--color-accent)',
          color: '#000',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
        }}
        onClick={() =>
          setProfile(p => ({ ...p, sessionsCompleted: p.sessionsCompleted + 1 }))
        }
      >
        + Increment sessions (storage test)
      </button>
    </div>
  )
}
