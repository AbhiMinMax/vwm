// Template definitions — Layer 1 of the three-layer architecture.
// Templates know nothing about users, sessions, or difficulty.
//
// Schema notes:
//   chronological_order: indices into sentence_templates giving true chronological sequence.
//     e.g. [2, 0, 1] means sentence[2] happened first, sentence[0] second, sentence[1] last.
//     'linear' mode re-sorts sentences by this order before display.
//     'nonlinear' mode presents sentences in template order (author's designed story order).
//
//   probe.dimension_target: which cognitive dimension this probe primarily tests.
//
//   probe.options (multiple choice / belief state / binding):
//     { id, label, is_correct, failure_mode }  — failure_mode null on correct option.
//
//   probe.correct_sequence (temporal sequencing):
//     ordered array of option ids giving the true chronological sequence.
//
//   probe.target_sentence_index (vigilance — contradiction / irrelevance):
//     0-based index of the planted sentence in sentence_templates.
//   probe.correct_flag: same value, used by FlagProbe for answer checking.
//   probe.wrong_answer_types: map from sentence index (as string) to failure type.

export const templates = [

  // ─── Pattern 1: transfer_belief_gap ────────────────────────────────────────
  // Entity A transfers an object/responsibility to B. C believes A still holds it.

  {
    template_id: 'T001',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'A transfers object to B. C believes A still holds it.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['conditional', 'hedged', 'retrospective'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    // Nonlinear story order: E1 had it → quietly reassigned to E2 → E2 met E3 silently → E1 sent report → E3 assumed E1 wrote it
    // Chronological: same as presentation order here (events unfold in order)
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had been managing the {O1} since the restructuring.',
      'After the board meeting, the {O1} was quietly reassigned to {E2}.',
      '{E2} met with {E3} without mentioning the transition.',
      '{E1} sent the quarterly summary directly to {E3}, unaware of the change.',
      '{E3} responded to {E2} assuming {E1} had written it.',
    ],
    probes: [
      {
        probe_id: 'T001_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe prepared the summary?',
        options: [
          { id: 'A', label: '{E1}', is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}', is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'The board', is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'D', label: 'Unknown', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T002',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'A delegates authority to B mid-project. C acts as if A still leads.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'hedged'] },
      nesting_depth: 2,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_role',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    // Chronological: E1 held authority → E1 stepped back → E2 took over → E3 never told → E3 sent request to E1
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had final sign-off authority over the {O1} from the outset.',
      'Partway through the project, {E1} stepped back due to a scheduling conflict.',
      '{E2} assumed responsibility without a formal announcement.',
      '{E3} was never updated about the change in authority.',
      'When the {O1} needed urgent revision, {E3} sent the request directly to {E1}.',
    ],
    probes: [
      {
        probe_id: 'T002_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe about who holds authority over the {O1}?',
        options: [
          { id: 'A', label: '{E1} still holds authority', is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2} holds authority',       is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'Authority is shared',        is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: '{E3} holds authority',       is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  // ─── Pattern 2: contradiction_chain ────────────────────────────────────────
  // A series of statements that collectively contain an internal contradiction.
  // One sentence directly contradicts an earlier one — user must detect it.

  {
    template_id: 'T003',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Timeline of approvals contains a direct contradiction.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['conditional', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    // Chronological order matches presentation — the contradiction is at sentence index 3
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} submitted the {O1} for review on Monday.',
      '{E2} confirmed it was received and logged the same day.',
      'The review panel met on Wednesday and cleared the {O1} for implementation.',
      '{E2} later stated the {O1} had not been received until Thursday.',
      'Implementation proceeded based on the Wednesday clearance.',
    ],
    probes: [
      {
        probe_id: 'T003_P1',
        insert_after_sentence: 5,
        type: 'vigilance',
        subtype: 'contradiction',
        dimension_target: 'signal_quality',
        target_sentence_index: 3,
        question: 'One sentence contradicts an earlier statement. Which sentence number?',
        correct_flag: 3,
        wrong_answer_types: {
          '0': 'miss',
          '1': 'false_positive',
          '2': 'false_positive',
          '4': 'wrong_location',
        },
      },
    ],
  },

  {
    template_id: 'T004',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Two witnesses give incompatible accounts of the same event.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['hedged', 'retrospective', 'negation'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_role',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    // Contradiction is at sentence index 4: E2 says E3 was absent, but sentence 1 says E3 was present
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E3} was present at the initial briefing where the {O1} was introduced.',
      '{E1} confirmed that all key stakeholders attended the briefing.',
      'A decision on the {O1} was deferred pending further input from {E3}.',
      '{E2} was asked to summarise the meeting for the record.',
      '{E2}\'s summary noted that {E3} had not been present at the briefing.',
    ],
    probes: [
      {
        probe_id: 'T004_P1',
        insert_after_sentence: 5,
        type: 'vigilance',
        subtype: 'contradiction',
        dimension_target: 'signal_quality',
        target_sentence_index: 4,
        question: 'One sentence contradicts an earlier statement. Which sentence number?',
        correct_flag: 4,
        wrong_answer_types: {
          '0': 'miss',
          '1': 'false_positive',
          '2': 'false_positive',
          '3': 'false_positive',
        },
      },
    ],
  },

  // ─── Pattern 3: implicit_state_change ──────────────────────────────────────
  // The state of an entity changes, but the change is never stated directly.
  // User must infer from implicit cues.

  {
    template_id: 'T005',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Ownership of a decision shifts without explicit announcement.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'hedged', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    // Chronological: E1 had O1 → restructure → E2 appears → E1 absent from later steps → E2 finalises
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} was responsible for the {O1} at the start of the quarter.',
      'Following the organisational restructure, reporting lines were revised.',
      '{E2} began attending all meetings related to the {O1}.',
      '{E1} was not included in the final review.',
      '{E2} signed off on the completed {O1}.',
    ],
    probes: [
      {
        probe_id: 'T005_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'Who holds current responsibility for the {O1}?',
        options: [
          { id: 'A', label: '{E1}', is_correct: false, failure_mode: 'interference_failure' },
          { id: 'B', label: '{E2}', is_correct: true,  failure_mode: null },
          { id: 'C', label: 'Both equally', is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'Unclear from the text', is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T006',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'A patient\'s status changes implicitly through the actions of others.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_role',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    // Chronological: initial assessment → E1 orders O1 → E3 condition changes → E2 reviews → protocol updated
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} completed the initial assessment and ordered a standard {O1}.',
      '{E3} showed no adverse response during the first observation window.',
      'Overnight, secondary indicators prompted a reassessment.',
      '{E2} reviewed the updated readings before the morning handover.',
      'The treatment protocol was adjusted to reflect the revised {O1}.',
    ],
    probes: [
      {
        probe_id: 'T006_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'What has changed by the end of the account?',
        options: [
          { id: 'A', label: 'The {O1} has been adjusted', is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E1} is no longer involved', is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: '{E3} showed an adverse response', is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'Nothing has changed',           is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  // ─── Pattern 4: nested_belief_conflict ─────────────────────────────────────
  // A believes X. B believes A believes Y (which is wrong). C acts on B's belief.

  {
    template_id: 'T007',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'A\'s actual belief differs from what B thinks A believes; C acts on B\'s version.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['hedged', 'conditional'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} expressed reservations about the {O1} during a private conversation.',
      '{E2} was told that {E1} had fully endorsed the {O1}.',
      '{E3} asked {E2} whether {E1} supported moving forward.',
      '{E2} confirmed to {E3} that {E1} was in favour.',
      '{E3} proceeded on the assumption that {E1}\'s support was secured.',
    ],
    probes: [
      {
        probe_id: 'T007_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe {E1}\'s position on the {O1} is?',
        options: [
          { id: 'A', label: '{E1} is in favour',         is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E1} has reservations',     is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: '{E1} is opposed',           is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} is unsure of {E1}\'s view', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T008',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'A knows the truth. B has a false model of A\'s knowledge. C inherits B\'s false model.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'hedged', 'embedded_clause'] },
      nesting_depth: 3,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_role',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had reviewed the {O1} and identified a critical flaw.',
      '{E2} assumed {E1}\'s review had been limited to the summary section.',
      '{E3} consulted {E2} before deciding whether to proceed.',
      '{E2} indicated that {E1} was unlikely to have found any issues.',
      '{E3} concluded that {E1}\'s review posed no obstacle to approval.',
    ],
    probes: [
      {
        probe_id: 'T008_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} think {E2} believes about {E1}\'s review?',
        options: [
          { id: 'A', label: '{E2} thinks {E1} found no issues',       is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2} thinks {E1} found a critical flaw', is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: '{E2} thinks {E1} did not review it',     is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} has not formed a view on {E2}\'s belief', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  // ─── Pattern 5: temporal_reframe ───────────────────────────────────────────
  // Events are presented out of chronological order; a later sentence reframes
  // the meaning or causality of earlier events.

  {
    template_id: 'T009',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Merger timeline presented in reverse; final sentence reveals true sequence.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['retrospective', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    // Presented order: merger closed → board approved → regulatory → deficit disclosed → audit (oldest)
    // Chronological order: audit(4) → merger proposed(0→ implied) → board approval(1) → regulatory(2) → merger closed(0) → deficit disclosed(3)
    // Using sentence indices: sentence 4 happened first, then 2, then 1, then 3, then 0
    chronological_order: [4, 2, 1, 3, 0],
    sentence_templates: [
      'The merger closed on a Friday, with all parties satisfied.',
      'The board had approved it conditionally, pending regulatory sign-off.',
      'Regulatory approval came through before the audit findings were published.',
      'The deficit was disclosed to shareholders only after the merger closed.',
      'The audit had actually been completed six months before the merger was proposed.',
    ],
    probes: [
      {
        probe_id: 'T009_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: 'Merger closed' },
          { id: 'B', label: 'Board approval' },
          { id: 'C', label: 'Regulatory sign-off' },
          { id: 'D', label: 'Deficit disclosed' },
          { id: 'E', label: 'Audit completed' },
        ],
        correct_sequence: ['E', 'C', 'B', 'D', 'A'],
      },
    ],
  },

  {
    template_id: 'T010',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Investigation steps described non-chronologically; a disclosure reorders meaning.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'negation', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 4,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_role',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    // Presented: E2 reviewed → E3 flagged issue → E1 signed off → E3 flagged before sign-off → E1 had reviewed earlier
    // Chronological: E1 reviewed(4) → E1 signed off(2) → E3 flagged(1→ before sign-off=3) → E3 flagged again(1) → E2 reviewed(0)
    // True sequence: sentence 4 first, then 3, then 2, then 1, then 0
    chronological_order: [4, 3, 2, 1, 0],
    sentence_templates: [
      '{E2} reviewed the completed {O1} and raised no concerns.',
      '{E3} flagged an inconsistency in the supporting data.',
      '{E1} had already signed off on the {O1} by that point.',
      '{E3} had flagged the same inconsistency before {E1}\'s sign-off.',
      '{E1} had reviewed the data independently, prior to any input from {E2}.',
    ],
    probes: [
      {
        probe_id: 'T010_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: '{E2} reviewed and raised no concerns' },
          { id: 'B', label: '{E3} flagged the inconsistency' },
          { id: 'C', label: '{E1} signed off' },
          { id: 'D', label: '{E3} flagged the issue (first time)' },
          { id: 'E', label: '{E1} reviewed the data independently' },
        ],
        correct_sequence: ['E', 'D', 'C', 'B', 'A'],
      },
    ],
  },

]
