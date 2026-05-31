"""Database layer — re-exports all repositories."""

from pact.db.connection import DB_PATH, get_conn, init_db
from pact.db.repositories.indexing import (
    get_indexed_deals_for_agent,
    list_indexed_deals,
    search_indexed_agents,
    upsert_indexed_agent,
    upsert_indexed_deal,
)
from pact.db.repositories.matching import (
    create_match_proposal,
    get_match_proposal,
    list_match_proposals,
    update_match_proposal_status,
)
from pact.db.repositories.negotiation import (
    add_negotiation_round,
    create_negotiation_session,
    get_negotiation_session,
    log_negotiation,
    update_negotiation_session,
)
from pact.db.repositories.prompts import get_active_prompt, list_prompts, upsert_prompt
from pact.db.repositories.settlement import (
    create_settlement_review,
    get_settlement_readiness,
    list_settlement_reviews,
)
from pact.db.repositories.verification import (
    add_compliance_action,
    get_compliance_actions,
    get_daily_checks,
    get_profile_audit,
    list_verification_requests,
    log_profile_change,
    record_daily_check,
    review_verification,
    submit_verification,
)

__all__ = [
    "DB_PATH",
    "get_conn",
    "init_db",
    "submit_verification",
    "list_verification_requests",
    "review_verification",
    "record_daily_check",
    "get_daily_checks",
    "add_compliance_action",
    "get_compliance_actions",
    "get_active_prompt",
    "list_prompts",
    "upsert_prompt",
    "log_negotiation",
    "log_profile_change",
    "get_profile_audit",
    "upsert_indexed_agent",
    "upsert_indexed_deal",
    "search_indexed_agents",
    "get_indexed_deals_for_agent",
    "list_indexed_deals",
    "create_match_proposal",
    "get_match_proposal",
    "list_match_proposals",
    "update_match_proposal_status",
    "create_negotiation_session",
    "get_negotiation_session",
    "update_negotiation_session",
    "add_negotiation_round",
    "create_settlement_review",
    "list_settlement_reviews",
    "get_settlement_readiness",
]
