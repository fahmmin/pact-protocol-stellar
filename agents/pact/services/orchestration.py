"""Negotiation orchestration with versioned prompts, personas, and multi-turn sessions."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from pact.db import (
    add_negotiation_round,
    create_negotiation_session,
    get_active_prompt,
    get_negotiation_session,
    log_negotiation,
    update_negotiation_session,
)
from pact.integrations.llm import generate_terms_summary

logger = logging.getLogger("pact-agents.orchestration")

MAX_ROUNDS_DEFAULT = 4
UNVERIFIED_PAYMENT_CAP = 5_000_000  # 5 USDC in stroops (7 decimals)


def _fallback_terms(creator_id: str, brand_id: str, offer: int, persona: str) -> str:
    return (
        f"Deal between creator {creator_id} and brand {brand_id}. "
        f"Initial offer: {offer} stroops USDC. Persona: {persona}. "
        "Both parties must sign on-chain via DealVault."
    )


def build_deal_terms(
    creator_id: str,
    brand_id: str,
    payment_stroops: int,
    creator_stake_stroops: int,
    brand_stake_stroops: int,
    deadline_ts: int,
    kpi_threshold_bps: int = 500,
) -> dict[str, Any]:
    return {
        "creator_id": creator_id,
        "brand_id": brand_id,
        "payment_stroops": payment_stroops,
        "creator_stake_stroops": creator_stake_stroops,
        "brand_stake_stroops": brand_stake_stroops,
        "deadline_ts": deadline_ts,
        "kpi_threshold_bps": kpi_threshold_bps,
    }


def hash_deal_terms(terms: dict[str, Any]) -> str:
    """Stable SHA-256 hex digest aligned with Soroban BytesN<32>."""
    canonical = json.dumps(terms, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def terms_to_bytes32(hex_hash: str) -> bytes:
    h = hex_hash.removeprefix("0x")
    return bytes.fromhex(h.ljust(64, "0")[:64])


def validate_deal_terms(terms: dict[str, Any], creator_verified: bool = True) -> list[str]:
    errors: list[str] = []
    payment = int(terms.get("payment_stroops", 0))
    if payment <= 0:
        errors.append("payment_stroops must be positive")
    if not creator_verified and payment > UNVERIFIED_PAYMENT_CAP:
        errors.append(
            f"unverified creator payment cap exceeded ({UNVERIFIED_PAYMENT_CAP} stroops)"
        )
    if int(terms.get("kpi_threshold_bps", 500)) < 0:
        errors.append("kpi_threshold_bps must be non-negative")
    return errors


def _run_persona_turn(
    persona_id: str,
    creator_id: str,
    brand_id: str,
    terms: dict[str, Any],
    prior_messages: list[str],
) -> tuple[str, int | None]:
    template = get_active_prompt(persona_id)
    system_prompt = "Default Pact Protocol negotiation."
    template_version: int | None = None
    constraints: dict[str, Any] = {}

    if template:
        system_prompt = template["system_prompt"]
        constraints = json.loads(template["constraints_json"])
        template_version = template["version"]

    history = "\n".join(prior_messages[-6:]) if prior_messages else "No prior rounds."
    user_msg = (
        f"Creator ID: {creator_id}, Brand ID: {brand_id}. "
        f"Structured terms: {json.dumps(terms)}. "
        f"Constraints: {json.dumps(constraints)}. "
        f"Prior negotiation:\n{history}\n"
        "Respond with a concise counter-offer or acceptance summary (2-4 sentences)."
    )

    summary = generate_terms_summary(system_prompt, user_msg)
    if not summary:
        summary = _fallback_terms(
            creator_id, brand_id, int(terms.get("payment_stroops", 0)), persona_id
        )
    return summary, template_version


def run_negotiation(
    creator_id: str,
    brand_id: str,
    initial_offer: int,
    persona: str | None = None,
) -> dict[str, Any]:
    """Single-shot negotiation (legacy endpoint)."""
    persona_used = persona or "creator_default"
    template = get_active_prompt(persona_used)
    if not template and persona_used != "creator_default":
        persona_used = "creator_default"
        template = get_active_prompt(persona_used)

    constraints: dict[str, Any] = {}
    system_prompt = "Default Pact Protocol negotiation."
    template_version: int | None = None

    if template:
        system_prompt = template["system_prompt"]
        constraints = json.loads(template["constraints_json"])
        template_version = template["version"]

    terms = build_deal_terms(
        creator_id,
        brand_id,
        initial_offer,
        max(initial_offer // 5, 0),
        max(initial_offer // 4, 0),
        0,
    )
    deal_intent_hash = hash_deal_terms(terms)
    terms_summary = _fallback_terms(creator_id, brand_id, initial_offer, persona_used)

    user_msg = (
        f"Creator ID: {creator_id}, Brand ID: {brand_id}, "
        f"Initial offer (stroops): {initial_offer}. "
        f"Constraints: {json.dumps(constraints)}. "
        "Return a 2-sentence deal terms summary."
    )
    llm_summary = generate_terms_summary(system_prompt, user_msg)
    if llm_summary:
        terms_summary = llm_summary

    log_negotiation(
        creator_id,
        brand_id,
        persona_used,
        template_version,
        deal_intent_hash,
        terms_summary,
    )

    return {
        "status": "success",
        "deal_intent_hash": deal_intent_hash,
        "terms_summary": terms_summary,
        "deal_terms": terms,
        "persona_used": persona_used,
        "template_version": template_version,
        "constraints": constraints,
    }


def start_negotiation_session(
    creator_id: str,
    brand_id: str,
    payment_stroops: int,
    creator_stake_stroops: int,
    brand_stake_stroops: int,
    deadline_ts: int,
    kpi_threshold_bps: int = 500,
    match_proposal_id: int | None = None,
    max_rounds: int = MAX_ROUNDS_DEFAULT,
) -> dict[str, Any]:
    terms = build_deal_terms(
        creator_id,
        brand_id,
        payment_stroops,
        creator_stake_stroops,
        brand_stake_stroops,
        deadline_ts,
        kpi_threshold_bps,
    )
    errors = validate_deal_terms(terms, creator_verified=True)
    if errors:
        return {"status": "error", "errors": errors}

    deal_intent_hash = hash_deal_terms(terms)
    session = create_negotiation_session(
        creator_id=creator_id,
        brand_id=brand_id,
        deal_terms=terms,
        deal_intent_hash=deal_intent_hash,
        terms_summary="Session started.",
        max_rounds=max_rounds,
        match_proposal_id=match_proposal_id,
    )

    msg, _ = _run_persona_turn("creator_default", creator_id, brand_id, terms, [])
    add_negotiation_round(session["id"], 1, "creator_default", msg)
    update_negotiation_session(
        session["id"],
        terms_summary=msg,
        status="negotiating",
        rounds=1,
    )

    return {
        "status": "success",
        "session": get_negotiation_session(session["id"]),
    }


def advance_negotiation_session(session_id: int) -> dict[str, Any]:
    session = get_negotiation_session(session_id)
    if not session:
        return {"status": "error", "detail": "session not found"}

    if session["status"] not in ("negotiating", "pending_approval"):
        return {"status": "error", "detail": f"session status is {session['status']}"}

    rounds = int(session["rounds"])
    max_rounds = int(session["max_rounds"])
    if rounds >= max_rounds:
        update_negotiation_session(session_id, status="pending_approval")
        return {
            "status": "converged",
            "session": get_negotiation_session(session_id),
            "message": "Max rounds reached — awaiting human approval",
        }

    terms = json.loads(session["deal_terms_json"])
    prior = [r["message"] for r in session.get("rounds_history", [])]
    next_persona = "brand_default" if rounds % 2 == 1 else "creator_default"
    msg, _ = _run_persona_turn(
        next_persona,
        session["creator_id"],
        session["brand_id"],
        terms,
        prior,
    )
    new_round = rounds + 1
    add_negotiation_round(session_id, new_round, next_persona, msg)

    status = "pending_approval" if new_round >= max_rounds else "negotiating"
    update_negotiation_session(
        session_id,
        terms_summary=msg,
        status=status,
        rounds=new_round,
    )

    return {
        "status": "success",
        "session": get_negotiation_session(session_id),
    }


def approve_negotiation_session(
    session_id: int,
    party: str,
    approved: bool,
) -> dict[str, Any]:
    session = get_negotiation_session(session_id)
    if not session:
        return {"status": "error", "detail": "session not found"}

    if party not in ("creator", "brand"):
        return {"status": "error", "detail": "party must be creator or brand"}

    updates: dict[str, Any] = {}
    if party == "creator":
        updates["creator_approved"] = 1 if approved else 0
    else:
        updates["brand_approved"] = 1 if approved else 0

    if not approved:
        updates["status"] = "rejected"
        update_negotiation_session(session_id, **updates)
        return {"status": "rejected", "session": get_negotiation_session(session_id)}

    creator_ok = bool(session["creator_approved"]) if party != "creator" else approved
    brand_ok = bool(session["brand_approved"]) if party != "brand" else approved

    updates["status"] = "approved" if (creator_ok and brand_ok) else "pending_approval"
    update_negotiation_session(session_id, **updates)
    sess = get_negotiation_session(session_id)
    return {
        "status": "approved" if sess and sess["status"] == "approved" else "pending",
        "session": sess,
        "deal_intent_hash": sess["deal_intent_hash"] if sess else None,
    }
