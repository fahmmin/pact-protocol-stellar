const BASE = process.env.NEXT_PUBLIC_AGENT_RUNTIME_URL || 'http://localhost:8000';

async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Agent API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface NegotiationResult {
  status: string;
  deal_intent_hash: string;
  terms_summary: string;
  deal_terms?: Record<string, unknown>;
  persona_used: string;
  template_version: number | null;
}

export interface IndexedAgent {
  agent_id: number;
  wallet: string;
  agent_type: string;
  handle: string;
  platform: string;
  follower_count: number;
  verified: number;
  tier: number;
  avg_engagement_bps: number;
  total_deals: number;
}

export interface MatchProposal {
  id: number;
  brand_agent_id: number;
  creator_agent_id: number;
  score: number;
  rationale: string;
  status: string;
  created_at: number;
}

export interface NegotiationSession {
  id: number;
  creator_id: string;
  brand_id: string;
  status: string;
  deal_terms_json: string;
  deal_terms?: Record<string, unknown>;
  deal_intent_hash: string;
  terms_summary: string;
  rounds: number;
  max_rounds: number;
  creator_approved: number;
  brand_approved: number;
  match_proposal_id: number | null;
  rounds_history?: Array<{
    round_num: number;
    persona: string;
    message: string;
    created_at: number;
  }>;
}

export interface VerificationRequest {
  id: number;
  agent_id: number;
  wallet: string;
  platform: string;
  handle: string;
  proof_url: string;
  notes: string | null;
  status: string;
  reviewer_notes: string | null;
  created_at: number;
}

export interface OnChainAction {
  required?: boolean;
  contract?: string;
  method?: string;
  args?: Record<string, unknown>;
  signer_role?: string;
}

export interface DailyMetricCheck {
  id: number;
  deal_id: number;
  engagement_bps: number;
  likes: number;
  views: number;
  kpi_met: number;
  notes: string | null;
  checked_at: number;
}

export interface ComplianceAction {
  id: number;
  deal_id: number;
  level: string;
  actor: string;
  message: string;
  created_at: number;
}

export interface SettlementReadiness {
  deal_id: number;
  badge: 'Not Ready' | 'Under Review' | 'Ready';
  latest: DailyMetricCheck | null;
  threshold_bps?: number;
}

export async function negotiate(
  creatorId: string,
  brandId: string,
  initialOffer: number,
  persona?: string
): Promise<NegotiationResult> {
  return agentFetch('/negotiate', {
    method: 'POST',
    body: JSON.stringify({
      creator_id: creatorId,
      brand_id: brandId,
      initial_offer: initialOffer,
      persona,
    }),
  });
}

export async function startNegotiationSession(data: {
  creator_id: string;
  brand_id: string;
  payment_stroops: number;
  creator_stake_stroops: number;
  brand_stake_stroops: number;
  deadline_ts: number;
  kpi_threshold_bps?: number;
  match_proposal_id?: number;
}): Promise<{ status: string; session: NegotiationSession }> {
  return agentFetch('/negotiate/session', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getNegotiationSession(
  sessionId: number
): Promise<{ session: NegotiationSession }> {
  return agentFetch(`/negotiate/session/${sessionId}`);
}

export async function advanceNegotiationRound(
  sessionId: number
): Promise<{ status: string; session: NegotiationSession }> {
  return agentFetch(`/negotiate/session/${sessionId}/round`, { method: 'POST' });
}

export async function approveNegotiationTerms(
  sessionId: number,
  party: 'creator' | 'brand',
  approved: boolean
): Promise<{ status: string; session: NegotiationSession; deal_intent_hash?: string }> {
  return agentFetch(`/negotiate/session/${sessionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ party, approved }),
  });
}

export async function searchAgents(params: {
  agent_type?: string;
  platform?: string;
  verified_only?: boolean;
  min_followers?: number;
  limit?: number;
}): Promise<{ agents: IndexedAgent[] }> {
  const q = new URLSearchParams();
  if (params.agent_type) q.set('agent_type', params.agent_type);
  if (params.platform) q.set('platform', params.platform);
  if (params.verified_only) q.set('verified_only', 'true');
  if (params.min_followers != null) q.set('min_followers', String(params.min_followers));
  if (params.limit != null) q.set('limit', String(params.limit));
  return agentFetch(`/agents/search?${q.toString()}`);
}

export async function proposeMatches(data: {
  brand_agent_id: number;
  platform?: string;
  min_followers?: number;
  limit?: number;
}): Promise<{ proposals: MatchProposal[] }> {
  return agentFetch('/match/propose', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listMatchProposals(params?: {
  brand_agent_id?: number;
  creator_agent_id?: number;
  status?: string;
}): Promise<{ proposals: MatchProposal[] }> {
  const q = new URLSearchParams();
  if (params?.brand_agent_id != null) q.set('brand_agent_id', String(params.brand_agent_id));
  if (params?.creator_agent_id != null) q.set('creator_agent_id', String(params.creator_agent_id));
  if (params?.status) q.set('status', params.status);
  return agentFetch(`/match/proposals?${q.toString()}`);
}

export async function acceptMatch(proposalId: number): Promise<{ status: string; proposal: MatchProposal }> {
  return agentFetch(`/match/${proposalId}/accept`, { method: 'POST' });
}

export async function rejectMatch(proposalId: number): Promise<{ status: string; proposal: MatchProposal }> {
  return agentFetch(`/match/${proposalId}/reject`, { method: 'POST' });
}

export async function submitVerification(data: {
  agent_id: number;
  wallet: string;
  platform: string;
  handle: string;
  proof_url: string;
  notes?: string;
}): Promise<{ status: string; request: VerificationRequest }> {
  return agentFetch('/verification/submit', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Idempotency-Key': `verify-${data.agent_id}-${Date.now()}`,
    },
  });
}

export async function reviewVerification(
  requestId: number,
  apiKey: string,
  approved: boolean,
  reviewerNotes: string
): Promise<{ status: string; request: VerificationRequest; on_chain_action: OnChainAction }> {
  return agentFetch(`/verification/review/${requestId}`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: JSON.stringify({ approved, reviewer_notes: reviewerNotes }),
  });
}

export async function submitSettlementReview(
  apiKey: string,
  data: {
    deal_id: number;
    engagement_bps: number;
    likes?: number;
    views?: number;
    success: boolean;
    reviewer_notes?: string;
  }
): Promise<{
  review: Record<string, unknown>;
  on_chain_actions: { steps: Array<Record<string, unknown>> };
}> {
  return agentFetch('/oracle/settlement/review', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: JSON.stringify(data),
  });
}

export async function getVerificationStatus(agentId: number): Promise<{
  agent_id: number;
  latest_request: VerificationRequest | null;
}> {
  return agentFetch(`/verification/status/${agentId}`);
}

export async function getDealMetrics(dealId: number): Promise<{
  deal_id: number;
  daily_checks: DailyMetricCheck[];
  compliance_actions: ComplianceAction[];
  settlement_readiness: SettlementReadiness;
}> {
  return agentFetch(`/deals/${dealId}/metrics`);
}

export async function logProfileAudit(data: {
  agent_id: number;
  field: string;
  old_value: string;
  new_value: string;
}): Promise<void> {
  await agentFetch('/profile/audit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProfileAudit(agentId: number): Promise<{
  audit: Array<{
    id: number;
    agent_id: number;
    field: string;
    old_value: string;
    new_value: string;
    created_at: number;
  }>;
}> {
  return agentFetch(`/profile/audit/${agentId}`);
}

export async function listPrompts(apiKey: string): Promise<{
  prompts: Array<{
    id: string;
    version: number;
    persona_id: string;
    system_prompt: string;
    active: number;
  }>;
}> {
  return agentFetch('/admin/prompts', {
    headers: { 'X-API-Key': apiKey },
  });
}

export async function syncIndexer(apiKey: string): Promise<Record<string, number>> {
  return agentFetch('/indexer/sync', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
  });
}
