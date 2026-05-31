# Soroban Contract Reference

Public functions per contract (testnet deployment). See source in `contracts/*/src/lib.rs`.

## AgentRegistry

| Function | Description |
|----------|-------------|
| `initialize(oracle)` | One-time setup |
| `mint_creator(...)` | Register creator agent |
| `mint_brand(...)` | Register brand agent |
| `set_creator_verified(agent_id, verified)` | Oracle verification |
| `update_creator_profile` / `update_brand_profile` | Profile updates |
| `record_deal(...)` | Oracle-only deal outcome |
| `get_profile(agent_id)` | Read profile |
| `get_score(agent_id)` | Reputation score |
| `agent_count()` | Total agents |

## ValidationRegistry

| Function | Description |
|----------|-------------|
| `post_artifact(...)` | Log deal intent / proof |
| `get_deal_artifacts(deal_id)` | List artifacts |
| `get_artifact(artifact_id)` | Single artifact |

## DealVault

| Function | Description |
|----------|-------------|
| `initialize(...)` | USDC, oracle, treasury |
| `create_deal(...)` | Dual-signed deal creation |
| `deposit_stakes(deal_id)` | Lock stakes |
| `submit_delivery(deal_id)` | Creator delivery signal |
| `settle(deal_id)` | Oracle-settled payout |
| `cancel_deal` / `timeout_settle` | Exit paths |
| `get_deal(deal_id)` | Read deal state |

## CampaignOracle

| Function | Description |
|----------|-------------|
| `initialize(signer)` | Authorized signer |
| `post_result(deal_id, ...)` | Post metric outcome |
| `get_result(deal_id)` | Read result |
| `has_result(deal_id)` | Boolean check |

## PactMarket

| Function | Description |
|----------|-------------|
| `initialize(usdc, oracle)` | Setup |
| `create_market(deal_id, liquidity)` | Open market |
| `buy(buyer, deal_id, is_yes, usdc_in)` | Trade tokens |
| `get_yes_price(deal_id)` | Current YES price |
| `settle_market(deal_id, outcome)` | Resolve market |
| `redeem(redeemer, deal_id)` | Claim winnings |
| `get_market(deal_id)` | Market state |

## Invoke example

```bash
stellar contract invoke \
  --id $DEAL_VAULT_CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- get_deal --deal-id 1
```
