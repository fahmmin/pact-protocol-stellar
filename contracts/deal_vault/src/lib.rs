#![no_std]
use campaign_oracle::CampaignOracleClient;
use soroban_sdk::{
    contract, contractimpl, contracttype, token::Client as TokenClient, Address, BytesN, Env,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DealStatus {
    Pending,
    Active,
    Delivered,
    Settled,
    Cancelled,
    Slashed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Deal {
    pub deal_id: u32,
    pub creator_agent_id: u32,
    pub brand_agent_id: u32,
    pub payment_usdc: i128,
    pub creator_stake: i128,
    pub brand_stake: i128,
    pub deadline: u64,
    pub status: DealStatus,
    pub deal_intent_hash: BytesN<32>,
    pub creator_wallet: Address,
    pub brand_wallet: Address,
}

#[contract]
pub struct DealVault;

#[contracttype]
pub enum DataKey {
    Deal(u32),
    NextDealId,
    UsdcToken,
    Oracle,
    Treasury,
    CampaignOracle,
    Paused,
    Initialized,
}

fn assert_not_paused(env: &Env) {
    let paused: bool = env
        .storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false);
    assert!(!paused, "contract is paused");
}

fn assert_before_deadline(env: &Env, deal: &Deal) {
    assert!(
        env.ledger().timestamp() <= deal.deadline,
        "deal deadline passed"
    );
}

#[contractimpl]
impl DealVault {
    pub fn initialize(
        env: Env,
        usdc: Address,
        oracle: Address,
        treasury: Address,
        campaign_oracle: Address,
    ) {
        assert!(
            !env.storage().instance().has(&DataKey::Initialized),
            "already initialized"
        );
        env.storage().instance().set(&DataKey::UsdcToken, &usdc);
        env.storage().instance().set(&DataKey::Oracle, &oracle);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage()
            .instance()
            .set(&DataKey::CampaignOracle, &campaign_oracle);
        env.storage().instance().set(&DataKey::NextDealId, &1u32);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn set_paused(env: Env, paused: bool) {
        let oracle: Address = env.storage().instance().get(&DataKey::Oracle).unwrap();
        oracle.require_auth();
        env.storage().instance().set(&DataKey::Paused, &paused);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    /// Both parties must sign to create a deal
    pub fn create_deal(
        env: Env,
        creator_id: u32,
        brand_id: u32,
        payment: i128,
        creator_stake: i128,
        brand_stake: i128,
        deadline: u64,
        creator: Address,
        brand: Address,
        intent_hash: BytesN<32>,
    ) -> u32 {
        assert_not_paused(&env);
        creator.require_auth();
        brand.require_auth();
        assert!(
            deadline > env.ledger().timestamp(),
            "deadline must be in the future"
        );

        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextDealId)
            .unwrap_or(1);

        let deal = Deal {
            deal_id: id,
            creator_agent_id: creator_id,
            brand_agent_id: brand_id,
            payment_usdc: payment,
            creator_stake,
            brand_stake,
            deadline,
            status: DealStatus::Pending,
            deal_intent_hash: intent_hash,
            creator_wallet: creator,
            brand_wallet: brand,
        };

        env.storage().persistent().set(&DataKey::Deal(id), &deal);
        env.storage().instance().set(&DataKey::NextDealId, &(id + 1));
        id
    }

    /// Cancel a pending deal before stakes are deposited (both parties sign)
    pub fn cancel_deal(env: Env, deal_id: u32) {
        assert_not_paused(&env);
        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id)).unwrap();
        assert!(deal.status == DealStatus::Pending, "only pending deals can be cancelled");
        deal.creator_wallet.require_auth();
        deal.brand_wallet.require_auth();
        deal.status = DealStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Deal(deal_id), &deal);
    }

    /// Both parties deposit their stakes; transitions deal to Active
    pub fn deposit_stakes(env: Env, deal_id: u32) {
        assert_not_paused(&env);
        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id)).unwrap();
        assert!(deal.status == DealStatus::Pending, "Deal not in Pending state");
        assert_before_deadline(&env, &deal);

        deal.brand_wallet.require_auth();
        deal.creator_wallet.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token = TokenClient::new(&env, &token_addr);

        token.transfer(
            &deal.brand_wallet,
            &env.current_contract_address(),
            &(deal.payment_usdc + deal.brand_stake),
        );
        token.transfer(
            &deal.creator_wallet,
            &env.current_contract_address(),
            &deal.creator_stake,
        );

        deal.status = DealStatus::Active;
        env.storage().persistent().set(&DataKey::Deal(deal_id), &deal);
    }

    /// Creator marks content as delivered
    pub fn submit_delivery(env: Env, deal_id: u32) {
        assert_not_paused(&env);
        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id)).unwrap();
        assert!(deal.status == DealStatus::Active, "Deal not Active");
        assert_before_deadline(&env, &deal);
        deal.creator_wallet.require_auth();
        deal.status = DealStatus::Delivered;
        env.storage().persistent().set(&DataKey::Deal(deal_id), &deal);
    }

    /// Oracle settles using CampaignOracle result (must be posted first)
    pub fn settle(env: Env, deal_id: u32) {
        assert_not_paused(&env);
        let oracle: Address = env.storage().instance().get(&DataKey::Oracle).unwrap();
        oracle.require_auth();

        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id)).unwrap();
        assert!(
            deal.status == DealStatus::Active || deal.status == DealStatus::Delivered,
            "Deal not Active/Delivered"
        );

        let campaign_oracle_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::CampaignOracle)
            .unwrap();
        let oracle_client = CampaignOracleClient::new(&env, &campaign_oracle_addr);
        assert!(oracle_client.has_result(&deal_id), "no oracle result for deal");
        let result = oracle_client.get_result(&deal_id);
        let success = result.success;
        let _eng_score = result.engagement_bps;

        Self::distribute_settlement(&env, &mut deal, success);
        deal.status = if success {
            DealStatus::Settled
        } else {
            DealStatus::Slashed
        };
        env.storage().persistent().set(&DataKey::Deal(deal_id), &deal);
    }

    /// Oracle settles after deadline when delivery was not submitted in time
    pub fn timeout_settle(env: Env, deal_id: u32) {
        assert_not_paused(&env);
        let oracle: Address = env.storage().instance().get(&DataKey::Oracle).unwrap();
        oracle.require_auth();

        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id)).unwrap();
        assert!(
            deal.status == DealStatus::Active,
            "timeout only for active deals"
        );
        assert!(
            env.ledger().timestamp() > deal.deadline,
            "deadline not yet passed"
        );

        Self::distribute_settlement(&env, &mut deal, false);
        deal.status = DealStatus::Slashed;
        env.storage().persistent().set(&DataKey::Deal(deal_id), &deal);
    }

    pub fn get_deal(env: Env, deal_id: u32) -> Deal {
        env.storage().persistent().get(&DataKey::Deal(deal_id)).unwrap()
    }

    fn distribute_settlement(env: &Env, deal: &Deal, success: bool) {
        let token_addr: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let token = TokenClient::new(env, &token_addr);
        let contract = env.current_contract_address();

        if success {
            token.transfer(
                &contract,
                &deal.creator_wallet,
                &(deal.payment_usdc + deal.creator_stake),
            );
            token.transfer(&contract, &deal.brand_wallet, &deal.brand_stake);
        } else {
            let slash_amount = deal.creator_stake * 20 / 100;
            let creator_return = deal.creator_stake - slash_amount;
            token.transfer(&contract, &deal.creator_wallet, &creator_return);
            token.transfer(
                &contract,
                &deal.brand_wallet,
                &(deal.payment_usdc + deal.brand_stake),
            );
            token.transfer(&contract, &treasury, &slash_amount);
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use campaign_oracle::{CampaignOracle, CampaignOracleClient};
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{token, BytesN, Env};

    fn create_token<'a>(env: &'a Env, admin: &'a Address) -> token::StellarAssetClient<'a> {
        let contract_address = env.register_stellar_asset_contract_v2(admin.clone());
        token::StellarAssetClient::new(env, &contract_address.address())
    }

    fn setup() -> (
        Env,
        Address,
        Address,
        Address,
        Address,
        Address,
        DealVaultClient<'static>,
        CampaignOracleClient<'static>,
    ) {
        let env = Env::default();
        env.mock_all_auths();

        let oracle = Address::generate(&env);
        let treasury = Address::generate(&env);
        let creator = Address::generate(&env);
        let brand = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token = create_token(&env, &token_admin);
        let usdc_address = token.address.clone();

        token.mint(&creator, &10_000_000);
        token.mint(&brand, &50_000_000);

        let oracle_contract_id = env.register_contract(None, CampaignOracle);
        let oracle_client = CampaignOracleClient::new(&env, &oracle_contract_id);
        oracle_client.initialize(&oracle);

        let contract_id = env.register_contract(None, DealVault);
        let client = DealVaultClient::new(&env, &contract_id);
        client.initialize(&usdc_address, &oracle, &treasury, &oracle_contract_id);

        (
            env,
            oracle,
            treasury,
            creator,
            brand,
            oracle_contract_id,
            client,
            oracle_client,
        )
    }

    fn dummy_hash(env: &Env) -> BytesN<32> {
        BytesN::from_array(env, &[1u8; 32])
    }

    #[test]
    fn test_create_deal() {
        let (env, _oracle, _treasury, creator, brand, _co, client, _oc) = setup();
        let deal_id = client.create_deal(
            &1u32,
            &2u32,
            &5_000_000,
            &1_000_000,
            &1_500_000,
            &9999999999u64,
            &creator,
            &brand,
            &dummy_hash(&env),
        );
        assert_eq!(deal_id, 1);
        let deal = client.get_deal(&deal_id);
        assert!(matches!(deal.status, DealStatus::Pending));
    }

    #[test]
    fn test_full_deal_lifecycle_success() {
        let (env, oracle, _treasury, creator, brand, _co, client, oracle_client) = setup();
        let deal_id = client.create_deal(
            &1u32,
            &2u32,
            &5_000_000,
            &1_000_000,
            &1_500_000,
            &9999999999u64,
            &creator,
            &brand,
            &dummy_hash(&env),
        );

        client.deposit_stakes(&deal_id);
        client.submit_delivery(&deal_id);
        oracle_client.post_result(&deal_id, &620u32, &1000000u64, &true);
        client.settle(&deal_id);

        let deal = client.get_deal(&deal_id);
        assert!(matches!(deal.status, DealStatus::Settled));
    }

    #[test]
    fn test_deal_lifecycle_failure_slash() {
        let (env, _oracle, _treasury, creator, brand, _co, client, oracle_client) = setup();
        let deal_id = client.create_deal(
            &1u32,
            &2u32,
            &5_000_000,
            &1_000_000,
            &1_500_000,
            &9999999999u64,
            &creator,
            &brand,
            &dummy_hash(&env),
        );
        client.deposit_stakes(&deal_id);
        oracle_client.post_result(&deal_id, &200u32, &1000000u64, &false);
        client.settle(&deal_id);
        let deal = client.get_deal(&deal_id);
        assert!(matches!(deal.status, DealStatus::Slashed));
    }

    #[test]
    fn test_cancel_pending_deal() {
        let (env, _oracle, _treasury, creator, brand, _co, client, _oc) = setup();
        let deal_id = client.create_deal(
            &1u32,
            &2u32,
            &1_000_000,
            &100_000,
            &150_000,
            &9999999999u64,
            &creator,
            &brand,
            &dummy_hash(&env),
        );
        client.cancel_deal(&deal_id);
        assert!(matches!(
            client.get_deal(&deal_id).status,
            DealStatus::Cancelled
        ));
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_cannot_reinitialize() {
        let (env, oracle, treasury, creator, brand, co, client, _oc) = setup();
        client.initialize(&creator, &oracle, &treasury, &co);
        let _ = (env, brand);
    }

    #[test]
    fn test_sequential_deal_ids() {
        let (env, _oracle, _treasury, creator, brand, _co, client, _oc) = setup();
        let id1 = client.create_deal(
            &1,
            &2,
            &1_000_000,
            &100_000,
            &150_000,
            &9999u64,
            &creator,
            &brand,
            &dummy_hash(&env),
        );
        let id2 = client.create_deal(
            &3,
            &4,
            &2_000_000,
            &200_000,
            &300_000,
            &9999u64,
            &creator,
            &brand,
            &dummy_hash(&env),
        );
        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
    }
}
