// HomeScreen.jsx — entry point with session history and dimension averages.

import { useNavigate } from 'react-router-dom'
import { useStorage }  from '../hooks/useStorage.js'
import { createDefaultUserProfile, DEFAULT_SETTINGS, ALL_DIMENSIONS } from '../engine/defaults.js'
import DimensionBar    from '../components/ui/DimensionBar.jsx'
import styles          from './HomeScreen.module.css'

function mean(arr) {
  if (!arr || arr.length === 0) return null
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function HomeScreen() {
  const navigate   = useNavigate()
  const [profile]  = useStorage('vwm_user_profile', createDefaultUserProfile())
  const [settings] = useStorage('vwm_settings', DEFAULT_SETTINGS)
  const [history]  = useStorage('vwm_session_history', [])

  // Dimensions that have at least one rolling avg data point
  const activeDims = ALL_DIMENSIONS.filter(d =>
    profile.dimensionRollingAvg?.[d]?.length > 0
  )

  const recentSessions = history.slice(-3).reverse()

  return (
    <div className={styles.screen}>
      {/* Top: title + session number */}
      <div className={styles.top}>
        <div className={styles.appName}>VWM Trainer</div>
        <div className={styles.sessionCount}>
          Session {profile.sessionsCompleted + 1}
        </div>
      </div>

      {/* Dimension bars (only after first session) */}
      {activeDims.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Rolling averages</div>
          <div className={styles.dimList}>
            {activeDims.map(d => (
              <DimensionBar
                key={d}
                dimensionName={d}
                score={mean(profile.dimensionRollingAvg[d])}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions (only after first session) */}
      {recentSessions.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Recent sessions</div>
          <div className={styles.historyList}>
            {recentSessions.map((s) => (
              <div key={s.sessionId} className={styles.historyRow}>
                <span className={styles.historyNum}>#{s.sessionNumber}</span>
                <span className={styles.historyType}>{s.sessionType}</span>
                <span className={styles.historyDomain}>{s.domain}</span>
                <span className={styles.historyScore}>
                  {Math.round((s.successRate ?? 0) * 100)}%
                </span>
                <span className={styles.historyDate}>{formatDate(s.ts)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
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
