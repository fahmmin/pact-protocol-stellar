# Deploy to Testnet

For the canonical procedure, use the operations runbook:

**[docs/operations/testnet-runbook.md](../operations/testnet-runbook.md)**

## Quick reference

```bash
cd contracts
stellar contract build

# Full deploy script
bash ../scripts/testnet/deploy_all.sh

# Generate manifest
python ../scripts/testnet/generate_deployment_manifest.py
```

After deploy, update `.env` and `frontend/.env.local` with new contract IDs.

Verify WASM hashes in [ops/testnet/deployment-manifest.json](../../ops/testnet/deployment-manifest.json).

## Invocation matrix

Post-deploy verification:

```bash
python scripts/testnet/run_invocation_matrix.py
```

Results: [ops/testnet/invocation-matrix.md](../../ops/testnet/invocation-matrix.md)
