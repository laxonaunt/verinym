
const SECONDS_PER_YEAR: u64 = 31_557_600;


#[derive(Drop, Serde)]
pub struct ClaimPublicInputs {
    pub issuer_public_key: felt252,  // Which issuer signed the credential
    pub field_of_work: felt252,       // What field (e.g., 'Engineering')
    pub min_years_claimed: u64,       // What minimum years are being claimed
    pub current_timestamp: u64,       // The timestamp used in the calculation
}


pub fn verify_employment_claim(
    
    start_timestamp: u64,      // When did the job start?
    end_timestamp: u64,        // When did the job end? (0 = still employed)
    
    // Public inputs (visible to verifier):
    current_timestamp: u64,    // "Current" time at proof generation
    min_years_claimed: u64,    // How many years minimum are we claiming?
) -> bool {
    // Figure out the end point: if still employed, use current time
    let effective_end = if end_timestamp == 0 {
        current_timestamp
    } else {
        end_timestamp
    };
    
    
    if start_timestamp >= effective_end {
        return false;
    }
    
    // Calculate total seconds of employment
    let duration_seconds = effective_end - start_timestamp;
    
    // Calculate total seconds required for the claim
    let required_seconds = min_years_claimed * SECONDS_PER_YEAR;
    
    
    duration_seconds >= required_seconds
}