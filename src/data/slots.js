// Surface slot libraries — all values used for runtime slot substitution.
// Each category has 20+ values to give enough variety across sessions.

export const slots = {
  entity_professional: [
    'Elena', 'Marcus', 'Priya', 'David', 'Omar', 'Rachel',
    'James', 'Nina', 'Sarah', 'Adrian', 'Leila', 'Tom',
    'Chen', 'Yusuf', 'Dana', 'Reza', 'Mia', 'Viktor',
    'Sana', 'Eli', 'Nora', 'Farid',
  ],

  entity_role: [
    'the surgeon', 'the CFO', 'the analyst', 'the director',
    'the lawyer', 'the resident', 'the auditor', 'the commander',
    'the prosecutor', 'the specialist', 'the coordinator',
    'the consultant', 'the investigator', 'the delegate',
    'the administrator', 'the liaison', 'the assessor', 'the supervisor',
    'the officer', 'the examiner',
  ],

  object_abstract: [
    'contract', 'proposal', 'budget', 'report', 'diagnosis',
    'referral', 'brief', 'mandate', 'clearance', 'approval',
    'assessment', 'directive', 'recommendation', 'filing',
    'amendment', 'deposition', 'warrant', 'allocation',
    'authorization', 'memorandum', 'disclosure', 'ruling',
  ],

  object_physical: [
    'file', 'document', 'package', 'key', 'record',
    'specimen', 'device', 'drive', 'folder', 'kit',
    'case', 'sample', 'evidence', 'cartridge',
  ],

  location: [
    'boardroom', 'clinic', 'courtroom', 'operations center',
    'warehouse', 'research lab', 'field office', 'ICU',
    'briefing room', 'archive', 'dispatch center',
    'conference room', 'command post', 'examination room',
  ],

  action_transfer: [
    'reassigned', 'transferred', 'handed over', 'delegated',
    'passed', 'forwarded', 'redirected', 'reallocated',
    'entrusted', 'referred',
  ],

  action_communication: [
    'notified', 'briefed', 'informed', 'reported to',
    'consulted', 'advised', 'alerted', 'updated',
  ],

  temporal_marker: [
    'before the meeting', 'after the review', 'during the audit',
    'following the decision', 'prior to the announcement',
    'by the deadline', 'in the interim', 'at the last moment',
  ],
}
