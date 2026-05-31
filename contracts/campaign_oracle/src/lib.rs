#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contract]
pub struct CampaignOracle;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OracleResult {
    pub deal_id: u32,
    pub engagement_bps: u32,
    pub post_timestamp: u64,
    pub settled_at: u64,
    pub success: bool,
}

#[contracttype]
pub enum DataKey {
    OracleSigner,
    Result(u32),
    Paused,
    Initialized,
}

#[contractimpl]
impl CampaignOracle {
    pub fn initialize(env: Env, signer: Address) {
        assert!(
            !env.storage().instance().has(&DataKey::Initialized),
            "already initialized"
        );
        env.storage().instance().set(&DataKey::OracleSigner, &signer);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn set_paused(env: Env, paused: bool) {
        let signer: Address = env.storage().instance().get(&DataKey::OracleSigner).unwrap();
        signer.require_auth();
        env.storage().instance().set(&DataKey::Paused, &paused);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    /// Post oracle settlement result. Only oracle signer; one-shot per deal.
    pub fn post_result(
        env: Env,
        deal_id: u32,
        engagement_bps: u32,
        post_timestamp: u64,
        success: bool,
    ) {
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        assert!(!paused, "contract is paused");

        let signer: Address = env.storage().instance().get(&DataKey::OracleSigner).unwrap();
        signer.require_auth();

        assert!(
            !env.storage().persistent().has(&DataKey::Result(deal_id)),
            "result already posted"
        );

        let res = OracleResult {
            deal_id,
            engagement_bps,
            post_timestamp,
            settled_at: env.ledger().timestamp(),
            success,
        };
        env.storage().persistent().set(&DataKey::Result(deal_id), &res);
    }

    pub fn get_result(env: Env, deal_id: u32) -> OracleResult {
        env.storage().persistent().get(&DataKey::Result(deal_id)).unwrap()
    }

    pub fn has_result(env: Env, deal_id: u32) -> bool {
        env.storage().persistent().has(&DataKey::Result(deal_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, Address, CampaignOracleClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let signer = Address::generate(&env);
        let contract = env.register_contract(None, CampaignOracle);
        let client = CampaignOracleClient::new(&env, &contract);
        client.initialize(&signer);
        (env, signer, client)
    }

    #[test]
    fn test_post_and_get_result_success() {
        let (_env, _signer, client) = setup();
        client.post_result(&1u32, &620u32, &1000000u64, &true);
        assert!(client.has_result(&1u32));
        let result = client.get_result(&1u32);
        assert_eq!(result.deal_id, 1);
        assert_eq!(result.engagement_bps, 620);
        assert!(result.success);
    }

    #[test]
    fn test_post_result_failure() {
        let (_env, _signer, client) = setup();
        client.post_result(&5u32, &200u32, &1000000u64, &false);
        let result = client.get_result(&5u32);
        assert!(!result.success);
    }

    #[test]
    fn test_no_result_before_posting() {
        let (_env, _signer, client) = setup();
        assert!(!client.has_result(&99u32));
    }

    #[test]
    #[should_panic(expected = "result already posted")]
    fn test_cannot_overwrite_result() {
        let (_env, _signer, client) = setup();
        client.post_result(&1u32, &620u32, &1000u64, &true);
        client.post_result(&1u32, &100u32, &2000u64, &false);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_cannot_reinitialize() {
        let (env, signer, client) = setup();
        client.initialize(&signer);
        let _ = env;
    }
}
