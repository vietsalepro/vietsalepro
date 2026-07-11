## ADDED Requirements

### Requirement: Bật strict + fix core services/types

The system MUST complete the implementation for: bật `strict: true` trong `tsconfig.json`, fix lỗi trong `services/`, `types.ts`, `utils/`, `hooks/`..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** `npm run lint` pass
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** `npm run build` pass
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
