"""Pydantic request/response schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class NegotiationRequest(BaseModel):
    creator_id: str
    brand_id: str
    initial_offer: int
    persona: str | None = None


class VerificationSubmit(BaseModel):
    agent_id: int
    wallet: str
    platform: str
    handle: str
    proof_url: str
    notes: str | None = None


class VerificationReview(BaseModel):
    approved: bool
    reviewer_notes: str = ""


class ComplianceAction(BaseModel):
    deal_id: int
    level: str = Field(pattern="^(warning|remediation|escalation)$")
    actor: str
    message: str


class DailyCheckItem(BaseModel):
    deal_id: int
    engagement_bps: int = 0
    likes: int = 0
    views: int = 0
    kpi_threshold_bps: int | None = None
    notes: str | None = None


class DailyCheckBatch(BaseModel):
    deals: list[DailyCheckItem]


class PromptUpsert(BaseModel):
    template_id: str
    persona_id: str
    system_prompt: str
    constraints: dict[str, Any] = Field(default_factory=dict)
    activate: bool = True


class ProfileAuditLog(BaseModel):
    agent_id: int
    field: str
    old_value: str
    new_value: str


class MatchProposeRequest(BaseModel):
    brand_agent_id: int
    platform: str | None = None
    min_followers: int | None = None
    limit: int = 5


class NegotiationSessionStart(BaseModel):
    creator_id: str
    brand_id: str
    payment_stroops: int
    creator_stake_stroops: int
    brand_stake_stroops: int
    deadline_ts: int
    kpi_threshold_bps: int = 500
    match_proposal_id: int | None = None
    max_rounds: int = 4


class NegotiationApprove(BaseModel):
    party: str = Field(pattern="^(creator|brand)$")
    approved: bool = True


class SettlementReviewRequest(BaseModel):
    deal_id: int
    engagement_bps: int
    likes: int = 0
    views: int = 0
    success: bool
    reviewer_notes: str = ""
