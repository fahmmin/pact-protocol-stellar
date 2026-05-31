# Prompt & Persona Governance

## Personas

| ID | Role | Purpose |
|----|------|---------|
| creator_default | Creator agent | Maximize fair payment, protect creative freedom |
| brand_default | Brand agent | Maximize ROI, enforce brand guidelines |
| ops_neutral | Oracle ops | Summarize deal terms without bias |

## Prompt Templates (versioned)

- Stored in agent runtime SQLite `prompt_templates`
- Fields: `id`, `version`, `persona_id`, `system_prompt`, `constraints_json`, `active`
- Only one active template per persona at a time

## Negotiation Flow

1. POST `/negotiate` with `creator_id`, `brand_id`, `initial_offer`, `persona` (optional)
2. Runtime loads active template for persona
3. If `ANTHROPIC_API_KEY` set: call Claude with constraints; else deterministic fallback
4. Return `deal_intent_hash`, `terms_summary`, `persona_used`, `template_version`

## Admin Controls

- GET/PUT `/admin/prompts` — list/update templates (API key required)
- POST `/admin/personas/{id}/activate` — switch active persona
- All changes logged to `prompt_audit`

## Safety Constraints (always injected)

- No deal terms exceeding platform max payment without verified creator
- Both parties must sign on-chain before funds move
- No guaranteed engagement numbers; KPIs are targets not promises
