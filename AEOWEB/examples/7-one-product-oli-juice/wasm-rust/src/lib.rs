use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// ==============================================
// DATA STRUCTURES
// ==============================================

#[derive(Serialize, Deserialize, Clone)]
pub struct NutritionInfo {
    pub serving_size_ml: f64,
    pub calories: f64,
    pub protein_g: f64,
    pub carbs_g: f64,
    pub sugar_g: f64,
    pub fiber_g: f64,
    pub vitamin_c_mg: f64,
    pub calcium_mg: f64,
    pub iron_mg: f64,
}

#[derive(Serialize, Deserialize)]
pub struct PricingTier {
    pub bottles: u32,
    pub price_per_bottle: f64,
    pub total_price: f64,
    pub savings: f64,
    pub savings_percentage: f64,
}

#[derive(Serialize, Deserialize)]
pub struct SubscriptionPlan {
    pub name: String,
    pub bottles_per_delivery: u32,
    pub deliveries_per_month: u32,
    pub price_per_bottle: f64,
    pub monthly_total: f64,
    pub annual_total: f64,
    pub annual_savings: f64,
}

#[derive(Serialize, Deserialize)]
pub struct CarbonFootprint {
    pub production_kg_co2: f64,
    pub packaging_kg_co2: f64,
    pub shipping_kg_co2: f64,
    pub total_kg_co2: f64,
    pub trees_to_offset: f64,
}

// ==============================================
// CONSTANTS
// ==============================================

const BASE_PRICE_PER_BOTTLE: f64 = 12.99;
const BOTTLE_SIZE_ML: f64 = 500.0;
const STANDARD_SERVING_ML: f64 = 250.0;

// Nutrition per 250ml serving
const BASE_NUTRITION: NutritionInfo = NutritionInfo {
    serving_size_ml: STANDARD_SERVING_ML,
    calories: 120.0,
    protein_g: 2.5,
    carbs_g: 28.0,
    sugar_g: 24.0,
    fiber_g: 3.5,
    vitamin_c_mg: 85.0,  // 94% DV
    calcium_mg: 120.0,   // 12% DV
    iron_mg: 1.8,        // 10% DV
};

// ==============================================
// PRICING CALCULATIONS
// ==============================================

/// Calculate pricing tiers with volume discounts
#[wasm_bindgen]
pub fn calculate_pricing_tiers() -> String {
    let tiers = vec![
        calculate_tier(1, 0.0),     // Single bottle - no discount
        calculate_tier(6, 0.10),    // 6-pack - 10% off
        calculate_tier(12, 0.15),   // 12-pack - 15% off
        calculate_tier(24, 0.20),   // 24-pack - 20% off
        calculate_tier(48, 0.25),   // 48-pack - 25% off
    ];

    serde_json::to_string(&tiers).unwrap()
}

fn calculate_tier(bottles: u32, discount: f64) -> PricingTier {
    let discounted_price = BASE_PRICE_PER_BOTTLE * (1.0 - discount);
    let total = discounted_price * bottles as f64;
    let full_price = BASE_PRICE_PER_BOTTLE * bottles as f64;
    let savings = full_price - total;

    PricingTier {
        bottles,
        price_per_bottle: (discounted_price * 100.0).round() / 100.0,
        total_price: (total * 100.0).round() / 100.0,
        savings: (savings * 100.0).round() / 100.0,
        savings_percentage: (discount * 100.0 * 10.0).round() / 10.0,
    }
}

/// Calculate custom quantity pricing
#[wasm_bindgen]
pub fn calculate_price(bottles: u32) -> String {
    let discount = match bottles {
        1..=5 => 0.0,
        6..=11 => 0.10,
        12..=23 => 0.15,
        24..=47 => 0.20,
        _ => 0.25,
    };

    let tier = calculate_tier(bottles, discount);
    serde_json::to_string(&tier).unwrap()
}

// ==============================================
// SUBSCRIPTION CALCULATIONS
// ==============================================

/// Calculate subscription plan options
#[wasm_bindgen]
pub fn calculate_subscription_plans() -> String {
    let plans = vec![
        create_subscription_plan("Starter", 6, 1, 0.15),
        create_subscription_plan("Regular", 12, 1, 0.20),
        create_subscription_plan("Family", 24, 1, 0.25),
        create_subscription_plan("Bi-Weekly", 12, 2, 0.22),
    ];

    serde_json::to_string(&plans).unwrap()
}

fn create_subscription_plan(
    name: &str,
    bottles_per_delivery: u32,
    deliveries_per_month: u32,
    discount: f64
) -> SubscriptionPlan {
    let price_per_bottle = BASE_PRICE_PER_BOTTLE * (1.0 - discount);
    let monthly_bottles = bottles_per_delivery * deliveries_per_month;
    let monthly_total = price_per_bottle * monthly_bottles as f64;
    let annual_total = monthly_total * 12.0;

    let full_annual_price = BASE_PRICE_PER_BOTTLE * monthly_bottles as f64 * 12.0;
    let annual_savings = full_annual_price - annual_total;

    SubscriptionPlan {
        name: name.to_string(),
        bottles_per_delivery,
        deliveries_per_month,
        price_per_bottle: (price_per_bottle * 100.0).round() / 100.0,
        monthly_total: (monthly_total * 100.0).round() / 100.0,
        annual_total: (annual_total * 100.0).round() / 100.0,
        annual_savings: (annual_savings * 100.0).round() / 100.0,
    }
}

// ==============================================
// NUTRITION CALCULATIONS
// ==============================================

/// Calculate nutrition info for custom serving size
#[wasm_bindgen]
pub fn calculate_nutrition(serving_ml: f64) -> String {
    let multiplier = serving_ml / STANDARD_SERVING_ML;

    let nutrition = NutritionInfo {
        serving_size_ml: serving_ml,
        calories: (BASE_NUTRITION.calories * multiplier * 10.0).round() / 10.0,
        protein_g: (BASE_NUTRITION.protein_g * multiplier * 10.0).round() / 10.0,
        carbs_g: (BASE_NUTRITION.carbs_g * multiplier * 10.0).round() / 10.0,
        sugar_g: (BASE_NUTRITION.sugar_g * multiplier * 10.0).round() / 10.0,
        fiber_g: (BASE_NUTRITION.fiber_g * multiplier * 10.0).round() / 10.0,
        vitamin_c_mg: (BASE_NUTRITION.vitamin_c_mg * multiplier * 10.0).round() / 10.0,
        calcium_mg: (BASE_NUTRITION.calcium_mg * multiplier * 10.0).round() / 10.0,
        iron_mg: (BASE_NUTRITION.iron_mg * multiplier * 10.0).round() / 10.0,
    };

    serde_json::to_string(&nutrition).unwrap()
}

/// Get standard nutrition info (250ml serving)
#[wasm_bindgen]
pub fn get_standard_nutrition() -> String {
    serde_json::to_string(&BASE_NUTRITION).unwrap()
}

/// Calculate daily value percentages
#[wasm_bindgen]
pub fn calculate_daily_values(serving_ml: f64) -> String {
    let nutrition = calculate_nutrition(serving_ml);
    let nutrition: NutritionInfo = serde_json::from_str(&nutrition).unwrap();

    // Based on 2000 calorie diet
    let daily_values = serde_json::json!({
        "calories_dv": ((nutrition.calories / 2000.0 * 100.0) * 10.0).round() / 10.0,
        "protein_dv": ((nutrition.protein_g / 50.0 * 100.0) * 10.0).round() / 10.0,
        "carbs_dv": ((nutrition.carbs_g / 275.0 * 100.0) * 10.0).round() / 10.0,
        "fiber_dv": ((nutrition.fiber_g / 28.0 * 100.0) * 10.0).round() / 10.0,
        "vitamin_c_dv": ((nutrition.vitamin_c_mg / 90.0 * 100.0) * 10.0).round() / 10.0,
        "calcium_dv": ((nutrition.calcium_mg / 1000.0 * 100.0) * 10.0).round() / 10.0,
        "iron_dv": ((nutrition.iron_mg / 18.0 * 100.0) * 10.0).round() / 10.0,
    });

    daily_values.to_string()
}

// ==============================================
// INVENTORY & AVAILABILITY
// ==============================================

/// Check if quantity is available
#[wasm_bindgen]
pub fn check_inventory(requested_bottles: u32, current_inventory: u32) -> bool {
    requested_bottles <= current_inventory
}

/// Calculate estimated delivery date (business days)
#[wasm_bindgen]
pub fn calculate_delivery_days(bottles: u32, zip_code: &str) -> u32 {
    // Base shipping time
    let mut days = match bottles {
        1..=12 => 3,
        13..=24 => 4,
        _ => 5,
    };

    // Adjust for location (simplified - first digit of zip code)
    if let Some(first_digit) = zip_code.chars().next() {
        if let Some(digit) = first_digit.to_digit(10) {
            // East coast (0-3): +0 days
            // Central (4-6): +1 day
            // West coast (7-9): +2 days
            days += match digit {
                0..=3 => 0,
                4..=6 => 1,
                _ => 2,
            };
        }
    }

    days
}

// ==============================================
// CARBON FOOTPRINT CALCULATIONS
// ==============================================

/// Calculate carbon footprint per bottle
#[wasm_bindgen]
pub fn calculate_carbon_footprint(bottles: u32, shipping_miles: f64) -> String {
    // Production: 0.5 kg CO2 per bottle (juice processing, bottling)
    let production = 0.5 * bottles as f64;

    // Packaging: 0.2 kg CO2 per bottle (glass bottle + label)
    let packaging = 0.2 * bottles as f64;

    // Shipping: 0.0001 kg CO2 per mile per bottle
    let shipping = 0.0001 * shipping_miles * bottles as f64;

    let total = production + packaging + shipping;

    // One tree absorbs ~21 kg CO2 per year
    let trees_to_offset = (total / 21.0 * 10.0).round() / 10.0;

    let footprint = CarbonFootprint {
        production_kg_co2: (production * 100.0).round() / 100.0,
        packaging_kg_co2: (packaging * 100.0).round() / 100.0,
        shipping_kg_co2: (shipping * 100.0).round() / 100.0,
        total_kg_co2: (total * 100.0).round() / 100.0,
        trees_to_offset,
    };

    serde_json::to_string(&footprint).unwrap()
}

// ==============================================
// DISCOUNT CODE VALIDATION
// ==============================================

/// Validate discount code and return discount percentage
#[wasm_bindgen]
pub fn validate_discount_code(code: &str) -> f64 {
    let code_upper = code.to_uppercase();

    match code_upper.as_str() {
        "WELCOME10" => 0.10,
        "HEALTH15" => 0.15,
        "SUMMER20" => 0.20,
        "FRIEND25" => 0.25,
        _ => 0.0,
    }
}

/// Apply discount code to price
#[wasm_bindgen]
pub fn apply_discount(total: f64, discount_code: &str) -> String {
    let discount_percentage = validate_discount_code(discount_code);
    let discount_amount = total * discount_percentage;
    let final_price = total - discount_amount;

    let result = serde_json::json!({
        "original_price": (total * 100.0).round() / 100.0,
        "discount_percentage": (discount_percentage * 100.0),
        "discount_amount": (discount_amount * 100.0).round() / 100.0,
        "final_price": (final_price * 100.0).round() / 100.0,
        "valid_code": discount_percentage > 0.0,
    });

    result.to_string()
}

// ==============================================
// UTILITIES
// ==============================================

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn main() {
    // Set panic hook for better error messages in browser console
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Get module version
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Simple health check
#[wasm_bindgen]
pub fn health_check() -> bool {
    true
}

// ==============================================
// TESTS
// ==============================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pricing_calculation() {
        let tier = calculate_tier(12, 0.15);
        assert_eq!(tier.bottles, 12);
        assert!(tier.total_price < BASE_PRICE_PER_BOTTLE * 12.0);
    }

    #[test]
    fn test_nutrition_scaling() {
        let nutrition = calculate_nutrition(500.0);
        let nutrition: NutritionInfo = serde_json::from_str(&nutrition).unwrap();
        assert_eq!(nutrition.calories, BASE_NUTRITION.calories * 2.0);
    }

    #[test]
    fn test_discount_codes() {
        assert_eq!(validate_discount_code("WELCOME10"), 0.10);
        assert_eq!(validate_discount_code("INVALID"), 0.0);
    }

    #[test]
    fn test_inventory_check() {
        assert!(check_inventory(5, 10));
        assert!(!check_inventory(15, 10));
    }
}
