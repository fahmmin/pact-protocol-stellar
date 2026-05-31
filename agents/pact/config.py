"""Centralized configuration for the Pact agent runtime."""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from packages.config.manifest import ContractAddresses, load_contract_addresses, load_manifest


@dataclass(frozen=True)
class Settings:
    network: str
    rpc_url: str
    network_passphrase: str
    contracts: ContractAddresses
    agent_runtime_port: int
    cors_origins: list[str]
    oracle_api_key: str
    llm_provider: str
    indexer_max_deals: int
    daily_check_hour_utc: int
    default_kpi_threshold_bps: int
    pact_edition: str  # "oss" or "pro"

    @property
    def is_pro(self) -> bool:
        return self.pact_edition.lower() == "pro"


@lru_cache
def get_settings() -> Settings:
    manifest = load_manifest()
    contracts = load_contract_addresses()
    return Settings(
        network=os.environ.get("NETWORK", manifest.network_name),
        rpc_url=os.environ.get("SOROBAN_RPC_URL", manifest.rpc_url),
        network_passphrase=os.environ.get(
            "NETWORK_PASSPHRASE", manifest.network_passphrase
        ),
        contracts=contracts,
        agent_runtime_port=int(os.environ.get("AGENT_RUNTIME_PORT", "8000")),
        cors_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
        oracle_api_key=os.environ.get("ORACLE_API_KEY", ""),
        llm_provider=os.environ.get("LLM_PROVIDER", "gemini"),
        indexer_max_deals=int(os.environ.get("INDEXER_MAX_DEALS", "50")),
        daily_check_hour_utc=int(os.environ.get("DAILY_CHECK_HOUR_UTC", "0")),
        default_kpi_threshold_bps=int(os.environ.get("DEFAULT_KPI_THRESHOLD_BPS", "500")),
        pact_edition=os.environ.get("PACT_EDITION", "oss"),
    )
