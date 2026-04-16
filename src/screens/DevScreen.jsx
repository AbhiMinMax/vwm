// DevScreen.jsx — component isolation testing for Steps 5 and 6.

import { useState } from 'react'
import StreamRenderer from '../components/stream/StreamRenderer'
import ProbeOverlay from '../components/probes/ProbeOverlay'

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_SENTENCES = [
  'Alderman had been managing the oversight since the restructuring.',
  'After the board meeting, the oversight was quietly reassigned to Reyes.',
  'Reyes met with Nakamura without mentioning the transition.',
  'Alderman sent the quarterly summary directly to Nakamura, unaware of the change.',
  'Nakamura responded to Reyes assuming Alderman had written it.',
]

const FILLED_SLOTS = { E1: 'Alderman', E2: 'Reyes', E3: 'Nakamura', O1: 'oversight' }

const PRESET_PROBES = {
  binding: {
    probe_id: 'DEV_MC',
    type: 'retrieval',
    subtype: 'binding',
    dimension_target: 'interference_pressure',
    question: 'Who does {E3} believe prepared the summary?',
    options: [
      { id: 'A', label: '{E1}',      is_correct: true,  failure_mode: null },
      { id: 'B', label: '{E2}',      is_correct: false, failure_mode: 'interference_failure' },
      { id: 'C', label: 'The board', is_correct: false, failure_mode: 'nesting_failure' },
      { id: 'D', label: 'Unknown',   is_correct: false, failure_mode: 'binding_failure' },
    ],
  },
  temporal_sequencing: {
    probe_id: 'DEV_SEQ',
    type: 'retrieval',
    subtype: 'temporal_sequencing',
    dimension_target: 'temporal_order',
    question: 'Order these events from earliest to most recent.',
    options: [
      { id: 'A', label: 'Alderman sent summary' },
      { id: 'B', label: 'Oversight reassigned' },
      { id: 'C', label: 'Reyes met Nakamura' },
      { id: 'D', label: 'Nakamura replied' },
      { id: 'E', label: 'Alderman managed oversight' },
    ],
    correct_sequence: ['E', 'B', 'C', 'A', 'D'],
  },
  contradiction: {
    probe_id: 'DEV_FLAG',
    type: 'vigilance',
    subtype: 'contradiction',
    dimension_target: 'signal_quality',
    question: 'One sentence contradicts an earlier statement. Which sentence number?',
    target_sentence_index: 3,
    correct_flag: 3,
    wrong_answer_types: {
      '0': 'false_positive',
      '1': 'false_positive',
      '2': 'false_positive',
      '4': 'wrong_location',
    },
  },
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function StreamTester() {
  const [running, setRunning]   = useState(false)
  const [speed, setSpeed]       = useState('normal')
  const [auto, setAuto]         = useState(true)
  const [log, setLog]           = useState([])

  const handleReveal = (idx, ts) => {
    setLog(prev => [...prev, `S${idx + 1} revealed at ${new Date(ts).toISOString().slice(11, 23)}`])
  }

  const handleComplete = () => {
    setLog(prev => [...prev, '✓ stream complete'])
    setTimeout(() => setRunning(false), 1200)
  }

  if (running) {
    return (
      <div>
        <StreamRenderer
          sentences={SAMPLE_SENTENCES}
          speed={speed}
          autoAdvance={auto}
          onSentenceReveal={handleReveal}
          onComplete={handleComplete}
        />
        <div style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['slow', 'normal', 'fast', 'pressure'].map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            style={{
              padding: '8px 14px',
              background: speed === s ? 'var(--color-accent)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              color: speed === s ? '#000' : 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} />
        auto-advance
      </label>
      <button
        onClick={() => { setLog([]); setRunning(true) }}
        style={{
          padding: '12px 20px',
          background: 'var(--color-accent)',
          border: 'none',
          borderRadius: 6,
          color: '#000',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        Run Stream
      </button>
    </div>
  )
}

function ProbeTester() {
  const [type, setType]       = useState('binding')
  const [active, setActive]   = useState(false)
  const [lastResult, setLast] = useState(null)

  const probe = PRESET_PROBES[type]

  const handleComplete = (result) => {
    setActive(false)
    setLast(result)
    console.log('[ProbeTester] result:', result)
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.keys(PRESET_PROBES).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              padding: '8px 14px',
              background: type === t ? 'var(--color-accent)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              color: type === t ? '#000' : 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <button
        onClick={() => setActive(true)}
        style={{
          padding: '12px 20px',
          background: 'var(--color-accent)',
          border: 'none',
          borderRadius: 6,
          color: '#000',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        Launch Probe
      </button>

      {lastResult && (
        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface)',
          padding: 12,
          borderRadius: 6,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
        }}>
          {JSON.stringify(lastResult, null, 2)}
        </pre>
      )}

      {active && (
        <ProbeOverlay
          probe={probe}
          sentences={SAMPLE_SENTENCES}
          filledSlots={FILLED_SLOTS}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}

// ─── Main DevScreen ───────────────────────────────────────────────────────────

const TABS = ['Stream Tester', 'Probe Tester']

export default function DevScreen() {
  const [tab, setTab] = useState('Stream Tester')

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: tab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Stream Tester' && <StreamTester />}
      {tab === 'Probe Tester'  && <ProbeTester />}
    </div>
  )
}
