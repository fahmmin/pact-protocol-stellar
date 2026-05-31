#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, BytesN, Env, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ArtifactType {
    DealIntent,
    RiskCheckpoint,
    ContentSubmission,
    SettlementAttestation,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ValidationArtifact {
    pub artifact_id: BytesN<32>,
    pub deal_id: u32,
    pub artifact_type: ArtifactType,
    pub data_hash: BytesN<32>,
    pub signer: Address,
    pub signature: BytesN<64>,
    pub timestamp: u64,
}

#[contract]
pub struct ValidationRegistry;

#[contracttype]
pub enum DataKey {
    Artifacts(u32),
    ArtifactById(BytesN<32>),
}

#[contractimpl]
impl ValidationRegistry {
    /// Post a signed validation artifact for a deal.
    /// The signer must authorize this call.
    pub fn post_artifact(
        env: Env,
        deal_id: u32,
        artifact_type: ArtifactType,
        data_hash: BytesN<32>,
        signer: Address,
        signature: BytesN<64>,
    ) -> BytesN<32> {
        signer.require_auth();

        // Derive artifact_id from sha256(deal_id_bytes ++ data_hash)
        let mut id_input = soroban_sdk::Bytes::new(&env);
        id_input.extend_from_array(&deal_id.to_be_bytes());
        id_input.extend_from_array(&data_hash.to_array());
        // sha256 returns Hash<32>; convert to BytesN<32>
        let artifact_id: BytesN<32> = env.crypto().sha256(&id_input).into();

        let artifact = ValidationArtifact {
            artifact_id: artifact_id.clone(),
            deal_id,
            artifact_type,
            data_hash,
            signer,
            signature,
            timestamp: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::ArtifactById(artifact_id.clone()), &artifact);

        let mut deal_artifacts: Vec<ValidationArtifact> = env
            .storage()
            .persistent()
            .get(&DataKey::Artifacts(deal_id))
            .unwrap_or_else(|| Vec::new(&env));
        deal_artifacts.push_back(artifact);
        env.storage()
            .persistent()
            .set(&DataKey::Artifacts(deal_id), &deal_artifacts);

        artifact_id
    }

    pub fn get_deal_artifacts(env: Env, deal_id: u32) -> Vec<ValidationArtifact> {
        env.storage()
            .persistent()
            .get(&DataKey::Artifacts(deal_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_artifact(env: Env, artifact_id: BytesN<32>) -> ValidationArtifact {
        env.storage()
            .persistent()
            .get(&DataKey::ArtifactById(artifact_id))
            .unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, BytesN, Env};

    fn dummy_hash(env: &Env, seed: u8) -> BytesN<32> {
        BytesN::from_array(env, &[seed; 32])
    }

    fn dummy_sig(env: &Env) -> BytesN<64> {
        BytesN::from_array(env, &[0xABu8; 64])
    }

    #[test]
    fn test_post_and_get_artifact() {
        let env = Env::default();
        env.mock_all_auths();
        let contract = env.register_contract(None, ValidationRegistry);
        let client = ValidationRegistryClient::new(&env, &contract);

        let signer = Address::generate(&env);
        let data_hash = dummy_hash(&env, 1);
        let sig = dummy_sig(&env);

        let artifact_id = client.post_artifact(
            &1u32,
            &ArtifactType::DealIntent,
            &data_hash,
            &signer,
            &sig,
        );

        let artifact = client.get_artifact(&artifact_id);
        assert_eq!(artifact.deal_id, 1u32);
        assert!(matches!(artifact.artifact_type, ArtifactType::DealIntent));
        assert_eq!(artifact.data_hash, data_hash);
        assert_eq!(artifact.signer, signer);
    }

    #[test]
    fn test_multiple_artifacts_for_same_deal() {
        let env = Env::default();
        env.mock_all_auths();
        let contract = env.register_contract(None, ValidationRegistry);
        let client = ValidationRegistryClient::new(&env, &contract);

        let signer = Address::generate(&env);
        let sig = dummy_sig(&env);

        client.post_artifact(&42u32, &ArtifactType::DealIntent, &dummy_hash(&env, 1), &signer, &sig);
        client.post_artifact(&42u32, &ArtifactType::RiskCheckpoint, &dummy_hash(&env, 2), &signer, &sig);
        client.post_artifact(&42u32, &ArtifactType::ContentSubmission, &dummy_hash(&env, 3), &signer, &sig);
        client.post_artifact(&42u32, &ArtifactType::SettlementAttestation, &dummy_hash(&env, 4), &signer, &sig);

        let artifacts = client.get_deal_artifacts(&42u32);
        assert_eq!(artifacts.len(), 4);
        assert!(matches!(artifacts.get(0).unwrap().artifact_type, ArtifactType::DealIntent));
        assert!(matches!(artifacts.get(3).unwrap().artifact_type, ArtifactType::SettlementAttestation));
    }

    #[test]
    fn test_empty_artifacts_for_unknown_deal() {
        let env = Env::default();
        env.mock_all_auths();
        let contract = env.register_contract(None, ValidationRegistry);
        let client = ValidationRegistryClient::new(&env, &contract);
        let artifacts = client.get_deal_artifacts(&999u32);
        assert_eq!(artifacts.len(), 0);
    }
}
