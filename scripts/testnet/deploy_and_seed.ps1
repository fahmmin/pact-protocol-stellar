# Deploy all Pact contracts to Stellar testnet and seed 2 brands + 2 creators.
# Requires: stellar CLI, funded identities (auto-created if missing).

$ErrorActionPreference = "Stop"
$Network = "testnet"
$Rpc = "https://soroban-testnet.stellar.org"
$Passphrase = "Test SDF Network ; September 2015"
$Usdc = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Contracts = Join-Path $Root "contracts"

function Ensure-Identity($name) {
    $addr = stellar keys address $name 2>$null
    if (-not $addr) {
        Write-Host "Creating identity: $name"
        stellar keys generate $name --network $Network --fund
    }
    return (stellar keys address $name).Trim()
}

function Fund-IfNeeded($name) {
    $addr = (stellar keys address $name).Trim()
    try {
        $null = Invoke-RestMethod "https://horizon-testnet.stellar.org/accounts/$addr" -TimeoutSec 15
    } catch {
        Write-Host "Funding $name via Friendbot..."
        Invoke-RestMethod "https://friendbot.stellar.org?addr=$addr" | Out-Null
        Start-Sleep -Seconds 3
    }
}

Write-Host "Ensuring identities..."
$deployer = Ensure-Identity "deployer"
$oracle = Ensure-Identity "bootcamp_admin"
$brand1 = Ensure-Identity "pact_brand1"
$brand2 = Ensure-Identity "pact_brand2"
$creator1 = Ensure-Identity "pact_creator1"
$creator2 = Ensure-Identity "pact_creator2"

foreach ($id in @("deployer", "bootcamp_admin", "pact_brand1", "pact_brand2", "pact_creator1", "pact_creator2")) {
    Fund-IfNeeded $id
}

Write-Host "Building contracts..."
Push-Location $Contracts
stellar contract build
Pop-Location

function Deploy-Wasm($name, $wasmRel) {
    $wasm = Join-Path $Contracts $wasmRel
    $id = (stellar contract deploy --network $Network --source deployer --wasm $wasm).Trim()
    Write-Host "$name=$id"
    return $id
}

$AgentRegistry = Deploy-Wasm "agent_registry" "target/wasm32v1-none/release/agent_registry.wasm"
$ValidationRegistry = Deploy-Wasm "validation_registry" "target/wasm32v1-none/release/validation_registry.wasm"
$CampaignOracle = Deploy-Wasm "campaign_oracle" "target/wasm32v1-none/release/campaign_oracle.wasm"
$DealVault = Deploy-Wasm "deal_vault" "target/wasm32v1-none/release/deal_vault.wasm"
$PactMarket = Deploy-Wasm "pact_market" "target/wasm32v1-none/release/pact_market.wasm"

Write-Host "Initializing..."
stellar contract invoke --network $Network --source deployer --id $AgentRegistry -- initialize --oracle bootcamp_admin
stellar contract invoke --network $Network --source deployer --id $CampaignOracle -- initialize --signer bootcamp_admin
stellar contract invoke --network $Network --source deployer --id $DealVault -- initialize --usdc $Usdc --oracle bootcamp_admin --treasury deployer --campaign_oracle $CampaignOracle
stellar contract invoke --network $Network --source deployer --id $PactMarket -- initialize --usdc $Usdc --oracle bootcamp_admin

Write-Host "Seeding agents..."
stellar contract invoke --network $Network --source pact_brand1 --id $AgentRegistry --send yes -- mint_brand --wallet pact_brand1 --brand_name "NovaWear" --metadata_uri "ipfs://pact/brand1"
stellar contract invoke --network $Network --source pact_brand2 --id $AgentRegistry --send yes -- mint_brand --wallet pact_brand2 --brand_name "PulseDrink" --metadata_uri "ipfs://pact/brand2"
stellar contract invoke --network $Network --source pact_creator1 --id $AgentRegistry --send yes -- mint_creator --wallet pact_creator1 --handle "@fitwave" --platform "youtube" --metadata_uri "ipfs://pact/creator1" --follower_count 180000
stellar contract invoke --network $Network --source pact_creator2 --id $AgentRegistry --send yes -- mint_creator --wallet pact_creator2 --handle "@stylelab" --platform "instagram" --metadata_uri "ipfs://pact/creator2" --follower_count 92000

$count = (stellar contract invoke --network $Network --source deployer --id $AgentRegistry -- agent_count).Trim()
Write-Host "agent_count=$count"

$envFile = Join-Path $Root ".env"
$feFile = Join-Path $Root "frontend\.env.local"

function Update-EnvFile($path) {
    if (-not (Test-Path $path)) { return }
    $content = Get-Content $path -Raw
    $replacements = @{
        'AGENT_REGISTRY_CONTRACT_ID=.*' = "AGENT_REGISTRY_CONTRACT_ID=$AgentRegistry"
        'VALIDATION_REGISTRY_CONTRACT_ID=.*' = "VALIDATION_REGISTRY_CONTRACT_ID=$ValidationRegistry"
        'CAMPAIGN_ORACLE_CONTRACT_ID=.*' = "CAMPAIGN_ORACLE_CONTRACT_ID=$CampaignOracle"
        'DEAL_VAULT_CONTRACT_ID=.*' = "DEAL_VAULT_CONTRACT_ID=$DealVault"
        'PACT_MARKET_CONTRACT_ID=.*' = "PACT_MARKET_CONTRACT_ID=$PactMarket"
        'NEXT_PUBLIC_AGENT_REGISTRY=.*' = "NEXT_PUBLIC_AGENT_REGISTRY=$AgentRegistry"
        'NEXT_PUBLIC_VALIDATION_REGISTRY=.*' = "NEXT_PUBLIC_VALIDATION_REGISTRY=$ValidationRegistry"
        'NEXT_PUBLIC_CAMPAIGN_ORACLE=.*' = "NEXT_PUBLIC_CAMPAIGN_ORACLE=$CampaignOracle"
        'NEXT_PUBLIC_DEAL_VAULT=.*' = "NEXT_PUBLIC_DEAL_VAULT=$DealVault"
        'NEXT_PUBLIC_PACT_MARKET=.*' = "NEXT_PUBLIC_PACT_MARKET=$PactMarket"
    }
    foreach ($key in $replacements.Keys) {
        $content = $content -replace $key, $replacements[$key]
    }
    Set-Content -Path $path -Value $content.TrimEnd() -NoNewline
    Add-Content -Path $path -Value "`n"
}

Update-EnvFile $envFile
Update-EnvFile $feFile

Write-Host "`n=== Deployment complete ==="
Write-Host "NEXT_PUBLIC_AGENT_REGISTRY=$AgentRegistry"
Write-Host "Restart frontend (npm.cmd run dev) to pick up new addresses."
