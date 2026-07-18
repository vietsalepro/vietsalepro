# Chat Execution Baseline

**Document ID:** CHAT_EXECUTION_BASELINE.md  
**Program:** VietSalePro v7 — System Recovery Program  
**Document Type:** AI Operating Manual / Chat Handoff Baseline  
**Version:** 1.0  
**Date:** 2026-07-18  
**Status:** Active  
**Supplements:** `SYSTEM_RECOVERY_MASTER_PLAN.md`  

---

## 1. Purpose

This document is the **standard chat handoff baseline** for every new AI assistant conversation in this program.

### 1.1 Objectives

- Standardize how an AI assistant resumes program execution after a chat transition.
- Eliminate the need to re-explain the governance model in every new chat.
- Standardize how documents are read, how prompts are generated, how reviews are conducted, and how handoffs are written.
- Ensure continuity of governance, scope, and decision authority across chat sessions.

### 1.2 Scope

This manual applies to **all** AI-assisted work on the VietSalePro v7 System Recovery Program, regardless of active phase, milestone, or `CURRENT_TASK`.

### 1.3 Audience

- AI assistants entering a new chat session.
- Program Manager, Engineering Lead, and reviewers verifying chat-based execution continuity.

### 1.4 Relationship to the Master Plan

This document supplements `SYSTEM_RECOVERY_MASTER_PLAN.md`.

- The **Master Plan** defines the program mission, phase structure, recovery strategy, and exit criteria.
- **This document** defines the operational rules for continuing execution inside a chat session.
- This manual does **not** replace, modify, or override the Master Plan.
- If this manual ever conflicts with the Master Plan, the Master Plan governs program-level intent, and this manual governs chat-level execution mechanics.

---

## 2. Program Hierarchy

Every work unit sits inside one fixed hierarchy.

```text
Program
  └── Phase
        └── Milestone
              └── CURRENT_TASK
                    └── Implementation
```

| Level | Role | What It Authorizes |
|---|---|---|
| **Program** | The chartered recovery mission. | Existence of the program, recovery strategy, charter, and sponsor acceptance. |
| **Phase** | A major bounded stage with entry/exit gates. | Which major objectives are in flight and which quality gates apply. |
| **Milestone** | A measurable deliverable point within a phase. | A concrete acceptance condition that must be satisfied. |
| **CURRENT_TASK** | An operational work order that maps a milestone to executable work. | The specific scope, deliverables, stop conditions, and governance chain for one chat or implementation cycle. |
| **Implementation** | The actual engineering or documentation work. | File changes, evidence gathering, review artifacts, and deliverable production within the approved `CURRENT_TASK`. |

No level may be skipped. A `CURRENT_TASK` cannot exist outside a milestone. A milestone cannot exist outside a phase. A phase cannot exist outside the program.

---

## 3. CURRENT_TASK Governance Chain

The following chain is the **only** authority for opening and closing a `CURRENT_TASK`:

```text
Program Authorization
  └── Engineering Kickoff
        └── Implementation
              └── Acceptance Review
                    └── Program Status Review
                          └── Program Manager Formal Acceptance
```

This chain is mandatory and sequential. Each step must be completed before the next begins.

| Step | Authority | Purpose |
|---|---|---|
| **Program Authorization** | Program Manager / delegated engineering lead | Approve the `CURRENT_TASK`, milestone, deliverable, and predecessor closure. |
| **Engineering Kickoff** | Engineering lead / implementer | Define canonical-source strategy, scope lock, stop conditions, and implementation plan. |
| **Implementation** | Engineering team / implementer | Produce the deliverable and evidence. |
| **Acceptance Review** | Independent reviewer | Independently verify the deliverable against the acceptance condition. |
| **Program Status Review** | Program governance reviewer | Verify governance chain continuity, scope compliance, and readiness for formal acceptance. |
| **Program Manager Formal Acceptance** | Program Manager | Formally accept the deliverable, close the `CURRENT_TASK`, and declare the milestone complete. |

No `CURRENT_TASK` may be opened without Program Authorization. No `CURRENT_TASK` may be closed without Program Manager Formal Acceptance.

---

## 4. Authority Model

Authority is strictly hierarchical. Each level controls the level below it and reports to the level above.

| Level | Authority Over |
|---|---|
| **Program** | Phases, charter, recovery strategy, sponsor acceptance, scope boundaries. |
| **Phase** | Milestones, phase entry/exit gates, phase-level deliverables, phase constraints. |
| **Milestone** | `CURRENT_TASK`s, milestone acceptance conditions, gate readiness. |
| **CURRENT_TASK** | Implementation scope, deliverables, evidence, stop conditions, handoff content. |
| **Implementation** | Engineering tactics, file changes, tests, verification, deliverable production. |

A lower level may never override a higher level. An AI assistant operates at the **Implementation** level and may not assume authority belonging to the Program Manager, Milestone, Phase, or Program levels.

---

## 5. CURRENT_PHASE.md

`CURRENT_PHASE.md` is a **Phase Governance Artifact**.

- It marks the currently active phase and records phase-level entry/exit status.
- It is **not** a blocker for `CURRENT_TASK` execution.
- It is **not** a prerequisite for opening a `CURRENT_TASK`.
- It is **not** a substitute for `CURRENT_TASK` Program Authorization.

An AI assistant should read or update `CURRENT_PHASE.md` only when:

- A phase is being opened.
- A phase is being exited.
- A phase transition is being authorized.
- Program Authorization explicitly requests a phase-level update.

Unless one of these conditions applies, `CURRENT_PHASE.md` is reference-only and must not gate `CURRENT_TASK` work.

---

## 6. UNIFIED_PROGRAM_STATE.md

`UNIFIED_PROGRAM_STATE.md` is a **Program / Phase Governance Artifact**.

- It is the single authoritative statement of overall program status.
- It supersedes conflicting planning states.
- It is **not** a blocker for `CURRENT_TASK` execution.
- It is **not** a prerequisite for opening a `CURRENT_TASK`.

An AI assistant may reference `UNIFIED_PROGRAM_STATE.md` to confirm active phase, approved documents, and decision authority. It must not be used to delay or block an authorized `CURRENT_TASK`.

---

## 7. Prompt Generation Rules

Every prompt and implementation request must derive its baseline from the `CURRENT_TASK` Governance Chain:

1. `CURRENT_TASK` Program Authorization
2. `CURRENT_TASK` Engineering Kickoff
3. `CURRENT_TASK` Implementation
4. `CURRENT_TASK` Acceptance Review
5. `CURRENT_TASK` Program Status Review
6. `CURRENT_TASK` Program Manager Formal Acceptance

Reading `CURRENT_PHASE.md` or `UNIFIED_PROGRAM_STATE.md` is **not mandatory** before working on a `CURRENT_TASK`, unless the `CURRENT_TASK` Program Authorization explicitly requires it.

When generating or interpreting a prompt:

- Start from the authorized `CURRENT_TASK` document.
- Do not expand scope beyond the `CURRENT_TASK` Program Authorization.
- Do not infer new milestones, phases, or tasks unless explicitly authorized.
- If a prompt appears to contradict the `CURRENT_TASK` Governance Chain, stop and escalate.

---

## 8. Review Rules

Each review role has a distinct purpose. Roles must not be merged or confused.

| Review | Role | When Performed | Authority |
|---|---|---|---|
| **Implementation** | Produce the deliverable and self-verify against the kickoff. | During `CURRENT_TASK` execution. | Engineering team / implementer. |
| **Acceptance Review** | Independently evaluate the deliverable against the acceptance condition. | After implementation is complete. | Independent reviewer, not the implementer. |
| **Program Status Review** | Verify governance chain continuity, scope compliance, and readiness for formal acceptance. | After Acceptance Review. | Program governance reviewer. |
| **Program Manager Formal Acceptance** | Formally accept or reject the deliverable and close the `CURRENT_TASK`. | After Program Status Review. | Program Manager. |

An AI assistant must not act as the Program Manager. An AI assistant may perform implementation and may assist in drafting review evidence, but the final acceptance decision belongs to the Program Manager.

---

## 9. Scope Rules

An AI assistant must not perform any of the following without explicit authorization:

- Open a new `CURRENT_TASK`.
- Open a new Phase.
- Open a new Milestone.
- Perform remediation outside the `CURRENT_TASK` scope.
- Commit changes to the repository.
- Push changes to the repository.
- Modify `SYSTEM_RECOVERY_MASTER_PLAN.md`.
- Modify `CURRENT_PHASE.md` or `UNIFIED_PROGRAM_STATE.md` unless explicitly authorized.

If a prompt implicitly requests any of the above, the AI assistant must stop, state the restriction, and ask for the required authorization.

---

## 10. Conflict Resolution

If a conflict arises between the `CURRENT_TASK` Governance Chain and `CURRENT_PHASE.md` or `UNIFIED_PROGRAM_STATE.md`:

- The `CURRENT_TASK` Governance Chain is the authority for **executing the current `CURRENT_TASK`**.
- `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` are authorities at the **Phase / Program level**.
- Phase-level and program-level documents govern phase transitions, milestone boundaries, and overall program status.
- `CURRENT_TASK`-level documents govern the immediate work order.

A `CURRENT_TASK` that is fully authorized and inside scope may proceed even if `CURRENT_PHASE.md` or `UNIFIED_PROGRAM_STATE.md` have not yet been updated, provided the `CURRENT_TASK` does not require those documents to be modified.

---

## 11. Chat Startup Checklist

At the start of every new chat, the AI assistant must perform the following reads in order:

1. **Read `SYSTEM_RECOVERY_MASTER_PLAN.md`** — Understand program mission, strategy, phase structure, and constraints.
2. **Read `CHAT_EXECUTION_BASELINE.md`** — Understand this operating manual.
3. **Read the handoff from the previous chat** — If available, resume from the documented governance status and next step.
4. **Read the governance chain of the current `CURRENT_TASK`** — Include Program Authorization, Engineering Kickoff, Implementation, Acceptance Review, Program Status Review, and Program Manager Formal Acceptance as applicable.
5. **Continue the correct next governance step** — Do not restart the chain. Resume at the step documented as the current status.
6. **Verify the previous `CURRENT_TASK` is `FORMALLY CLOSED`** — Before opening `CURRENT_TASK+1`, confirm the predecessor `CURRENT_TASK` has reached Program Manager Formal Acceptance. If it is not formally closed, do not open a new task; escalate to the Program Manager.

If the previous chat handoff is missing, read the most recent `CURRENT_TASK-*` files in the working tree and reconstruct the governance status before proceeding.

---

## 12. Standard Handoff Structure

Every chat handoff must use the following minimum structure. Additional sections may be added if the `CURRENT_TASK` requires them.

| Section | Content |
|---|---|
| **Program** | VietSalePro v7 — System Recovery Program |
| **Phase** | Active phase name and status |
| **Milestone** | Current milestone and acceptance condition |
| **CURRENT_TASK** | Current `CURRENT_TASK` ID and title |
| **Governance Status** | Which governance step is complete and which step is next |
| **Deliverables** | Files produced or modified, with status |
| **Decisions** | Any decisions made during the chat |
| **Observations** | Non-blocking findings, warnings, or caveats |
| **Blockers** | Any issue preventing the next step |
| **Next Step** | The exact next action and who is responsible |
| **Baseline Documents** | List of canonical documents to read in the next chat |
| **Repository Restrictions** | Files or operations that must not be modified |
| **Execution Rules** | Any special stop conditions or scope reminders |

### 12.1 Mandatory Attachments

When a handoff is produced, it must explicitly attach or reference the following documents so the next chat can resume without re-explaining governance:

- `CHAT_EXECUTION_BASELINE.md`
- `SYSTEM_RECOVERY_MASTER_PLAN.md`
- The current `CURRENT_TASK` Governance Chain (Program Authorization, Engineering Kickoff, Implementation, Acceptance Review, Program Status Review, and Program Manager Formal Acceptance as applicable)

The handoff must be concise, factual, and actionable. It must not contain assumptions, guesses, or undocumented conclusions.

---

## 13. Execution Non-Negotiable Rules

The following rules are absolute for every AI assistant in this program:

1. **Do not guess when documents are missing.** If a required governance document is absent or ambiguous, stop and escalate.
2. **Do not bypass the `CURRENT_TASK` Governance Chain.** Every step must be completed in order.
3. **Do not open a new `CURRENT_TASK` on your own.** A `CURRENT_TASK` requires Program Authorization.
4. **Do not open a new Phase or Milestone on your own.** These require program-level authority.
5. **Do not modify `SYSTEM_RECOVERY_MASTER_PLAN.md` without a governance update.** The Master Plan is program-level authority.
6. **Do not perform remediation outside the `CURRENT_TASK` scope.** If a finding is outside scope, record it and escalate.
7. **Always prefer canonical documents.** When canonical sources and derived documents disagree, the canonical source wins.
8. **Do not commit or push without explicit authorization.** File changes remain local until authorized.
9. **Do not treat `CURRENT_PHASE.md` or `UNIFIED_PROGRAM_STATE.md` as blockers.** They are governance references, not `CURRENT_TASK` prerequisites.
10. **Document assumptions explicitly.** If a shortcut or simplification is intentional, mark it with a `ponytail:` comment that names the ceiling and the upgrade path.

---

## 14. Versioning

### 14.1 Version

- **Current Version:** 1.0
- **Effective Date:** 2026-07-18
- **Compatibility:** Compatible with `SYSTEM_RECOVERY_MASTER_PLAN.md` v1.0 and `UNIFIED_PROGRAM_STATE.md` v1.0.

### 14.2 Compatibility

- This manual is independent of any phase. It remains valid across Phase transitions.
- It does not modify the Master Plan, Phase definitions, or Milestone acceptance conditions.
- It may be referenced by any `CURRENT_TASK` Program Authorization as a baseline operating procedure.

### 14.3 Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-07-18 | Program Governance | Initial baseline for chat handoff and AI execution continuity. |

### 14.4 Future Updates

- Updates to this manual require Program Manager approval.
- Updates must preserve version compatibility with the Master Plan and the Unified Program State.
- A new version must include a revision history entry and must not retroactively alter closed `CURRENT_TASK` outcomes.
