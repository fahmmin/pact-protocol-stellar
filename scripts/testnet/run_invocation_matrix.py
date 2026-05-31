#!/usr/bin/env python3
"""Execute testnet invocation matrix and persist transaction evidence."""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_JSON = REPO_ROOT / "ops" / "testnet" / "invocation-evidence.json"
OUTPUT_MD = REPO_ROOT / "ops" / "testnet" / "invocation-matrix.md"

RPC_URL = "https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"

CONTRACTS = {
    "agent_registry": "CBIORX6H6LNFVJZDDR5VRIK2SMS33F65NLAZXXUVIJCWDGQYFQBI3AMB",
    "validation_registry": "CCLSZGX22VETSIMFE27NXO4KOPLJOHRTRLGQTDJVBSX3IWRQCPIXSKWA",
    "campaign_oracle": "CANGGB2JIORNUTNWWMWCORYKHMYBO64BEC464RLX2WIDFTD772PAUE2E",
    "deal_vault": "CBYJ4ZCAUBOKLLGYE4JLHBUOGCHLB4IA56G6JQH2DF5E5UCZWEULUIDZ",
    "pact_market": "CCTXVX6LYNHPL2XJHNOTXKJ33IOY7BYLPMN7SHMV6X2YW7LBPYNG2I4E",
}


@dataclass(frozen=True)
class Invocation:
    contract_key: str
    function: str
    source: str
    send: str
    args: list[str]
    objective: str


INVOCATIONS = [
    Invocation(
        "agent_registry",
        "mint_brand",
        "alice",
        "yes",
        ["--wallet", "alice", "--brand_name", '"PlanBrand2"', "--metadata_uri", '"ipfs://plan-brand2"'],
        "Create a brand profile",
    ),
    Invocation(
        "agent_registry",
        "mint_creator",
        "deployer",
        "yes",
        [
            "--wallet",
            "deployer",
            "--handle",
            '"PlanCreator2"',
            "--platform",
            '"x"',
            "--metadata_uri",
            '"ipfs://plan-creator2"',
            "--follower_count",
            "43000",
        ],
        "Create a creator profile",
    ),
    Invocation(
        "agent_registry",
        "record_deal",
        "bootcamp_admin",
        "yes",
        [
            "--agent_id",
            "2",
            "--success",
            "true",
            "--engagement_bps",
            "640",
            "--volume_usdc",
            "1000000",
            "--staked_amount",
            "500000",
        ],
        "Update reputation from oracle signer",
    ),
    Invocation(
        "validation_registry",
        "post_artifact",
        "deployer",
        "yes",
        [
            "--deal_id",
            "77",
            "--artifact_type",
            "RiskCheckpoint",
            "--data_hash",
            "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            "--signer",
            "deployer",
            "--signature",
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        ],
        "Post a validation artifact",
    ),
    Invocation(
        "campaign_oracle",
        "post_result",
        "bootcamp_admin",
        "yes",
        [
            "--deal_id",
            "77",
            "--engagement_bps",
            "660",
            "--post_timestamp",
            "1713600000",
            "--success",
            "true",
        ],
        "Publish oracle settlement result",
    ),
    Invocation(
        "deal_vault",
        "create_deal",
        "deployer",
        "yes",
        [
            "--creator_id",
            "2",
            "--brand_id",
            "2",
            "--payment",
            "1000000",
            "--creator_stake",
            "200000",
            "--brand_stake",
            "300000",
            "--deadline",
            "1893456000",
            "--creator",
            "deployer",
            "--brand",
            "deployer",
            "--intent_hash",
            "4444444444444444444444444444444444444444444444444444444444444444",
        ],
        "Create deal record in escrow",
    ),
    Invocation(
        "deal_vault",
        "deposit_stakes",
        "deployer",
        "yes",
        ["--deal_id", "1"],
        "Move stakes/payment into vault",
    ),
    Invocation(
        "deal_vault",
        "submit_delivery",
        "deployer",
        "yes",
        ["--deal_id", "1"],
        "Mark creator delivery complete",
    ),
    Invocation(
        "deal_vault",
        "settle",
        "bootcamp_admin",
        "yes",
        ["--deal_id", "1"],
        "Settle funds using CampaignOracle result (post_result first)",
    ),
    Invocation(
        "pact_market",
        "create_market",
        "deployer",
        "yes",
        ["--deal_id", "88", "--initial_liquidity", "1000000"],
        "Create binary market",
    ),
    Invocation(
        "pact_market",
        "buy",
        "deployer",
        "yes",
        ["--buyer", "deployer", "--deal_id", "88", "--is_yes", "true", "--usdc_in", "100000"],
        "Buy YES position",
    ),
    Invocation(
        "pact_market",
        "settle_market",
        "bootcamp_admin",
        "yes",
        ["--deal_id", "88", "--outcome", "true"],
        "Finalize outcome",
    ),
    Invocation(
        "pact_market",
        "redeem",
        "deployer",
        "yes",
        ["--redeemer", "deployer", "--deal_id", "88"],
        "Redeem winning position",
    ),
    Invocation(
        "agent_registry",
        "initialize",
        "deployer",
        "no",
        ["--oracle", "bootcamp_admin"],
        "Initialize function smoke test (simulation only)",
    ),
    Invocation(
        "campaign_oracle",
        "initialize",
        "deployer",
        "no",
        ["--signer", "bootcamp_admin"],
        "Initialize function smoke test (simulation only)",
    ),
    Invocation(
        "deal_vault",
        "initialize",
        "deployer",
        "no",
        [
            "--usdc",
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
            "--oracle",
            "bootcamp_admin",
            "--treasury",
            "deployer",
        ],
        "Initialize function smoke test (simulation only)",
    ),
    Invocation(
        "pact_market",
        "initialize",
        "deployer",
        "no",
        [
            "--usdc",
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
            "--oracle",
            "bootcamp_admin",
        ],
        "Initialize function smoke test (simulation only)",
    ),
]


def run_invocation(inv: Invocation) -> dict[str, str | bool | None]:
    command = [
        "stellar",
        "contract",
        "invoke",
        "--id",
        CONTRACTS[inv.contract_key],
        "--source",
        inv.source,
        "--rpc-url",
        RPC_URL,
        "--network-passphrase",
        NETWORK_PASSPHRASE,
        "--send",
        inv.send,
        "--",
        inv.function,
        *inv.args,
    ]
    proc = subprocess.run(command, cwd=REPO_ROOT, text=True, capture_output=True)
    output = "\n".join([proc.stdout.strip(), proc.stderr.strip()]).strip()
    tx_match = re.search(r"/tx/([0-9a-f]{64})", output)
    return {
        "contract": inv.contract_key,
        "contract_id": CONTRACTS[inv.contract_key],
        "function": inv.function,
        "objective": inv.objective,
        "source": inv.source,
        "send_mode": inv.send,
        "command": " ".join(command),
        "ok": proc.returncode == 0,
        "tx_hash": tx_match.group(1) if tx_match else None,
        "explorer_tx_url": f"https://stellar.expert/explorer/testnet/tx/{tx_match.group(1)}" if tx_match else None,
        "output": output,
    }


def write_markdown(results: list[dict[str, str | bool | None]]) -> None:
    lines = [
        "# Testnet Invocation Matrix",
        "",
        f"- Generated at (UTC): {datetime.now(tz=timezone.utc).isoformat()}",
        f"- Success count: {sum(1 for r in results if r['ok'])}/{len(results)}",
        "",
        "| Contract | Function | Mode | Result | Tx Hash |",
        "|---|---|---|---|---|",
    ]
    for r in results:
        tx = r["tx_hash"] or "-"
        status = "PASS" if r["ok"] else "FAIL"
        lines.append(f"| {r['contract']} | `{r['function']}` | `{r['send_mode']}` | {status} | `{tx}` |")
    lines.append("")
    lines.append("## Failures")
    lines.append("")
    for r in results:
        if r["ok"]:
            continue
        lines.append(f"### {r['contract']}.{r['function']}")
        lines.append("```")
        lines.append(str(r["output"]))
        lines.append("```")
        lines.append("")
    OUTPUT_MD.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    results = [run_invocation(inv) for inv in INVOCATIONS]
    payload = {
        "generated_at_utc": datetime.now(tz=timezone.utc).isoformat(),
        "network": {
            "name": "testnet",
            "rpc_url": RPC_URL,
            "network_passphrase": NETWORK_PASSPHRASE,
        },
        "results": results,
    }
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    write_markdown(results)
    print(f"Wrote {OUTPUT_JSON}")
    print(f"Wrote {OUTPUT_MD}")


if __name__ == "__main__":
    main()
