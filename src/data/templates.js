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


  // ─── T011–T020 ─────────────────────────────────────────────────────────────

  // transfer_belief_gap × 2

  {
    template_id: 'T011',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'A case is reassigned from E1 to E2. E3 (client) still directs queries to E1.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'hedged'] },
      nesting_depth: 2,
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
      '{E1} had been assigned to the {O1} following the initial consultation.',
      'A conflict of interest was identified and the {O1} was transferred to {E2}.',
      '{E2} reviewed the background documents without contacting {E3}.',
      '{E3} sent a detailed update request directly to {E1}.',
      '{E1} forwarded it to {E2} without explaining the reassignment.',
    ],
    probes: [
      {
        probe_id: 'T011_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe is handling the {O1}?',
        options: [
          { id: 'A', label: '{E1}',              is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}',              is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'Both jointly',      is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'The firm, unassigned', is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T012',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'Grant management passed from E1 to E2. E3 (funder) still addresses E1.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} was the named lead on the {O1} when it was first awarded.',
      'Following a departmental reshuffle, day-to-day management passed to {E2}.',
      '{E2} began attending the quarterly review meetings in {E1}\'s place.',
      '{E3} sent the annual compliance report request directly to {E1}.',
      '{E1} acknowledged the request but took no further action.',
    ],
    probes: [
      {
        probe_id: 'T012_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'What does {E3} believe about who is managing the {O1}?',
        options: [
          { id: 'A', label: '{E1} is still managing it',     is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2} now manages it',           is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'Management is unclear',         is_correct: false, failure_mode: 'signal_quality_failure' },
          { id: 'D', label: '{E3} is overseeing it directly', is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  // contradiction_chain × 2

  {
    template_id: 'T013',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Dispatch record contradicts delivery timestamp — item cannot arrive before it was sent.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['retrospective', 'passive_voice'] },
      nesting_depth: 1,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_physical',
    },
    // Contradiction at sentence index 2: delivered Tuesday, but dispatched Wednesday
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      'The {O1} was dispatched from the warehouse on Wednesday morning.',
      '{E1} confirmed the courier collected it before midday on Wednesday.',
      'Tracking records showed the {O1} was delivered to {E2} on Tuesday afternoon.',
      '{E2} signed the receipt and logged it in the intake system.',
      '{E1} closed the dispatch record on Thursday as standard procedure.',
    ],
    probes: [
      {
        probe_id: 'T013_P1',
        insert_after_sentence: 5,
        type: 'vigilance',
        subtype: 'contradiction',
        dimension_target: 'signal_quality',
        target_sentence_index: 2,
        question: 'One sentence contradicts an earlier statement. Which sentence number?',
        correct_flag: 2,
        wrong_answer_types: {
          '0': 'miss',
          '1': 'false_positive',
          '3': 'wrong_location',
          '4': 'miss',
        },
      },
    ],
  },

  {
    template_id: 'T014',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Audit finding directly contradicts earlier confirmation of timely filing.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['hedged', 'retrospective', 'negation'] },
      nesting_depth: 2,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_role',
      O1: 'object_abstract',
    },
    // Contradiction at sentence index 3: filed after deadline vs. confirmed met window
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} prepared the quarterly {O1} in advance of the statutory deadline.',
      '{E2} reviewed and approved it, confirming it met the submission window.',
      'The {O1} was submitted to the regulator through the standard portal.',
      'A subsequent audit found that the {O1} had been filed after the deadline.',
      '{E1} disputed the audit finding and requested a review of the timestamps.',
    ],
    probes: [
      {
        probe_id: 'T014_P1',
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

  // implicit_state_change × 2

  {
    template_id: 'T015',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Technical lead role shifts from E1 to E2 without any announcement.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had built the original version of the {O1} over two years.',
      'After a team expansion, new engineers began reporting to {E2}.',
      'Sprint planning sessions were now led by {E2} without {E1} present.',
      '{E1} was consulted only on legacy components no longer under active development.',
      '{E2} presented the roadmap to stakeholders as the technical lead for the {O1}.',
    ],
    probes: [
      {
        probe_id: 'T015_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'Who is now effectively leading the {O1}?',
        options: [
          { id: 'A', label: '{E1}',                              is_correct: false, failure_mode: 'interference_failure' },
          { id: 'B', label: '{E2}',                              is_correct: true,  failure_mode: null },
          { id: 'C', label: 'They share responsibility equally', is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'A newly hired engineer',            is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T016',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Patient care escalated through implicit cues — no direct statement made.',
    },
    dimension_values: {
      interference_pressure: 3,
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
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E3} was admitted for observation under a standard monitoring {O1}.',
      'Overnight readings remained within acceptable ranges and no action was taken.',
      'By morning, {E1} ordered additional monitoring at shorter intervals.',
      '{E2} arrived for the day shift and reviewed the updated charts.',
      'The ward coordinator was notified to prepare a higher-dependency bed.',
    ],
    probes: [
      {
        probe_id: 'T016_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'What has changed in {E3}\'s care situation by the end?',
        options: [
          { id: 'A', label: 'The {O1} has been escalated',        is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E3} has been discharged',           is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'No change — readings stayed normal', is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: '{E1} has simply handed over to {E2}', is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  // nested_belief_conflict × 2

  {
    template_id: 'T017',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 privately opposes O1. E2 tells E3 E1 is neutral. E3 counts on E1\'s neutrality.',
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
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had privately raised objections to the {O1} at the executive level.',
      '{E2} summarised the internal positions to {E3} before the vote.',
      'In the summary, {E2} described {E1} as having no strong view either way.',
      '{E3} factored in {E2}\'s assessment when building the coalition.',
      '{E3} counted on {E1} as a neutral party who would not block the {O1}.',
    ],
    probes: [
      {
        probe_id: 'T017_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe {E1}\'s position is on the {O1}?',
        options: [
          { id: 'A', label: 'Neutral — no strong view',           is_correct: true,  failure_mode: null },
          { id: 'B', label: 'Opposed',                            is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: 'In favour',                          is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} has not assessed {E1}\'s position', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T018',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 has accepted O1. E2 is unaware and tells E3 E1 is still deciding. E3 waits.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'hedged', 'embedded_clause'] },
      nesting_depth: 3,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had already accepted the {O1} and notified their own counsel.',
      '{E2} was unaware of this and was still preparing a counter-proposal.',
      '{E3} asked {E2} whether {E1} had made a final decision.',
      '{E2} told {E3} that {E1} was still deliberating.',
      '{E3} placed the matter on hold, expecting further negotiations.',
    ],
    probes: [
      {
        probe_id: 'T018_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe about {E1}\'s decision on the {O1}?',
        options: [
          { id: 'A', label: '{E1} is still deliberating',      is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E1} has accepted the {O1}',      is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: '{E1} has rejected the {O1}',      is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} knows {E2} is uninformed',   is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  // temporal_reframe × 2

  {
    template_id: 'T019',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Investigation steps presented out of order; a late disclosure reveals true sequence.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['retrospective', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    // Presented: inquiry opened → E2 submitted account → O1 sealed → E3 commissioned O1 → inconsistencies found
    // Chronological: E3 commissioned(3) → E2 submitted account(1) → inconsistencies found(4) → inquiry opened(0) → O1 sealed(2)
    chronological_order: [3, 1, 4, 0, 2],
    sentence_templates: [
      '{E1} opened a formal inquiry into the {O1} after receiving a tip-off.',
      '{E2} had already submitted a written account to {E3} before the inquiry opened.',
      'The {O1} was sealed by court order during the inquiry.',
      '{E3} had commissioned the {O1} six months before {E2}\'s account was written.',
      '{E2}\'s account was later found to contain inconsistencies with {E3}\'s original brief.',
    ],
    probes: [
      {
        probe_id: 'T019_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: 'Inquiry opened' },
          { id: 'B', label: '{E2} submitted written account' },
          { id: 'C', label: '{O1} sealed by court order' },
          { id: 'D', label: '{E3} commissioned the {O1}' },
          { id: 'E', label: 'Inconsistencies found in account' },
        ],
        correct_sequence: ['D', 'B', 'E', 'A', 'C'],
      },
    ],
  },

  {
    template_id: 'T020',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Property sale history described non-chronologically; auction origin revealed last.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'negation', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 4,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_physical',
    },
    // Presented: E1 signed → E3 listed (before permission) → E2 got permission → withdrawn → E2 acquired at auction
    // Chronological: E2 acquired at auction(4) → E3 listed(1) → E2 got permission(2) → withdrawn(3) → E1 signed(0)
    chronological_order: [4, 1, 2, 3, 0],
    sentence_templates: [
      '{E1} signed the purchase agreement and transferred the deposit.',
      '{E3} had listed the {O1} before the planning permission was granted.',
      '{E2} received planning permission for the development of the {O1}.',
      '{E3} withdrew the {O1} from the market briefly following a zoning dispute.',
      '{E2} had originally acquired the {O1} at auction two years earlier.',
    ],
    probes: [
      {
        probe_id: 'T020_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: '{E1} signed purchase agreement' },
          { id: 'B', label: '{E3} listed the {O1}' },
          { id: 'C', label: '{E2} received planning permission' },
          { id: 'D', label: '{O1} withdrawn from market' },
          { id: 'E', label: '{E2} acquired {O1} at auction' },
        ],
        correct_sequence: ['E', 'B', 'C', 'D', 'A'],
      },
    ],
  },


  // ─── T021–T030 ─────────────────────────────────────────────────────────────

  // transfer_belief_gap × 2

  {
    template_id: 'T021',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'Editorial responsibility handed from E1 to E2. E3 (author) still contacts E1.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['hedged', 'passive_voice'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had been working with {E3} on the {O1} for several months.',
      'Following a role change, {E1} handed editorial responsibility to {E2}.',
      '{E2} began reviewing the revised draft without reaching out to {E3}.',
      '{E3} emailed {E1} with a list of proposed changes to the {O1}.',
      '{E1} replied warmly but did not mention the handover.',
    ],
    probes: [
      {
        probe_id: 'T021_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe holds editorial responsibility for the {O1}?',
        options: [
          { id: 'A', label: '{E1}',                         is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}',                         is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'Both are co-editing',          is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'The publisher\'s committee',   is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T022',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'Insurance claim file transferred from E1 to E2. E3 (claimant) asks for E1.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 2,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} opened the {O1} file and sent {E3} an acknowledgement letter.',
      'Due to a team restructure, {E1} transferred the {O1} file to {E2} the following week.',
      '{E2} reviewed the supporting documents without updating {E3}\'s contact record.',
      '{E3} called the helpline and asked to speak directly with {E1}.',
      'The call was redirected to {E2}, who handled it without introducing themselves.',
    ],
    probes: [
      {
        probe_id: 'T022_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe is managing their {O1}?',
        options: [
          { id: 'A', label: '{E1}',                       is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}',                       is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'An unnamed representative',  is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'The claims director',        is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  // contradiction_chain × 2

  {
    template_id: 'T023',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Session record contradicts earlier statement that an external attendee was present.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    // Contradiction at sentence index 3: no external parties present vs. E2 attended as consultant
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      'The strategy session was held with all department heads present.',
      '{E2} attended as an external consultant and contributed to the discussion.',
      'A summary of the session was circulated to all attendees the following Monday.',
      'The session record noted that no external parties had been present.',
      '{E1} signed off on the official record without amendment.',
    ],
    probes: [
      {
        probe_id: 'T023_P1',
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
    template_id: 'T024',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Inventory report records zero units despite a confirmed delivery of forty.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['hedged', 'negation'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_role',
      O1: 'object_physical',
    },
    // Contradiction at sentence index 2: zero units vs. forty units delivered
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} oversaw the delivery of forty units of {O1} to the storage facility.',
      'Each unit was inspected and cleared by {E2} before being logged.',
      'The end-of-day inventory report recorded zero units of {O1} in stock.',
      '{E1} submitted the intake paperwork to the central records office.',
      'A discrepancy review was scheduled for the following week.',
    ],
    probes: [
      {
        probe_id: 'T024_P1',
        insert_after_sentence: 5,
        type: 'vigilance',
        subtype: 'contradiction',
        dimension_target: 'signal_quality',
        target_sentence_index: 2,
        question: 'One sentence contradicts an earlier statement. Which sentence number?',
        correct_flag: 2,
        wrong_answer_types: {
          '0': 'miss',
          '1': 'false_positive',
          '3': 'wrong_location',
          '4': 'miss',
        },
      },
    ],
  },

  // implicit_state_change × 2

  {
    template_id: 'T025',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Contract lead shifts from E1 to E2 through a series of procedural signals.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had drafted the initial terms of the {O1} and led the early negotiations.',
      'A senior partner assigned {E2} to manage the final stages.',
      'All communication from the counterparty was redirected to {E2}\'s office.',
      '{E1} was not invited to the closing meeting.',
      '{E2} executed the {O1} on behalf of the firm.',
    ],
    probes: [
      {
        probe_id: 'T025_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'Who holds responsibility for the {O1} at the point of execution?',
        options: [
          { id: 'A', label: '{E1}',                            is_correct: false, failure_mode: 'interference_failure' },
          { id: 'B', label: '{E2}',                            is_correct: true,  failure_mode: null },
          { id: 'C', label: 'Both have joint responsibility',  is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'The senior partner',              is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T026',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Student\'s academic standing placed under review through indirect procedural actions.',
    },
    dimension_values: {
      interference_pressure: 3,
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
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E3} enrolled in the programme under a standard academic {O1}.',
      'After the mid-term assessment, {E1} flagged performance concerns internally.',
      '{E2} was assigned as an additional point of contact for {E3}\'s progress.',
      '{E3}\'s course enrolment was put under administrative review.',
      'A letter was prepared for {E3} outlining the next steps in the process.',
    ],
    probes: [
      {
        probe_id: 'T026_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'What has changed in {E3}\'s situation by the end?',
        options: [
          { id: 'A', label: 'Their {O1} has been placed under review', is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E3} has been expelled',                  is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'Nothing has changed',                     is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: '{E3} has voluntarily withdrawn',          is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  // nested_belief_conflict × 2

  {
    template_id: 'T027',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 has already declined O1. E2 tells E3 E1 is still evaluating. E3 pursues E1.',
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
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had already declined the {O1} after reviewing the risk profile.',
      '{E2} was not informed of the decision and was still preparing materials.',
      '{E3} asked {E2} whether {E1} had reached a conclusion on the {O1}.',
      '{E2} told {E3} that {E1} was still in the process of evaluating options.',
      '{E3} arranged a follow-up call with {E1} to present additional data.',
    ],
    probes: [
      {
        probe_id: 'T027_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe about {E1}\'s position on the {O1}?',
        options: [
          { id: 'A', label: '{E1} is still evaluating',        is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E1} has declined it',            is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: '{E1} has accepted it',            is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} knows {E1} has already decided', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T028',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 found results inconclusive. E2 (unaware) tells E3 findings were positive.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'hedged', 'embedded_clause'] },
      nesting_depth: 3,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} completed the analysis and found the results of the {O1} were inconclusive.',
      '{E2} had only seen the preliminary summary, which highlighted positive signals.',
      '{E3} consulted {E2} about whether to proceed with the next phase of the {O1}.',
      '{E2} indicated that {E1}\'s findings supported moving forward.',
      '{E3} approved the next phase on the basis of {E2}\'s account of {E1}\'s work.',
    ],
    probes: [
      {
        probe_id: 'T028_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe {E1}\'s findings show about the {O1}?',
        options: [
          { id: 'A', label: 'Positive support for moving forward', is_correct: true,  failure_mode: null },
          { id: 'B', label: 'Inconclusive results',                is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: 'Negative results',                    is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} has not considered {E1}\'s findings', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  // temporal_reframe × 2

  {
    template_id: 'T029',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Division dissolution described forward; final sentence traces origin to regulatory warning.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['retrospective', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    // Presented: E1 announces → staff transferring → E2 agreed 3 months prior → clients notified → regulatory warning (oldest)
    // Chronological: regulatory warning(4) → E2 agreed(2) → staff transferring(1) → E1 announces(0) → clients notified(3)
    chronological_order: [4, 2, 1, 0, 3],
    sentence_templates: [
      '{E1} announced the formal dissolution of the {O1} at an emergency board meeting.',
      'Key staff had already begun transferring to the successor entity weeks earlier.',
      '{E2} had privately agreed to the dissolution three months before the announcement.',
      'Clients were notified only on the day of the official announcement.',
      'The decision had been triggered by a regulatory warning received six months prior.',
    ],
    probes: [
      {
        probe_id: 'T029_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: 'Dissolution announced' },
          { id: 'B', label: 'Staff began transferring' },
          { id: 'C', label: '{E2} privately agreed to dissolution' },
          { id: 'D', label: 'Clients notified' },
          { id: 'E', label: 'Regulatory warning received' },
        ],
        correct_sequence: ['E', 'C', 'B', 'A', 'D'],
      },
    ],
  },

  {
    template_id: 'T030',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Treaty ratification described from outcome backward; informal talks revealed as origin.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 4,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    // Presented: O1 signed → dispute clauses added → E3 raised concerns → terms drafted → informal talks (oldest)
    // Chronological: informal talks(4) → terms drafted(3) → E3 raised concerns(2) → dispute clauses added(1) → O1 signed(0)
    chronological_order: [4, 3, 2, 1, 0],
    sentence_templates: [
      'The {O1} was signed by {E1} and {E2} at a formal summit.',
      'Dispute resolution clauses were added after {E3} flagged implementation concerns.',
      '{E3} had raised the concerns in a memo circulated three months before the summit.',
      'The original terms had been drafted jointly by {E1} and {E2} before {E3} was consulted.',
      'Informal discussions between {E1} and {E2} had begun a full year before drafting started.',
    ],
    probes: [
      {
        probe_id: 'T030_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: '{O1} signed at summit' },
          { id: 'B', label: 'Dispute clauses added' },
          { id: 'C', label: '{E3} raised concerns in memo' },
          { id: 'D', label: 'Original terms drafted' },
          { id: 'E', label: 'Informal discussions began' },
        ],
        correct_sequence: ['E', 'D', 'C', 'B', 'A'],
      },
    ],
  },


  // ─── T031–T040 ─────────────────────────────────────────────────────────────

  // transfer_belief_gap × 2

  {
    template_id: 'T031',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'Budget authority transferred from E1 to E2. E3 (vendor) still seeks E1\'s approval.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'hedged'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had held budget approval authority for the {O1} since the department was formed.',
      'Following a governance review, {E2} was appointed as the new budget holder.',
      '{E2} assumed the role without a formal announcement to external parties.',
      '{E3} submitted an invoice for the {O1} addressed to {E1} for approval.',
      '{E1} passed it to {E2} internally without notifying {E3} of the change.',
    ],
    probes: [
      {
        probe_id: 'T031_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe holds budget approval authority for the {O1}?',
        options: [
          { id: 'A', label: '{E1}',                        is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}',                        is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'A joint committee',           is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'The finance department',      is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T032',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'Site supervisor role passes from E1 to E2. E3 (subcontractor) still reports to E1.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 2,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_role',
      E3: 'entity_professional',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} was the named site supervisor at the start of the {O1}.',
      'Midway through, {E2} was brought in to take over day-to-day oversight.',
      '{E1} completed a handover pack and stepped back from site duties.',
      '{E3} filed a progress report addressed to {E1} at the end of the week.',
      '{E1} filed it without forwarding it to {E2} or clarifying the supervisory change.',
    ],
    probes: [
      {
        probe_id: 'T032_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe is their site supervisor for the {O1}?',
        options: [
          { id: 'A', label: '{E1}',                                    is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}',                                    is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'The project director',                    is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'D', label: 'Oversight is shared between {E1} and {E2}', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  // contradiction_chain × 2

  {
    template_id: 'T033',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Meeting described as impromptu contradicts earlier confirmation it was calendar-scheduled.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['retrospective', 'hedged'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    // Contradiction at sentence index 3: impromptu discussion vs. in shared calendar two weeks prior
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} and {E2} met on Thursday afternoon to discuss the {O1}.',
      'The meeting had been in the shared calendar for two weeks.',
      '{E3} was not able to attend but received a summary afterward.',
      '{E1} later referred to the meeting as an impromptu, unscheduled discussion.',
      '{E2} circulated the agreed action points the following morning.',
    ],
    probes: [
      {
        probe_id: 'T033_P1',
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
    template_id: 'T034',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Incident report calls event the first of its kind; earlier sentence noted two prior incidents.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['hedged', 'negation'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_role',
      O1: 'object_physical',
    },
    // Contradiction at sentence index 2: first of its kind vs. two prior incidents this quarter
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      'The facility had recorded two previous safety incidents that quarter.',
      '{E1} filed a standard report after the latest event involving the {O1}.',
      'The report described the incident as the first of its kind at the facility.',
      '{E2} reviewed the report and forwarded it to the compliance team.',
      'A formal investigation was opened based on the information in the report.',
    ],
    probes: [
      {
        probe_id: 'T034_P1',
        insert_after_sentence: 5,
        type: 'vigilance',
        subtype: 'contradiction',
        dimension_target: 'signal_quality',
        target_sentence_index: 2,
        question: 'One sentence contradicts an earlier statement. Which sentence number?',
        correct_flag: 2,
        wrong_answer_types: {
          '0': 'miss',
          '1': 'false_positive',
          '3': 'wrong_location',
          '4': 'miss',
        },
      },
    ],
  },

  // implicit_state_change × 2

  {
    template_id: 'T035',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Story assignment passes from E1 to E2 through procedural exclusion, never announced.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had been developing the {O1} story for three months.',
      'After a team reshuffle, {E2} was given access to the same source network.',
      'All editorial meetings on the {O1} were now attended exclusively by {E2}.',
      '{E1}\'s pitches on the {O1} went unanswered for two weeks.',
      '{E2} filed the lead story on the {O1} under their own byline.',
    ],
    probes: [
      {
        probe_id: 'T035_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'Who is now responsible for covering the {O1}?',
        options: [
          { id: 'A', label: '{E1}',                              is_correct: false, failure_mode: 'interference_failure' },
          { id: 'B', label: '{E2}',                              is_correct: true,  failure_mode: null },
          { id: 'C', label: 'They share the story jointly',      is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'A senior editor took over',         is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T036',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Building management shifts from E1 to E2 through access changes and billing updates.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_physical',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had managed the {O1} on behalf of the owners for four years.',
      'A new management company was appointed at the start of the financial year.',
      '{E2} began handling contractor bookings and tenant queries for the {O1}.',
      '{E1}\'s access to the building management system was revoked.',
      'Maintenance invoices for the {O1} were addressed to {E2} going forward.',
    ],
    probes: [
      {
        probe_id: 'T036_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'Who is now managing the {O1}?',
        options: [
          { id: 'A', label: '{E1}',                                           is_correct: false, failure_mode: 'interference_failure' },
          { id: 'B', label: '{E2}',                                           is_correct: true,  failure_mode: null },
          { id: 'C', label: 'The owners directly',                            is_correct: false, failure_mode: 'signal_quality_failure' },
          { id: 'D', label: 'Both {E1} and {E2} under a shared arrangement',  is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  // nested_belief_conflict × 2

  {
    template_id: 'T037',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 flagged a technical risk on O1. E2 tells E3 E1 gave clearance. E3 proceeds.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['hedged', 'conditional'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had flagged a potential technical risk with the {O1} in an internal memo.',
      '{E2} briefed {E3} on the status of the {O1} before the launch decision.',
      '{E2} did not mention the memo and described {E1} as having cleared the {O1}.',
      '{E3} asked whether all technical leads had signed off on the {O1}.',
      '{E2} confirmed that {E1}\'s assessment had concluded positively.',
    ],
    probes: [
      {
        probe_id: 'T037_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe about {E1}\'s position on the {O1}?',
        options: [
          { id: 'A', label: '{E1} has cleared the {O1}',           is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E1} has flagged a risk',             is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: '{E1} has not reviewed the {O1}',      is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} is unaware of {E1}\'s involvement', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T038',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 assessed high risk. E2 misreports it as low risk to E3. E3 closes priority referral.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'hedged', 'embedded_clause'] },
      nesting_depth: 3,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} assessed {E3}\'s situation and noted significant vulnerabilities in the {O1}.',
      '{E2} received a brief verbal summary from {E1} but understood it as low concern.',
      'A coordinating body asked {E2} to confirm {E1}\'s risk assessment for the {O1}.',
      '{E2} reported that {E1} had assessed the situation as low-risk under the {O1} framework.',
      'The coordinating body closed the high-priority referral on the basis of {E2}\'s account.',
    ],
    probes: [
      {
        probe_id: 'T038_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does the coordinating body believe {E1}\'s {O1} assessment found?',
        options: [
          { id: 'A', label: 'Low risk — not a priority case',      is_correct: true,  failure_mode: null },
          { id: 'B', label: 'Significant vulnerabilities',         is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: '{E1} had not completed the assessment', is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: 'The body has not considered {E1}\'s findings', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  // temporal_reframe × 2

  {
    template_id: 'T039',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Company registration presented as endpoint; earlier funding and concept phases revealed.',
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
    // Presented: registration → E2 joins → E2 secures funding → partnership signed → concept documented (oldest)
    // Chronological: concept documented(2) → E2 joins(4) → E2 secures funding(1) → partnership signed(3) → registered(0)
    chronological_order: [2, 4, 1, 3, 0],
    sentence_templates: [
      'The {O1} was officially registered under {E1}\'s name at the end of the quarter.',
      '{E2} had secured the funding needed for the {O1} before the registration.',
      'The initial concept for the {O1} was first documented by {E1} in a private brief.',
      'A formal partnership agreement between {E1} and {E2} was signed a month before registration.',
      '{E2} joined the project after {E1}\'s early-stage work had already attracted attention.',
    ],
    probes: [
      {
        probe_id: 'T039_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: '{O1} officially registered' },
          { id: 'B', label: '{E2} secured funding' },
          { id: 'C', label: 'Initial concept documented' },
          { id: 'D', label: 'Partnership agreement signed' },
          { id: 'E', label: '{E2} joined the project' },
        ],
        correct_sequence: ['C', 'E', 'B', 'D', 'A'],
      },
    ],
  },

  {
    template_id: 'T040',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Research publication presented from outcome back; submission preceded the pre-print.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 4,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_role',
      O1: 'object_abstract',
    },
    // Presented: published → pre-print shared → revisions requested → data collection → initial submission (oldest)
    // Chronological: data collection(3) → initial submission(4) → revisions requested(2) → pre-print shared(1) → published(0)
    chronological_order: [3, 4, 2, 1, 0],
    sentence_templates: [
      '{E1} published the final results of the {O1} in a peer-reviewed journal.',
      'A pre-print version was shared with the research community six months earlier.',
      'The journal had requested major revisions after the initial submission.',
      '{E1} began collecting data for the {O1} three years before publication.',
      'The initial submission to the journal was made before the pre-print was released.',
    ],
    probes: [
      {
        probe_id: 'T040_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: 'Final results published' },
          { id: 'B', label: 'Pre-print shared' },
          { id: 'C', label: 'Journal requested revisions' },
          { id: 'D', label: 'Data collection began' },
          { id: 'E', label: 'Initial submission made' },
        ],
        correct_sequence: ['D', 'E', 'C', 'B', 'A'],
      },
    ],
  },


  // ─── T041–T050 ─────────────────────────────────────────────────────────────

  // transfer_belief_gap × 2

  {
    template_id: 'T041',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'Executor role passes from E1 to E2 after resignation. E3 still directs queries to E1.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'hedged'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} was named as executor of the {O1} at the time it was drafted.',
      'Following {E1}\'s resignation from the role, {E2} was appointed as successor executor.',
      '{E2} began corresponding with the relevant authorities without informing {E3}.',
      '{E3} sent a formal enquiry about the {O1} directly to {E1}.',
      '{E1} acknowledged receipt but did not correct {E3}\'s assumption about the executorship.',
    ],
    probes: [
      {
        probe_id: 'T041_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe is currently managing the {O1}?',
        options: [
          { id: 'A', label: '{E1}',                                    is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}',                                    is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'A solicitor firm acting jointly',         is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'The court, pending appointment',          is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T042',
    deep_structure: {
      pattern: 'transfer_belief_gap',
      description: 'Lab director role passes from E1 to E2 quietly. E3 (funder) still addresses E1.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 2,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had served as director of the {O1} programme since its inception.',
      'After securing a major fellowship, {E1} stepped down and recommended {E2} as successor.',
      '{E2} assumed the directorship without a public announcement.',
      '{E3} sent the annual funding renewal letter addressed to {E1}.',
      '{E1} forwarded it to {E2} but included only a brief note with no explanation.',
    ],
    probes: [
      {
        probe_id: 'T042_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'interference_pressure',
        question: 'Who does {E3} believe is directing the {O1} programme?',
        options: [
          { id: 'A', label: '{E1}',                               is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E2}',                               is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'A joint leadership committee',       is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: 'The institution\'s provost',         is_correct: false, failure_mode: 'nesting_failure' },
        ],
      },
    ],
  },

  // contradiction_chain × 2

  {
    template_id: 'T043',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Property listing calls premises vacant; earlier sentence established an active tenancy.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 1,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_role',
      E2: 'entity_professional',
      E3: 'entity_professional',
      O1: 'object_physical',
    },
    // Contradiction at sentence index 2: property listed as vacant vs. active twelve-month tenancy
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E3} had been a tenant at the {O1} under a twelve-month lease agreement.',
      '{E1} conducted a routine inspection and found the premises in good condition.',
      'The property listing prepared by {E2} described the {O1} as currently vacant.',
      '{E1} filed the inspection report with the relevant records office.',
      '{E2} circulated the listing to prospective tenants the following day.',
    ],
    probes: [
      {
        probe_id: 'T043_P1',
        insert_after_sentence: 5,
        type: 'vigilance',
        subtype: 'contradiction',
        dimension_target: 'signal_quality',
        target_sentence_index: 2,
        question: 'One sentence contradicts an earlier statement. Which sentence number?',
        correct_flag: 2,
        wrong_answer_types: {
          '0': 'miss',
          '1': 'false_positive',
          '3': 'wrong_location',
          '4': 'miss',
        },
      },
    ],
  },

  {
    template_id: 'T044',
    deep_structure: {
      pattern: 'contradiction_chain',
      description: 'Internal memo calls event postponed; earlier sentence confirmed the date was set.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['hedged', 'negation'] },
      nesting_depth: 2,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_role',
      O1: 'object_abstract',
    },
    // Contradiction at sentence index 3: postponed vs. confirmed date with calendar invitations sent
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} began coordinating logistics for the {O1} six weeks in advance.',
      '{E2} confirmed the date with all key participants and sent calendar invitations.',
      'Catering and venue arrangements were finalised by the end of the week.',
      '{E1} noted in a memo that the {O1} had been postponed due to a scheduling conflict.',
      '{E2} followed up with a reminder to all participants three days before the event.',
    ],
    probes: [
      {
        probe_id: 'T044_P1',
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

  // implicit_state_change × 2

  {
    template_id: 'T045',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Probationary status ends implicitly through assignment, access, and headcount inclusion.',
    },
    dimension_values: {
      interference_pressure: 2,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['passive_voice', 'retrospective'] },
      nesting_depth: 1,
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
      '{E3} joined the organisation under a six-month probationary {O1}.',
      'After the third month, {E1} filed a positive performance note in the system.',
      '{E3} was assigned to lead an independent project without additional supervision.',
      '{E2} included {E3} in the permanent staff communication channels.',
      '{E3}\'s name appeared on the annual headcount report as a confirmed member of staff.',
    ],
    probes: [
      {
        probe_id: 'T045_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'What has changed in {E3}\'s employment situation?',
        options: [
          { id: 'A', label: 'The probationary {O1} has effectively ended', is_correct: true,  failure_mode: null },
          { id: 'B', label: '{E3} has been promoted',                      is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'Nothing — probation continues',               is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: '{E3} has moved to a fixed-term contract',     is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T046',
    deep_structure: {
      pattern: 'implicit_state_change',
      description: 'Credit limit quietly reduced after covenant breach — never stated explicitly.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['passive_voice', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 3,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had extended a standard line of credit to {E2} at the start of the year.',
      'A covenant review flagged that one threshold on the {O1} had been breached.',
      '{E1} quietly reduced the available limit on {E2}\'s {O1}.',
      'New transactions by {E2} against the {O1} began to be declined automatically.',
      '{E1} scheduled a review meeting with {E2} to discuss the {O1} terms.',
    ],
    probes: [
      {
        probe_id: 'T046_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'binding',
        dimension_target: 'signal_quality',
        question: 'What has changed in {E2}\'s {O1} situation?',
        options: [
          { id: 'A', label: 'The credit limit has been reduced',      is_correct: true,  failure_mode: null },
          { id: 'B', label: 'The {O1} has been cancelled entirely',   is_correct: false, failure_mode: 'interference_failure' },
          { id: 'C', label: 'Nothing has changed',                    is_correct: false, failure_mode: 'binding_failure' },
          { id: 'D', label: '{E2} has requested a limit increase',    is_correct: false, failure_mode: 'signal_quality_failure' },
        ],
      },
    ],
  },

  // nested_belief_conflict × 2

  {
    template_id: 'T047',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 withdrew consent for O1. E2 (unaware) tells E3 consent is in place. E3 authorises.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 3, explicitness: 'mixed', sentence_types: ['hedged', 'conditional'] },
      nesting_depth: 2,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_role',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had verbally withdrawn consent for the {O1} during a private consultation.',
      'The withdrawal was not formally recorded before {E2} reviewed the case file.',
      '{E3} asked {E2} whether consent for the {O1} had been obtained and confirmed.',
      '{E2} confirmed to {E3} that consent was in place and the {O1} could proceed.',
      '{E3} authorised the next stage of the {O1} on the basis of {E2}\'s confirmation.',
    ],
    probes: [
      {
        probe_id: 'T047_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe about the consent status of the {O1}?',
        options: [
          { id: 'A', label: 'Consent is in place',                     is_correct: true,  failure_mode: null },
          { id: 'B', label: 'Consent has been withdrawn',              is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: 'Consent was never sought',                is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} is uncertain about the consent status', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  {
    template_id: 'T048',
    deep_structure: {
      pattern: 'nested_belief_conflict',
      description: 'E1 privately changed vote to against. E2 (outdated) tells E3 E1 is in favour.',
    },
    dimension_values: {
      interference_pressure: 4,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'hedged', 'embedded_clause'] },
      nesting_depth: 3,
      discourse_structure: 2,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    chronological_order: [0, 1, 2, 3, 4],
    sentence_templates: [
      '{E1} had privately informed their proxy of an intention to vote against the {O1}.',
      '{E2} had spoken with {E1} a week earlier, before the change of intention.',
      '{E3} asked {E2} how {E1} was likely to vote on the {O1}.',
      '{E2} told {E3} that {E1} had expressed support for the {O1}.',
      '{E3} structured the coalition assuming {E1}\'s vote would be in favour.',
    ],
    probes: [
      {
        probe_id: 'T048_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'belief_state',
        dimension_target: 'nesting_depth',
        question: 'What does {E3} believe {E1} intends to do regarding the {O1}?',
        options: [
          { id: 'A', label: 'Vote in favour',                             is_correct: true,  failure_mode: null },
          { id: 'B', label: 'Vote against',                               is_correct: false, failure_mode: 'nesting_failure' },
          { id: 'C', label: 'Abstain',                                    is_correct: false, failure_mode: 'interference_failure' },
          { id: 'D', label: '{E3} has not formed a view on {E1}\'s intention', is_correct: false, failure_mode: 'binding_failure' },
        ],
      },
    ],
  },

  // temporal_reframe × 2

  {
    template_id: 'T049',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Legal proceedings described mid-sequence; complaint origin and appointment order revealed.',
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
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    // Presented: ruling issued → E2 submitted evidence → hearing scope established → E3 appointed → E1 filed complaint (oldest)
    // Chronological: E1 files complaint(1) → E2 submits evidence(3) → hearing scope(2) → E3 appointed(4) → ruling(0)
    chronological_order: [1, 3, 2, 4, 0],
    sentence_templates: [
      'The court issued a final ruling on the {O1} case.',
      '{E1} had filed the initial complaint that triggered the {O1} proceedings.',
      'A preliminary hearing established the scope of the {O1} dispute.',
      '{E2} submitted additional evidence before the preliminary hearing concluded.',
      '{E3} was appointed as the presiding authority for the {O1} after the hearing.',
    ],
    probes: [
      {
        probe_id: 'T049_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: 'Court issued final ruling' },
          { id: 'B', label: '{E1} filed initial complaint' },
          { id: 'C', label: 'Preliminary hearing concluded' },
          { id: 'D', label: '{E2} submitted additional evidence' },
          { id: 'E', label: '{E3} appointed as presiding authority' },
        ],
        correct_sequence: ['B', 'D', 'C', 'E', 'A'],
      },
    ],
  },

  {
    template_id: 'T050',
    deep_structure: {
      pattern: 'temporal_reframe',
      description: 'Estate transfer described from outcome; original drafting and dispute resolution revealed.',
    },
    dimension_values: {
      interference_pressure: 3,
      signal_quality: { level: 4, explicitness: 'implicit', sentence_types: ['retrospective', 'conditional'] },
      nesting_depth: 1,
      discourse_structure: 4,
    },
    surface_slots: {
      E1: 'entity_professional',
      E2: 'entity_professional',
      E3: 'entity_role',
      O1: 'object_abstract',
    },
    // Presented: O1 transferred → E2 contested → mediation settled → objection reviewed → E1 drafted (oldest)
    // Chronological: E1 drafted O1(4) → E2 contested(1) → objection reviewed(3) → mediation/settlement(2) → O1 transferred(0)
    chronological_order: [4, 1, 3, 2, 0],
    sentence_templates: [
      'The {O1} was formally transferred to {E3} following a probate process.',
      '{E2} had contested the initial terms of the {O1} in a written objection.',
      'A mediation session between {E2} and {E3} reached an agreed settlement.',
      'The objection was reviewed and partially upheld by the appointed administrator.',
      '{E1} had originally drafted the {O1} several years before any dispute arose.',
    ],
    probes: [
      {
        probe_id: 'T050_P1',
        insert_after_sentence: 5,
        type: 'retrieval',
        subtype: 'temporal_sequencing',
        dimension_target: 'temporal_order',
        question: 'Order these events from earliest to most recent.',
        options: [
          { id: 'A', label: '{O1} transferred to {E3}' },
          { id: 'B', label: '{E2} contested the terms' },
          { id: 'C', label: 'Mediation reached settlement' },
          { id: 'D', label: 'Objection reviewed and upheld' },
          { id: 'E', label: '{E1} originally drafted the {O1}' },
        ],
        correct_sequence: ['E', 'B', 'D', 'C', 'A'],
      },
    ],
  },

]
