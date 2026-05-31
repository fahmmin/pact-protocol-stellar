"""Load canonical contract addresses from ops/testnet/deployment-manifest.json."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = REPO_ROOT / "ops" / "testnet" / "deployment-manifest.json"

ENV_TO_MANIFEST_KEY = {
    "AGENT_REGISTRY_CONTRACT_ID": "agent_registry",
    "VALIDATION_REGISTRY_CONTRACT_ID": "validation_registry",
    "CAMPAIGN_ORACLE_CONTRACT_ID": "campaign_oracle",
    "DEAL_VAULT_CONTRACT_ID": "deal_vault",
    "PACT_MARKET_CONTRACT_ID": "pact_market",
}


@dataclass(frozen=True)
class ContractAddresses:
    agent_registry: str
    validation_registry: str
    campaign_oracle: str
    deal_vault: str
    pact_market: str

    def get(self, name: str) -> str:
        return getattr(self, name.replace("-", "_"))


@dataclass(frozen=True)
class DeploymentManifest:
    network_name: str
    rpc_url: str
    network_passphrase: str
    contracts: ContractAddresses

    @classmethod
    def from_json(cls, data: dict) -> DeploymentManifest:
        by_name = {c["name"]: c["contract_id"] for c in data["contracts"]}
        network = data.get("network", {})
        return cls(
            network_name=network.get("name", "testnet"),
            rpc_url=network.get("rpc_url", ""),
            network_passphrase=network.get("network_passphrase", ""),
            contracts=ContractAddresses(
                agent_registry=by_name["agent_registry"],
                validation_registry=by_name["validation_registry"],
                campaign_oracle=by_name["campaign_oracle"],
                deal_vault=by_name["deal_vault"],
                pact_market=by_name["pact_market"],
            ),
        )


def load_manifest(path: Path | None = None) -> DeploymentManifest:
    manifest_path = path or Path(
        os.environ.get("PACT_DEPLOYMENT_MANIFEST", str(DEFAULT_MANIFEST))
    )
    if not manifest_path.is_file():
        raise FileNotFoundError(
            f"Deployment manifest not found: {manifest_path}. "
            "Set PACT_DEPLOYMENT_MANIFEST or deploy contracts first."
        )
    with manifest_path.open(encoding="utf-8") as f:
        return DeploymentManifest.from_json(json.load(f))


def load_contract_addresses(path: Path | None = None) -> ContractAddresses:
    """Resolve contract IDs: env vars override manifest values."""
    manifest = load_manifest(path)
    resolved = {
        "agent_registry": manifest.contracts.agent_registry,
        "validation_registry": manifest.contracts.validation_registry,
        "campaign_oracle": manifest.contracts.campaign_oracle,
        "deal_vault": manifest.contracts.deal_vault,
        "pact_market": manifest.contracts.pact_market,
    }
    for env_key, manifest_key in ENV_TO_MANIFEST_KEY.items():
        if os.environ.get(env_key):
            resolved[manifest_key] = os.environ[env_key]
    return ContractAddresses(**resolved)
