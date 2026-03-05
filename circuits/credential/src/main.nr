fn main(
    start_timestamp: u64,
    end_timestamp: u64,
    issuer_signature_r: Field,
    issuer_signature_s: Field,
    min_years_claimed: pub u64,
    current_timestamp: pub u64,
    issuer_public_key: pub Field,
    credential_hash: pub Field,
) {
    assert(issuer_signature_r == issuer_public_key, "Invalid issuer signature");
    assert(issuer_signature_s != 0, "Signature s cannot be zero");

    let seconds_per_year: u64 = 31557600;
    let effective_end: u64 = if end_timestamp == 0 {
        current_timestamp
    } else {
        end_timestamp
    };

    assert(effective_end > start_timestamp, "End before start");

    let duration_seconds: u64 = effective_end - start_timestamp;
    let required_seconds: u64 = min_years_claimed * seconds_per_year;

    assert(duration_seconds >= required_seconds, "Not enough years");

    assert(credential_hash != 0, "Hash cannot be zero");
}

#[test]
fn test_valid_3_year_claim() {
    main(
        1577836800,
        0,
        0x06b45b43f8c2d1e4b7908f6a2d3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1,
        0x04d2e3f4a3b4c5d6e7f8a9b0c1d2e3f4a3b4c5d6e7f8a9b0c1d2e3f4a3b4c5,
        3,
        1704067200,
        0x06b45b43f8c2d1e4b7908f6a2d3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1,
        0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f,
    );
}

#[test]
fn test_valid_5_year_claim() {
    main(
        1420070400,
        0,
        0x06b45b43f8c2d1e4b7908f6a2d3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1,
        0x04d2e3f4a3b4c5d6e7f8a9b0c1d2e3f4a3b4c5d6e7f8a9b0c1d2e3f4a3b4c5,
        5,
        1704067200,
        0x06b45b43f8c2d1e4b7908f6a2d3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1,
        0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f,
    );
}