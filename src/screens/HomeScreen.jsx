// HomeScreen.jsx — entry point. Shows session count and Start button.
// Full home screen polish in Step 8; this is the functional Step 7 version.

import { useNavigate } from 'react-router-dom'
import { useStorage }  from '../hooks/useStorage.js'
import { createDefaultUserProfile, DEFAULT_SETTINGS } from '../engine/defaults.js'
import styles from './HomeScreen.module.css'

export default function HomeScreen() {
  const navigate  = useNavigate()
  const [profile] = useStorage('vwm_user_profile', createDefaultUserProfile())
  const [settings] = useStorage('vwm_settings', DEFAULT_SETTINGS) // eslint-disable-line no-unused-vars

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <div className={styles.title}>VWM Trainer</div>
        <div className={styles.sessionCount}>
          Session {profile.sessionsCompleted + 1}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.startBtn}
          onClick={() => navigate('/session')}
        >
          Start Session
        </button>
        <button
          className={styles.settingsBtn}
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>
        {settings.devMode && (
          <button
            className={styles.devBtn}
            onClick={() => navigate('/dev')}
          >
            Dev
          </button>
        )}
      </div>
    </div>
  )
}
