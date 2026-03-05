use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
use starknet::ContractAddress;
use verinym_contracts::issuer_registry::{IIssuerRegistryDispatcher, IIssuerRegistryDispatcherTrait};
use verinym_contracts::credential_circuit::verify_employment_claim;

fn address(value: felt252) -> ContractAddress {
    value.try_into().unwrap()
}

#[test]
fn test_register_issuer() {
    let contract = declare("IssuerRegistry").unwrap().contract_class();
    let owner = address(1);
    let (registry_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    let registry = IIssuerRegistryDispatcher { contract_address: registry_address };

    start_cheat_caller_address(registry_address, owner);
    registry.register_issuer(12345, 'Acme Corp');
    stop_cheat_caller_address(registry_address);

    assert(registry.is_trusted_issuer(12345), 'Should be trusted');
}

#[test]
fn test_untrusted_issuer() {
    let contract = declare("IssuerRegistry").unwrap().contract_class();
    let owner = address(1);
    let (registry_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    let registry = IIssuerRegistryDispatcher { contract_address: registry_address };

    assert(!registry.is_trusted_issuer(99999), 'Should not be trusted');
}

#[test]
fn test_claim_valid_3_years() {
    let current_time: u64 = 1_700_000_000;
    let start_time: u64 = current_time - (3 * 31_557_600) - 1000;
    let result = verify_employment_claim(start_time, 0, current_time, 3);
    assert(result, 'Should be valid for 3 years');
}

#[test]
fn test_claim_invalid_not_enough_time() {
    let current_time: u64 = 1_700_000_000;
    let start_time: u64 = current_time - 31_557_600;
    let result = verify_employment_claim(start_time, 0, current_time, 3);
    assert(!result, 'Should be invalid');
}