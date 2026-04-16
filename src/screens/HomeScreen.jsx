// HomeScreen.jsx — minimal launch screen.

import { useNavigate } from 'react-router-dom'
import { useStorage }  from '../hooks/useStorage.js'
import { createDefaultUserProfile, DEFAULT_SETTINGS } from '../engine/defaults.js'
import styles          from './HomeScreen.module.css'

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function HomeScreen() {
  const navigate   = useNavigate()
  const [profile]  = useStorage('vwm_user_profile', createDefaultUserProfile())
  const [settings] = useStorage('vwm_settings', DEFAULT_SETTINGS)
  const [history]  = useStorage('vwm_session_history', [])

  const sessionNumber = profile.sessionsCompleted + 1
  const lastSession   = history.length > 0 ? history[history.length - 1] : null

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <div className={styles.appName}>VWM Trainer</div>
        <div className={styles.sessionCount}>Session {sessionNumber}</div>
        {lastSession && (
          <div className={styles.lastScore}>
            Last: {Math.round((lastSession.successRate ?? 0) * 100)}%
            {' · '}{formatDate(lastSession.ts)}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.startBtn} onClick={() => navigate('/session')}>
          Start Session
        </button>
        <div className={styles.navRow}>
          <button className={styles.navBtn} onClick={() => navigate('/settings')}>
            Settings
          </button>
          {settings.devMode && (
            <button className={styles.navBtn} onClick={() => navigate('/dev')}>
              Dev
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
