use starknet::ContractAddress;

#[starknet::interface]
pub trait IProofVerifier<TContractState> {
    fn submit_proof(
        ref self: TContractState,
        proof_hash: felt252,
        issuer_public_key: felt252,
        field_of_work: felt252,
        min_years_claimed: u64,
        current_timestamp: u64,
        issuer_signature_r: felt252,
        issuer_signature_s: felt252,
    ) -> felt252;
    fn is_verified(self: @TContractState, verification_id: felt252) -> bool;
    fn get_verification(self: @TContractState, verification_id: felt252) -> VerificationRecord;
    fn set_issuer_registry(ref self: TContractState, registry_address: ContractAddress);
}

#[derive(Drop, Serde, starknet::Store)]
pub struct VerificationRecord {
    pub issuer_public_key: felt252,
    pub field_of_work: felt252,
    pub min_years_claimed: u64,
    pub verified_at_timestamp: u64,
    pub exists: bool,
}

#[starknet::contract]
pub mod ProofVerifier {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        StorageMapReadAccess, StorageMapWriteAccess, Map
    };
    use super::VerificationRecord;
    use super::super::issuer_registry::{
        IIssuerRegistryDispatcher, IIssuerRegistryDispatcherTrait
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        issuer_registry: ContractAddress,
        verifications: Map<felt252, VerificationRecord>,
        used_proofs: Map<felt252, bool>,
        verification_count: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ClaimVerified: ClaimVerified,
    }

    #[derive(Drop, starknet::Event)]
    struct ClaimVerified {
        #[key]
        verification_id: felt252,
        issuer_public_key: felt252,
        field_of_work: felt252,
        min_years_claimed: u64,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.verification_count.write(0);
    }

    #[abi(embed_v0)]
    impl ProofVerifierImpl of super::IProofVerifier<ContractState> {
        fn submit_proof(
            ref self: ContractState,
            proof_hash: felt252,
            issuer_public_key: felt252,
            field_of_work: felt252,
            min_years_claimed: u64,
            current_timestamp: u64,
            issuer_signature_r: felt252,
            issuer_signature_s: felt252,
        ) -> felt252 {
            // Check 1: proof not already used
            let already_used = self.used_proofs.read(proof_hash);
            assert(!already_used, 'Proof already used');

            // Check 2: issuer is trusted
            let registry_addr = self.issuer_registry.read();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            assert(registry_addr != zero_address, 'Registry not set');

            let registry = IIssuerRegistryDispatcher { contract_address: registry_addr };
            let is_trusted = registry.is_trusted_issuer(issuer_public_key);
            assert(is_trusted, 'Issuer not trusted');

            // Check 3: timestamp is recent (within 7 days)
            let block_time = get_block_timestamp();
            let seven_days: u64 = 604800;
            assert(block_time <= current_timestamp + seven_days, 'Proof timestamp too old');

            // Generate unique verification ID
            let count = self.verification_count.read();
            let new_count = count + 1;
            self.verification_count.write(new_count);

            let verification_id = core::pedersen::pedersen(proof_hash, new_count.into());

            // Save record
            let record = VerificationRecord {
                issuer_public_key,
                field_of_work,
                min_years_claimed,
                verified_at_timestamp: block_time,
                exists: true,
            };
            self.verifications.write(verification_id, record);
            self.used_proofs.write(proof_hash, true);

            // Emit event
            self.emit(ClaimVerified {
                verification_id,
                issuer_public_key,
                field_of_work,
                min_years_claimed,
                timestamp: block_time,
            });

            verification_id
        }

        fn is_verified(self: @ContractState, verification_id: felt252) -> bool {
            self.verifications.read(verification_id).exists
        }

        fn get_verification(
            self: @ContractState,
            verification_id: felt252
        ) -> VerificationRecord {
            self.verifications.read(verification_id)
        }

        fn set_issuer_registry(ref self: ContractState, registry_address: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner');
            self.issuer_registry.write(registry_address);
        }
    }
}