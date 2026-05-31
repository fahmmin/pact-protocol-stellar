"""Oracle settlement helpers — returns on-chain action payloads for wallet signing."""

from __future__ import annotations

import time
from typing import Any


def verification_on_chain_action(agent_id: int, approved: bool) -> dict[str, Any]:
    """Describe the Soroban call needed after verification review."""
    if not approved:
        return {"required": False}
    return {
        "required": True,
        "contract": "AgentRegistry",
        "method": "set_creator_verified",
        "args": {
            "agent_id": agent_id,
            "verified": True,
        },
        "signer_role": "oracle",
        "note": "Oracle wallet must sign this transaction via Freighter.",
    }


def settlement_on_chain_actions(
    deal_id: int,
    engagement_bps: int,
    views: int,
    success: bool,
) -> dict[str, Any]:
    """Two-step settlement: post_result then settle."""
    post_timestamp = int(time.time())
    return {
        "steps": [
            {
                "order": 1,
                "contract": "CampaignOracle",
                "method": "post_result",
                "args": {
                    "deal_id": deal_id,
                    "engagement_bps": engagement_bps,
                    "post_timestamp": post_timestamp,
                    "success": success,
                },
                "signer_role": "oracle",
            },
            {
                "order": 2,
                "contract": "DealVault",
                "method": "settle",
                "args": {"deal_id": deal_id},
                "signer_role": "oracle",
                "note": "Call only after post_result succeeds.",
            },
        ],
        "views": views,
    }
