// DevScreen.jsx — isolation testing for all components and engine inspection.
// Only accessible when devMode is enabled in Settings.

import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStorage }    from '../hooks/useStorage.js'
import { createDefaultUserProfile, DEFAULT_SETTINGS, ALL_DIMENSIONS, DIMENSION_LABELS } from '../engine/defaults.js'
import { generateSessionRequest } from '../engine/adaptiveEngine.js'
import { buildSession }           from '../engine/sessionBuilder.js'
import { templates }              from '../data/templates.js'
import { domains }                from '../data/domains.js'
import StreamRenderer             from '../components/stream/StreamRenderer.jsx'
import ProbeOverlay               from '../components/probes/ProbeOverlay.jsx'
import InfoTip                    from '../components/ui/InfoTip.jsx'
import styles                     from './DevScreen.module.css'

// ─── Shared data for testers ──────────────────────────────────────────────────

const SAMPLE_FILLED_SLOTS = { E1: 'Alderman', E2: 'Reyes', E3: 'Nakamura', O1: 'oversight' }

const PRESET_PROBES = {
  binding: {
    probe_id: 'DEV_MC',
    type: 'retrieval',
    subtype: 'binding',
    dimension_target: 'interference_pressure',
    question: 'Who does {E3} believe prepared the summary?',
    options: [
      { id: 'A', label: '{E1}',      is_correct: true,  failure_mode: null },
      { id: 'B', label: '{E2}',      is_correct: false, failure_mode: 'interference_confusion' },
      { id: 'C', label: 'The board', is_correct: false, failure_mode: 'nesting_failure' },
      { id: 'D', label: 'Unknown',   is_correct: false, failure_mode: 'recency_bias' },
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
    question: 'One sentence contradicts an earlier statement. Which sentence?',
    target_sentence_index: 3,
    correct_flag: 3,
    wrong_answer_types: {
      '0': 'false_positive', '1': 'false_positive',
      '2': 'false_positive', '4': 'wrong_location',
    },
  },
}

// ─── Stream Tester ────────────────────────────────────────────────────────────

function StreamTester() {
  const [templateIdx, setTemplateIdx] = useState(0)
  const [speed, setSpeed]             = useState('normal')
  const [autoAdv, setAutoAdv]         = useState(true)
  const [running, setRunning]         = useState(false)
  const [log, setLog]                 = useState([])

  const tmpl     = templates[templateIdx]
  const sentences = tmpl ? tmpl.sentence_templates : []

  const handleReveal = (idx, ts) => {
    setLog(prev => [...prev, `${idx + 1}. revealed @ ${new Date(ts).toISOString().slice(11, 23)}`])
  }

  const handleComplete = () => {
    setLog(prev => [...prev, '✓ complete'])
    setTimeout(() => setRunning(false), 800)
  }

  if (running) {
    return (
      <div>
        <StreamRenderer
          sentences={sentences}
          speed={speed}
          autoAdvance={autoAdv}
          onSentenceReveal={handleReveal}
          onComplete={handleComplete}
        />
        <div className={styles.logBox}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Template <InfoTip text="Which template to stream. Each has a fixed sentence pattern, slot types, and probe." />
        </label>
        <select
          className={styles.select}
          value={templateIdx}
          onChange={e => setTemplateIdx(Number(e.target.value))}
        >
          {templates.map((t, i) => (
            <option key={t.template_id} value={i}>{t.template_id} — {t.deep_structure.pattern}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Speed <InfoTip text="Sentence display speed. Pressure enforces a strict per-sentence time limit." />
        </label>
        <div className={styles.chips}>
          {['slow','normal','fast','pressure'].map(s => (
            <button
              key={s}
              className={`${styles.chip} ${speed === s ? styles.chipActive : ''}`}
              onClick={() => setSpeed(s)}
            >{s}</button>
          ))}
        </div>
      </div>

      <label className={styles.checkRow}>
        <input type="checkbox" checked={autoAdv} onChange={e => setAutoAdv(e.target.checked)} />
        Auto-advance
        <InfoTip text="Sentences advance automatically. Uncheck to tap through each sentence manually." />
      </label>

      <button className={styles.runBtn} onClick={() => { setLog([]); setRunning(true) }}>
        Run Stream
      </button>
    </div>
  )
}

// ─── Probe Tester ─────────────────────────────────────────────────────────────

const SAMPLE_SENTENCES = [
  'Alderman had been managing the oversight since the restructuring.',
  'After the board meeting, the oversight was quietly reassigned to Reyes.',
  'Reyes met with Nakamura without mentioning the transition.',
  'Alderman sent the quarterly summary directly to Nakamura, unaware of the change.',
  'Nakamura responded to Reyes assuming Alderman had written it.',
]

function ProbeTester() {
  const [type, setType]     = useState('binding')
  const [active, setActive] = useState(false)
  const [result, setResult] = useState(null)

  const handleComplete = (r) => {
    setActive(false)
    setResult(r)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Probe type <InfoTip text="binding: multiple choice about entity/object relationships. temporal_sequencing: order events chronologically. contradiction: flag the sentence that contradicts an earlier one." />
        </label>
        <div className={styles.chips}>
          {Object.keys(PRESET_PROBES).map(t => (
            <button
              key={t}
              className={`${styles.chip} ${type === t ? styles.chipActive : ''}`}
              onClick={() => setType(t)}
            >{t}</button>
          ))}
        </div>
      </div>

      <button className={styles.runBtn} onClick={() => { setResult(null); setActive(true) }}>
        Launch Probe
      </button>

      {result && (
        <pre className={styles.resultBox}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {active && (
        <ProbeOverlay
          probe={PRESET_PROBES[type]}
          sentences={SAMPLE_SENTENCES}
          filledSlots={SAMPLE_FILLED_SLOTS}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}

// ─── Template Browser ─────────────────────────────────────────────────────────

function TemplateBrowser() {
  const [expanded, setExpanded] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [runActive, setRunActive] = useState(false)
  const [activeProbe, setActiveProbe] = useState(null)
  const [runSentences, setRunSentences] = useState([])
  const [runSlots, setRunSlots] = useState({})

  const handleRunTemplate = useCallback((tmpl) => {
    try {
      const session = buildSession({
        session_id: 'DEV', session_type: 'training',
        target_dimensions: { primary: { interference_pressure: 3 }, secondary: {} },
        procedural_dimensions: { format: 'narrative', model_complexity: 2, temporal_order: 'nonlinear', retrieval_unpredictability: 'end_probe' },
        adaptive_parameters: { speed: 'normal', probe_delay: 'immediate', redundancy_injection: 'none', concurrent_stream: false },
        domain: { selected: domains[0].domain_id, bias_alignment: 'neutral' },
        constraints: { exclude_templates: templates.filter(t => t.template_id !== tmpl.template_id).map(t => t.template_id), exclude_slots: [], nearest_neighbor_tolerance: 5, target_success_rate: 0.85 },
      }, templates)

      if (session.probes.length > 0) {
        setActiveProbe(session.probes[0])
        setRunSentences(session.sentences.map(s => s.text))
        setRunSlots(session.usedSlots)
        setRunActive(true)
      }
    } catch (err) {
      console.error('[TemplateBrowser] run error:', err)
      setRunResult({ error: err.message })
    }
  }, [])

  return (
    <div className={styles.panel}>
      {templates.map(t => (
        <div key={t.template_id} className={styles.tmplItem}>
          <button
            className={styles.tmplHeader}
            onClick={() => setExpanded(e => e === t.template_id ? null : t.template_id)}
          >
            <span className={styles.tmplId}>{t.template_id}</span>
            <span className={styles.tmplPattern}>{t.deep_structure.pattern}</span>
            <div className={styles.tmplDims}>
              {Object.entries(t.dimension_values ?? {}).map(([k, v]) => (
                <span key={k} className={styles.dimPill}>
                  {k.slice(0,3)}:{typeof v === 'object' ? v.level : v}
                </span>
              ))}
            </div>
          </button>

          {expanded === t.template_id && (
            <div className={styles.tmplBody}>
              <div className={styles.tmplDesc}>{t.deep_structure.description}</div>
              <div className={styles.tmplSentences}>
                {t.sentence_templates.map((s, i) => (
                  <div key={i} className={styles.tmplSentence}>
                    <span className={styles.tmplNum}>{i+1}</span>{s}
                  </div>
                ))}
              </div>
              <button className={styles.runSmallBtn} onClick={() => handleRunTemplate(t)}>
                Run this template
              </button>
            </div>
          )}
        </div>
      ))}

      {runResult && (
        <pre className={styles.resultBox}>{JSON.stringify(runResult, null, 2)}</pre>
      )}

      {runActive && activeProbe && (
        <ProbeOverlay
          probe={activeProbe}
          sentences={runSentences}
          filledSlots={runSlots}
          onComplete={(r) => { setRunActive(false); setRunResult(r) }}
        />
      )}
    </div>
  )
}

// ─── Adaptive Inspector ───────────────────────────────────────────────────────

function AdaptiveInspector() {
  const [profile]  = useStorage('vwm_user_profile', createDefaultUserProfile())
  const [settings] = useStorage('vwm_settings', DEFAULT_SETTINGS)
  const [nextReq, setNextReq] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)

  // Manual request builder state
  const [manualDims, setManualDims] = useState(
    Object.fromEntries(ALL_DIMENSIONS.map(d => [d, 3]))
  )

  const handleGenerate = () => {
    try {
      setNextReq(generateSessionRequest(profile, settings))
    } catch (err) {
      console.error('[AdaptiveInspector]', err)
      setNextReq({ error: err.message })
    }
  }

  return (
    <div className={styles.panel}>
      <button className={styles.runBtn} onClick={handleGenerate}>
        What would next session be?
      </button>

      {nextReq && (
        <pre className={styles.resultBox}>{JSON.stringify(nextReq, null, 2)}</pre>
      )}

      <button
        className={styles.chip}
        style={{ marginTop: 12 }}
        onClick={() => setProfileOpen(o => !o)}
      >
        {profileOpen ? 'Hide' : 'Show'} profile
      </button>

      {profileOpen && (
        <pre className={styles.resultBox}>{JSON.stringify(profile, null, 2)}</pre>
      )}

      <div className={styles.fieldLabel} style={{ marginTop: 16 }}>Manual dimensions</div>
      {ALL_DIMENSIONS.map(d => (
        <div key={d} className={styles.sliderRow}>
          <span className={styles.sliderLabel}>{DIMENSION_LABELS[d]}</span>
          <input
            type="range" min={1} max={5} step={1}
            value={manualDims[d]}
            onChange={e => setManualDims(m => ({ ...m, [d]: Number(e.target.value) }))}
            className={styles.slider}
          />
          <span className={styles.sliderVal}>{manualDims[d]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Dimension Stress Test ────────────────────────────────────────────────────

function StressTest() {
  const [dim, setDim]     = useState(ALL_DIMENSIONS[0])
  const [level, setLevel] = useState(3)
  const [results, setResults] = useState([])
  const [active, setActive]   = useState(false)
  const [currentProbe, setCurrentProbe] = useState(null)
  const [probeSentences, setProbeSentences] = useState([])
  const [probeSlots, setProbeSlots] = useState({})
  const [runCount, setRunCount] = useState(0)
  // Stable refs so callbacks always see latest dim/level/runCount
  const dimRef      = useRef(dim)
  const levelRef    = useRef(level)
  const runCountRef = useRef(runCount)
  dimRef.current      = dim
  levelRef.current    = level
  runCountRef.current = runCount

  const buildAndShowProbe = useCallback((count) => {
    try {
      const req = {
        session_id: `STRESS_${count}`, session_type: 'training',
        target_dimensions: { primary: { [dimRef.current]: levelRef.current }, secondary: {} },
        procedural_dimensions: { format: 'narrative', model_complexity: 2, temporal_order: 'nonlinear', retrieval_unpredictability: 'end_probe' },
        adaptive_parameters: { speed: 'normal', probe_delay: 'immediate', redundancy_injection: 'none', concurrent_stream: false },
        domain: { selected: domains[count % domains.length].domain_id, bias_alignment: 'neutral' },
        constraints: { exclude_templates: [], exclude_slots: [], nearest_neighbor_tolerance: 5, target_success_rate: 0.85 },
      }
      const session = buildSession(req, templates)
      if (session.probes.length > 0) {
        setCurrentProbe(session.probes[0])
        setProbeSentences(session.sentences.map(s => s.text))
        setProbeSlots(session.usedSlots)
      }
    } catch (err) {
      console.error('[StressTest]', err)
      setActive(false)
    }
  }, [])

  // Kick off first probe when active becomes true
  useEffect(() => {
    if (active && runCount === 0) {
      buildAndShowProbe(0)
    }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    setResults([])
    setRunCount(0)
    setActive(true)
  }

  const handleProbeComplete = (r) => {
    const nextCount = runCountRef.current + 1
    setResults(prev => [...prev, { run: nextCount, correct: r.isCorrect, rtMs: r.responseTimeMs }])
    setCurrentProbe(null)
    setRunCount(nextCount)
    if (nextCount < 5) {
      setTimeout(() => buildAndShowProbe(nextCount), 300)
    } else {
      setActive(false)
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Dimension <InfoTip text="Which cognitive dimension to stress-test. Runs 5 stimuli targeted at this dimension." />
        </label>
        <select className={styles.select} value={dim} onChange={e => setDim(e.target.value)}>
          {ALL_DIMENSIONS.map(d => <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>)}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Level <InfoTip text="Difficulty level 1–5 for the selected dimension. 1 = easiest, 5 = hardest." />
        </label>
        <div className={styles.chips}>
          {[1,2,3,4,5].map(l => (
            <button
              key={l}
              className={`${styles.chip} ${level === l ? styles.chipActive : ''}`}
              onClick={() => setLevel(l)}
            >{l}</button>
          ))}
        </div>
      </div>

      <button className={styles.runBtn} onClick={handleStart} disabled={active}>
        {active ? `Running ${runCount}/5…` : 'Run 5 stimuli'}
      </button>

      {results.length > 0 && (
        <div className={styles.stressResults}>
          {results.map(r => (
            <div key={r.run} className={`${styles.stressRow} ${r.correct ? styles.stressCorrect : styles.stressWrong}`}>
              Run {r.run}: {r.correct ? '✓' : '✗'} — {r.rtMs}ms
            </div>
          ))}
        </div>
      )}

      {active && currentProbe && (
        <ProbeOverlay
          probe={currentProbe}
          sentences={probeSentences}
          filledSlots={probeSlots}
          onComplete={handleProbeComplete}
        />
      )}
    </div>
  )
}

// ─── Main DevScreen ───────────────────────────────────────────────────────────

const TABS = ['Stream', 'Probe', 'Templates', 'Inspector', 'Stress']

export default function DevScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Stream')

  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
      <div className={styles.heading}>Dev Screen</div>

      <div className={styles.tabBar}>
        {TABS.map(t => (
          <button
            key={t}
            className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Stream'    && <StreamTester />}
      {tab === 'Probe'     && <ProbeTester />}
      {tab === 'Templates' && <TemplateBrowser />}
      {tab === 'Inspector' && <AdaptiveInspector />}
      {tab === 'Stress'    && <StressTest />}
    </div>
  )
}
