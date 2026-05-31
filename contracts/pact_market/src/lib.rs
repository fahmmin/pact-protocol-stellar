#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token::Client as TokenClient, Address, Env,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Market {
    pub deal_id: u32,
    pub yes_reserve: i128,
    pub no_reserve: i128,
    pub total_liquidity: i128,
    pub settled: bool,
    pub outcome: bool,
    pub created_at: u64,
}

#[contract]
pub struct PactMarket;

#[contracttype]
pub enum DataKey {
    Market(u32),
    UsdcToken,
    Oracle,
    /// Tracks how many YES tokens a buyer holds for a given deal
    YesBalance(u32, Address),
    /// Tracks how many NO tokens a buyer holds for a given deal
    NoBalance(u32, Address),
}

#[contractimpl]
impl PactMarket {
    pub fn initialize(env: Env, usdc: Address, oracle: Address) {
        env.storage().instance().set(&DataKey::UsdcToken, &usdc);
        env.storage().instance().set(&DataKey::Oracle, &oracle);
    }

    /// Create a prediction market for a given deal with initial liquidity seeded equally
    pub fn create_market(env: Env, deal_id: u32, initial_liquidity: i128) {
        assert!(initial_liquidity > 0, "Initial liquidity must be positive");
        let m = Market {
            deal_id,
            yes_reserve: initial_liquidity / 2,
            no_reserve: initial_liquidity / 2,
            total_liquidity: initial_liquidity,
            settled: false,
            outcome: false,
            created_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Market(deal_id), &m);
    }

    /// Returns YES price in thousandths (500 = 50%)
    pub fn get_yes_price(env: Env, deal_id: u32) -> i128 {
        let market: Market = env.storage().persistent().get(&DataKey::Market(deal_id)).unwrap();
        let total = market.yes_reserve + market.no_reserve;
        if total > 0 {
            market.no_reserve * 1000 / total
        } else {
            500
        }
    }

    /// Buy YES or NO tokens using USDC. Returns number of tokens received.
    pub fn buy(env: Env, buyer: Address, deal_id: u32, is_yes: bool, usdc_in: i128) -> i128 {
        buyer.require_auth();
        assert!(usdc_in > 0, "Must invest positive amount");

        let mut market: Market = env.storage().persistent().get(&DataKey::Market(deal_id)).unwrap();
        assert!(!market.settled, "Market already settled");

        let token_addr: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token = TokenClient::new(&env, &token_addr);
        token.transfer(&buyer, &env.current_contract_address(), &usdc_in);

        // 0.5% fee
        let fee = usdc_in * 50 / 10_000;
        let amount_after_fee = usdc_in - fee;

        let tokens_out = if is_yes {
            // AMM: buy YES
            let out = market.yes_reserve * amount_after_fee / (market.no_reserve + amount_after_fee);
            market.no_reserve += amount_after_fee;
            market.yes_reserve -= out;
            out
        } else {
            // AMM: buy NO
            let out = market.no_reserve * amount_after_fee / (market.yes_reserve + amount_after_fee);
            market.yes_reserve += amount_after_fee;
            market.no_reserve -= out;
            out
        };

        market.total_liquidity += amount_after_fee;
        env.storage().persistent().set(&DataKey::Market(deal_id), &market);

        // Track positions for redemption
        if is_yes {
            let key = DataKey::YesBalance(deal_id, buyer.clone());
            let existing: i128 = env.storage().persistent().get(&key).unwrap_or(0);
            env.storage().persistent().set(&key, &(existing + tokens_out));
        } else {
            let key = DataKey::NoBalance(deal_id, buyer.clone());
            let existing: i128 = env.storage().persistent().get(&key).unwrap_or(0);
            env.storage().persistent().set(&key, &(existing + tokens_out));
        }

        tokens_out
    }

    /// Oracle settles the market with the campaign outcome
    pub fn settle_market(env: Env, deal_id: u32, outcome: bool) {
        let oracle: Address = env.storage().instance().get(&DataKey::Oracle).unwrap();
        oracle.require_auth();

        let mut market: Market = env
            .storage()
            .persistent()
            .get(&DataKey::Market(deal_id))
            .unwrap();
        assert!(!market.settled, "Already settled");
        market.settled = true;
        market.outcome = outcome;
        env.storage().persistent().set(&DataKey::Market(deal_id), &market);
    }

    /// Redeem winning position tokens for USDC
    pub fn redeem(env: Env, redeemer: Address, deal_id: u32) -> i128 {
        redeemer.require_auth();
        let market: Market = env
            .storage()
            .persistent()
            .get(&DataKey::Market(deal_id))
            .unwrap();
        assert!(market.settled, "Market not yet settled");

        let tokens_held = if market.outcome {
            let key = DataKey::YesBalance(deal_id, redeemer.clone());
            let amt: i128 = env.storage().persistent().get(&key).unwrap_or(0);
            env.storage().persistent().set(&key, &0i128);
            amt
        } else {
            let key = DataKey::NoBalance(deal_id, redeemer.clone());
            let amt: i128 = env.storage().persistent().get(&key).unwrap_or(0);
            env.storage().persistent().set(&key, &0i128);
            amt
        };

        if tokens_held == 0 {
            return 0;
        }

        // Payout: proportional share of total liquidity
        let winning_reserve = if market.outcome {
            market.yes_reserve
        } else {
            market.no_reserve
        };
        let payout = if winning_reserve > 0 {
            tokens_held * market.total_liquidity / winning_reserve
        } else {
            0
        };

        if payout > 0 {
            let token_addr: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
            let token = TokenClient::new(&env, &token_addr);
            token.transfer(&env.current_contract_address(), &redeemer, &payout);
        }

        payout
    }

    pub fn get_market(env: Env, deal_id: u32) -> Market {
        env.storage().persistent().get(&DataKey::Market(deal_id)).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token, Env};

    fn create_token<'a>(env: &'a Env, admin: &'a Address) -> (token::StellarAssetClient<'a>, Address) {
        let contract_id = env.register_stellar_asset_contract_v2(admin.clone());
        let addr = contract_id.address();
        let client = token::StellarAssetClient::new(env, &addr);
        (client, addr)
    }

    fn setup() -> (Env, Address, PactMarketClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let oracle = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let (token, usdc_addr) = create_token(&env, &token_admin);

        // Seed some USDC for buyers
        let buyer = Address::generate(&env);
        token.mint(&buyer, &100_000_000i128);

        let contract = env.register_contract(None, PactMarket);
        let client = PactMarketClient::new(&env, &contract);
        client.initialize(&usdc_addr, &oracle);

        (env, oracle, client)
    }

    #[test]
    fn test_create_market() {
        let (_env, _oracle, client) = setup();
        client.create_market(&1u32, &10_000_000i128);
        let m = client.get_market(&1u32);
        assert_eq!(m.yes_reserve, 5_000_000);
        assert_eq!(m.no_reserve, 5_000_000);
        assert!(!m.settled);
    }

    #[test]
    fn test_yes_price_starts_at_50_percent() {
        let (_env, _oracle, client) = setup();
        client.create_market(&1u32, &10_000_000i128);
        let price = client.get_yes_price(&1u32);
        // 500 = 50% (out of 1000)
        assert_eq!(price, 500);
    }

    #[test]
    fn test_settle_market() {
        let (_env, oracle, client) = setup();
        client.create_market(&1u32, &10_000_000i128);
        client.settle_market(&1u32, &true);
        let m = client.get_market(&1u32);
        assert!(m.settled);
        assert!(m.outcome);
    }

    #[test]
    fn test_settle_no_outcome() {
        let (_env, _oracle, client) = setup();
        client.create_market(&2u32, &10_000_000i128);
        client.settle_market(&2u32, &false);
        let m = client.get_market(&2u32);
        assert!(m.settled);
        assert!(!m.outcome);
    }
}
