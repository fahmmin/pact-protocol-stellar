#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AgentType {
    Creator,
    Brand,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReputationTier {
    Bronze,
    Silver,
    Gold,
    Diamond,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AgentProfile {
    pub wallet: Address,
    pub agent_type: AgentType,
    pub handle: String,
    pub platform: String,
    pub metadata_uri: String,
    pub follower_count: u64,
    pub verified: bool,
    pub minted_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationScore {
    pub total_deals: u32,
    pub successful_deals: u32,
    pub avg_engagement_bps: u32,
    pub total_volume_usdc: i128,
    pub total_staked: i128,
    pub last_updated: u64,
    pub tier: ReputationTier,
}

#[contract]
pub struct AgentRegistry;

#[contracttype]
pub enum DataKey {
    Profile(u32),
    Score(u32),
    WalletToId(Address),
    NextId,
    Oracle,
    Paused,
    Initialized,
}

fn update_tier(score: &mut ReputationScore) {
    if score.total_deals == 0 {
        score.tier = ReputationTier::Bronze;
        return;
    }
    let success_rate = score.successful_deals * 100 / score.total_deals;
    if score.total_deals >= 50 && success_rate >= 90 {
        score.tier = ReputationTier::Diamond;
    } else if score.total_deals >= 20 && success_rate >= 80 {
        score.tier = ReputationTier::Gold;
    } else if score.total_deals >= 5 && success_rate >= 70 {
        score.tier = ReputationTier::Silver;
    } else {
        score.tier = ReputationTier::Bronze;
    }
}

#[contractimpl]
impl AgentRegistry {
    /// Initialize with oracle address that is allowed to write reputation scores
    pub fn initialize(env: Env, oracle: Address) {
        assert!(
            !env.storage().instance().has(&DataKey::Initialized),
            "already initialized"
        );
        env.storage().instance().set(&DataKey::Oracle, &oracle);
        env.storage().instance().set(&DataKey::NextId, &1u32);
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

    /// Oracle sets creator verification after manual social proof review
    pub fn set_creator_verified(env: Env, agent_id: u32, verified: bool) {
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        assert!(!paused, "contract is paused");

        let oracle: Address = env.storage().instance().get(&DataKey::Oracle).unwrap();
        oracle.require_auth();

        let mut profile: AgentProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Profile(agent_id))
            .unwrap();
        if profile.agent_type != AgentType::Creator {
            panic!("only creator agents can be verified");
        }
        profile.verified = verified;
        env.storage()
            .persistent()
            .set(&DataKey::Profile(agent_id), &profile);
    }

    /// Mint a creator agent profile
    pub fn mint_creator(
        env: Env,
        wallet: Address,
        handle: String,
        platform: String,
        metadata_uri: String,
        follower_count: u64,
    ) -> u32 {
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        assert!(!paused, "contract is paused");

        wallet.require_auth();
        if env
            .storage()
            .persistent()
            .has(&DataKey::WalletToId(wallet.clone()))
        {
            panic!("wallet already registered");
        }
        let id: u32 = env.storage().instance().get(&DataKey::NextId).unwrap_or(1);

        let profile = AgentProfile {
            wallet: wallet.clone(),
            agent_type: AgentType::Creator,
            handle,
            platform,
            metadata_uri,
            follower_count,
            verified: false,
            minted_at: env.ledger().timestamp(),
        };

        let initial_score = ReputationScore {
            total_deals: 0,
            successful_deals: 0,
            avg_engagement_bps: 0,
            total_volume_usdc: 0,
            total_staked: 0,
            last_updated: env.ledger().timestamp(),
            tier: ReputationTier::Bronze,
        };

        env.storage().persistent().set(&DataKey::Profile(id), &profile);
        env.storage().persistent().set(&DataKey::Score(id), &initial_score);
        env.storage().persistent().set(&DataKey::WalletToId(wallet), &id);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        id
    }

    /// Mint a brand agent profile
    pub fn mint_brand(env: Env, wallet: Address, brand_name: String, metadata_uri: String) -> u32 {
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        assert!(!paused, "contract is paused");

        wallet.require_auth();
        if env
            .storage()
            .persistent()
            .has(&DataKey::WalletToId(wallet.clone()))
        {
            panic!("wallet already registered");
        }
        let id: u32 = env.storage().instance().get(&DataKey::NextId).unwrap_or(1);

        let profile = AgentProfile {
            wallet: wallet.clone(),
            agent_type: AgentType::Brand,
            handle: brand_name,
            platform: String::from_str(&env, "brand"),
            metadata_uri,
            follower_count: 0,
            verified: true,
            minted_at: env.ledger().timestamp(),
        };

        let initial_score = ReputationScore {
            total_deals: 0,
            successful_deals: 0,
            avg_engagement_bps: 0,
            total_volume_usdc: 0,
            total_staked: 0,
            last_updated: env.ledger().timestamp(),
            tier: ReputationTier::Bronze,
        };

        env.storage().persistent().set(&DataKey::Profile(id), &profile);
        env.storage().persistent().set(&DataKey::Score(id), &initial_score);
        env.storage().persistent().set(&DataKey::WalletToId(wallet), &id);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        id
    }

    /// Called by oracle after settlement to update reputation score
    pub fn record_deal(
        env: Env,
        agent_id: u32,
        success: bool,
        engagement_bps: u32,
        volume_usdc: i128,
        staked_amount: i128,
    ) {
        let oracle: Address = env.storage().instance().get(&DataKey::Oracle).unwrap();
        oracle.require_auth();

        let mut score: ReputationScore = env
            .storage()
            .persistent()
            .get(&DataKey::Score(agent_id))
            .unwrap();
        score.total_deals += 1;
        if success {
            score.successful_deals += 1;
        }
        // Rolling average
        score.avg_engagement_bps =
            ((score.avg_engagement_bps * (score.total_deals - 1)) + engagement_bps)
                / score.total_deals;
        score.total_volume_usdc += volume_usdc;
        score.total_staked += staked_amount;
        score.last_updated = env.ledger().timestamp();

        update_tier(&mut score);
        env.storage().persistent().set(&DataKey::Score(agent_id), &score);
    }

    pub fn get_profile(env: Env, id: u32) -> AgentProfile {
        env.storage().persistent().get(&DataKey::Profile(id)).unwrap()
    }

    pub fn get_score(env: Env, id: u32) -> ReputationScore {
        env.storage().persistent().get(&DataKey::Score(id)).unwrap()
    }

    pub fn get_agent_id(env: Env, wallet: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::WalletToId(wallet))
            .unwrap()
    }

    /// Total minted agents (NextId - 1)
    pub fn agent_count(env: Env) -> u32 {
        let next: u32 = env.storage().instance().get(&DataKey::NextId).unwrap_or(1);
        next.saturating_sub(1)
    }

    /// Creator owner updates profile fields
    pub fn update_creator_profile(
        env: Env,
        agent_id: u32,
        wallet: Address,
        handle: String,
        platform: String,
        metadata_uri: String,
        follower_count: u64,
    ) {
        wallet.require_auth();
        let mut profile: AgentProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Profile(agent_id))
            .unwrap();
        if profile.wallet != wallet {
            panic!("not owner");
        }
        if profile.agent_type != AgentType::Creator {
            panic!("not a creator agent");
        }
        profile.handle = handle;
        profile.platform = platform;
        profile.metadata_uri = metadata_uri;
        profile.follower_count = follower_count;
        env.storage()
            .persistent()
            .set(&DataKey::Profile(agent_id), &profile);
    }

    /// Brand owner updates profile fields
    pub fn update_brand_profile(
        env: Env,
        agent_id: u32,
        wallet: Address,
        brand_name: String,
        metadata_uri: String,
    ) {
        wallet.require_auth();
        let mut profile: AgentProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Profile(agent_id))
            .unwrap();
        if profile.wallet != wallet {
            panic!("not owner");
        }
        if profile.agent_type != AgentType::Brand {
            panic!("not a brand agent");
        }
        profile.handle = brand_name;
        profile.metadata_uri = metadata_uri;
        env.storage()
            .persistent()
            .set(&DataKey::Profile(agent_id), &profile);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup() -> (Env, soroban_sdk::Address, AgentRegistryClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let oracle = Address::generate(&env);
        let contract_id = env.register_contract(None, AgentRegistry);
        let client = AgentRegistryClient::new(&env, &contract_id);
        client.initialize(&oracle);
        (env, oracle, client)
    }

    #[test]
    fn test_mint_creator_and_get_profile() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        let id = client.mint_creator(
            &wallet,
            &String::from_str(&env, "@fitfuture"),
            &String::from_str(&env, "instagram"),
            &String::from_str(&env, "ipfs://QmTestCreator"),
            &250_000,
        );
        assert_eq!(id, 1);
        let profile = client.get_profile(&id);
        assert_eq!(profile.handle, String::from_str(&env, "@fitfuture"));
        assert_eq!(profile.follower_count, 250_000);
        assert!(matches!(profile.agent_type, AgentType::Creator));
        assert!(!profile.verified);
    }

    #[test]
    fn test_mint_brand_and_get_profile() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        let id = client.mint_brand(
            &wallet,
            &String::from_str(&env, "NikeAir"),
            &String::from_str(&env, "ipfs://QmTestBrand"),
        );
        assert_eq!(id, 1);
        let profile = client.get_profile(&id);
        assert_eq!(profile.handle, String::from_str(&env, "NikeAir"));
        assert!(matches!(profile.agent_type, AgentType::Brand));
        assert!(profile.verified);
    }

    #[test]
    fn test_sequential_ids() {
        let (env, _oracle, client) = setup();
        let w1 = Address::generate(&env);
        let w2 = Address::generate(&env);
        let w3 = Address::generate(&env);
        let id1 = client.mint_creator(
            &w1,
            &String::from_str(&env, "@creator1"),
            &String::from_str(&env, "tiktok"),
            &String::from_str(&env, "ipfs://1"),
            &10_000,
        );
        let id2 = client.mint_brand(
            &w2,
            &String::from_str(&env, "Brand1"),
            &String::from_str(&env, "ipfs://2"),
        );
        let id3 = client.mint_creator(
            &w3,
            &String::from_str(&env, "@creator2"),
            &String::from_str(&env, "youtube"),
            &String::from_str(&env, "ipfs://3"),
            &180_000,
        );
        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
        assert_eq!(id3, 3);
    }

    #[test]
    fn test_record_deal_updates_reputation() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        let id = client.mint_creator(
            &wallet,
            &String::from_str(&env, "@techwave"),
            &String::from_str(&env, "youtube"),
            &String::from_str(&env, "ipfs://Qm"),
            &180_000,
        );

        // Initial score: Bronze, 0 deals
        let score = client.get_score(&id);
        assert_eq!(score.total_deals, 0);
        assert!(matches!(score.tier, ReputationTier::Bronze));

        // Record 5 successful deals to reach Silver
        for _ in 0..5 {
            client.record_deal(&id, &true, &520, &1000, &100);
        }

        let score = client.get_score(&id);
        assert_eq!(score.total_deals, 5);
        assert_eq!(score.successful_deals, 5);
        assert!(matches!(score.tier, ReputationTier::Silver));
    }

    #[test]
    fn test_get_agent_id_by_wallet() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        let id = client.mint_creator(
            &wallet,
            &String::from_str(&env, "@testhandle"),
            &String::from_str(&env, "x"),
            &String::from_str(&env, "ipfs://test"),
            &5000,
        );
        let looked_up_id = client.get_agent_id(&wallet);
        assert_eq!(looked_up_id, id);
    }

    #[test]
    fn test_update_creator_profile_owner_only() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        let id = client.mint_creator(
            &wallet,
            &String::from_str(&env, "@old"),
            &String::from_str(&env, "tiktok"),
            &String::from_str(&env, "ipfs://old"),
            &1000,
        );
        client.update_creator_profile(
            &id,
            &wallet,
            &String::from_str(&env, "@new"),
            &String::from_str(&env, "youtube"),
            &String::from_str(&env, "ipfs://new"),
            &99_000,
        );
        let profile = client.get_profile(&id);
        assert_eq!(profile.handle, String::from_str(&env, "@new"));
        assert_eq!(profile.platform, String::from_str(&env, "youtube"));
        assert_eq!(profile.follower_count, 99_000);
    }

    #[test]
    fn test_agent_count() {
        let (env, _oracle, client) = setup();
        assert_eq!(client.agent_count(), 0);
        let w1 = Address::generate(&env);
        let w2 = Address::generate(&env);
        client.mint_brand(&w1, &String::from_str(&env, "B1"), &String::from_str(&env, "ipfs://1"));
        client.mint_creator(
            &w2,
            &String::from_str(&env, "@c1"),
            &String::from_str(&env, "x"),
            &String::from_str(&env, "ipfs://2"),
            &500,
        );
        assert_eq!(client.agent_count(), 2);
    }

    #[test]
    fn test_tier_progression() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        let id = client.mint_creator(
            &wallet,
            &String::from_str(&env, "@bigcreator"),
            &String::from_str(&env, "instagram"),
            &String::from_str(&env, "ipfs://big"),
            &1_000_000,
        );

        // Bronze -> Silver: 5 deals, 70%+ success
        for _ in 0..5 { client.record_deal(&id, &true, &600, &5000, &500); }
        assert!(matches!(client.get_score(&id).tier, ReputationTier::Silver));

        // Silver -> Gold: 20 total, 80%+ success
        for _ in 0..15 { client.record_deal(&id, &true, &700, &5000, &500); }
        assert!(matches!(client.get_score(&id).tier, ReputationTier::Gold));

        // Gold -> Diamond: 50 total, 90%+ success
        for _ in 0..30 { client.record_deal(&id, &true, &800, &5000, &500); }
        let score = client.get_score(&id);
        assert_eq!(score.total_deals, 50);
        assert!(matches!(score.tier, ReputationTier::Diamond));
    }

    #[test]
    fn test_set_creator_verified() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        let id = client.mint_creator(
            &wallet,
            &String::from_str(&env, "@verifyme"),
            &String::from_str(&env, "instagram"),
            &String::from_str(&env, "ipfs://v"),
            &50_000,
        );
        assert!(!client.get_profile(&id).verified);
        client.set_creator_verified(&id, &true);
        assert!(client.get_profile(&id).verified);
    }

    #[test]
    #[should_panic(expected = "wallet already registered")]
    fn test_cannot_register_same_wallet_twice() {
        let (env, _oracle, client) = setup();
        let wallet = Address::generate(&env);
        client.mint_creator(
            &wallet,
            &String::from_str(&env, "@once"),
            &String::from_str(&env, "x"),
            &String::from_str(&env, "ipfs://once"),
            &10,
        );
        client.mint_brand(
            &wallet,
            &String::from_str(&env, "dup"),
            &String::from_str(&env, "ipfs://dup"),
        );
    }
}
