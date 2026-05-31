#!/usr/bin/env bash
set -euo pipefail

# Reproducible deployment workflow for Stellar testnet.
# Requires configured `deployer` and `bootcamp_admin` identities in Stellar CLI.

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
USDC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
ORACLE="$(stellar keys address bootcamp_admin)"
TREASURY="$(stellar keys address deployer)"

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CONTRACTS_DIR="$ROOT_DIR/contracts"

echo "Building contracts..."
cd "$CONTRACTS_DIR"
stellar contract build

deploy_contract() {
  local name="$1"
  local wasm="$2"
  local deployed
  deployed="$(stellar contract deploy --network "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" --source deployer --wasm "$wasm")"
  echo "$name=$deployed"
}

echo "Deploying contracts..."
AGENT_REGISTRY_ID="$(deploy_contract "agent_registry" "target/wasm32v1-none/release/agent_registry.wasm" | cut -d= -f2)"
VALIDATION_REGISTRY_ID="$(deploy_contract "validation_registry" "target/wasm32v1-none/release/validation_registry.wasm" | cut -d= -f2)"
CAMPAIGN_ORACLE_ID="$(deploy_contract "campaign_oracle" "target/wasm32v1-none/release/campaign_oracle.wasm" | cut -d= -f2)"
DEAL_VAULT_ID="$(deploy_contract "deal_vault" "target/wasm32v1-none/release/deal_vault.wasm" | cut -d= -f2)"
PACT_MARKET_ID="$(deploy_contract "pact_market" "target/wasm32v1-none/release/pact_market.wasm" | cut -d= -f2)"

echo "Initializing contracts..."
stellar contract invoke --network "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" --source deployer --id "$AGENT_REGISTRY_ID" -- initialize --oracle "$ORACLE"
stellar contract invoke --network "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" --source deployer --id "$CAMPAIGN_ORACLE_ID" -- initialize --signer "$ORACLE"
stellar contract invoke --network "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" --source deployer --id "$DEAL_VAULT_ID" -- initialize --usdc "$USDC" --oracle "$ORACLE" --treasury "$TREASURY" --campaign_oracle "$CAMPAIGN_ORACLE_ID"
stellar contract invoke --network "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" --source deployer --id "$PACT_MARKET_ID" -- initialize --usdc "$USDC" --oracle "$ORACLE"

echo "Deployment summary:"
echo "NEXT_PUBLIC_AGENT_REGISTRY=$AGENT_REGISTRY_ID"
echo "NEXT_PUBLIC_VALIDATION_REGISTRY=$VALIDATION_REGISTRY_ID"
echo "NEXT_PUBLIC_CAMPAIGN_ORACLE=$CAMPAIGN_ORACLE_ID"
echo "NEXT_PUBLIC_DEAL_VAULT=$DEAL_VAULT_ID"
echo "NEXT_PUBLIC_PACT_MARKET=$PACT_MARKET_ID"
