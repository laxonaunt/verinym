use starknet::ContractAddress;

#[starknet::interface]
pub trait IIssuerRegistry<TContractState> {
    fn register_issuer(ref self: TContractState, issuer_public_key: felt252, issuer_name: felt252);
    fn is_trusted_issuer(self: @TContractState, issuer_public_key: felt252) -> bool;
    fn get_issuer_name(self: @TContractState, issuer_public_key: felt252) -> felt252;
}

#[starknet::contract]
pub mod IssuerRegistry {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        StorageMapReadAccess, StorageMapWriteAccess, Map
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        trusted_issuers: Map<felt252, bool>,
        issuer_names: Map<felt252, felt252>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        IssuerRegistered: IssuerRegistered,
    }

    #[derive(Drop, starknet::Event)]
    struct IssuerRegistered {
        #[key]
        issuer_public_key: felt252,
        issuer_name: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl IssuerRegistryImpl of super::IIssuerRegistry<ContractState> {
        fn register_issuer(
            ref self: ContractState,
            issuer_public_key: felt252,
            issuer_name: felt252
        ) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can register');

            self.trusted_issuers.write(issuer_public_key, true);
            self.issuer_names.write(issuer_public_key, issuer_name);

            self.emit(IssuerRegistered { issuer_public_key, issuer_name });
        }

        fn is_trusted_issuer(self: @ContractState, issuer_public_key: felt252) -> bool {
            self.trusted_issuers.read(issuer_public_key)
        }

        fn get_issuer_name(self: @ContractState, issuer_public_key: felt252) -> felt252 {
            self.issuer_names.read(issuer_public_key)
        }
    }
}