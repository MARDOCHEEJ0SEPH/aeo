-- Little Wonders Baby Shop - Sample Data
-- Seed data for development and testing

\c baby_shop;

-- ==================== SAMPLE PRODUCTS ====================

-- Newborn Essentials (Category ID: 1)
INSERT INTO products (sku, name, slug, description, long_description, category_id, brand_id, price, compare_at_price, age_range, gender, is_organic, is_eco_friendly, safety_certified, featured, image_url, meta_title, meta_description) VALUES
('LW-ONS-001', 'Organic Cotton Baby Onesies (3-Pack)', 'organic-cotton-baby-onesies-3-pack', 'Ultra-soft GOTS-certified organic cotton onesies. Tagless design, snap closures.', 'Made from 100% GOTS-certified organic cotton, these onesies are perfect for your baby''s sensitive skin. Features tagless design to prevent irritation, easy snap closures for quick diaper changes, and reinforced seams for durability. Machine washable and gets softer with each wash. Available in sizes newborn to 24 months.', 1, 1, 29.99, 39.99, 'newborn', 'unisex', true, true, true, true, 'https://example.com/onesies.jpg', 'Organic Cotton Baby Onesies 3-Pack | Little Wonders', 'GOTS-certified organic cotton onesies for newborns and infants. Soft, breathable, tagless design. Safe for sensitive skin.'),

('GB-SWD-002', 'Organic Muslin Swaddle Blankets (4-Pack)', 'organic-muslin-swaddle-blankets-4-pack', 'Breathable muslin swaddles. Large 47x47 inches, gets softer with washing.', 'These premium muslin swaddle blankets are made from 100% organic cotton and get softer with every wash. Perfect size at 47x47 inches for various swaddling techniques. Lightweight and breathable to prevent overheating. Multi-functional: use as nursing cover, stroller shade, burp cloth, or play mat. Machine washable and dryer friendly.', 1, 2, 34.99, 44.99, 'newborn', 'unisex', true, true, true, true, 'https://example.com/swaddles.jpg', 'Organic Muslin Swaddle Blankets 4-Pack | GreenBaby', 'Large 47x47" organic muslin swaddles. Breathable, versatile, gets softer with washing. Perfect for newborns.'),

('SS-PAC-003', 'Orthodontic Pacifiers (6-Pack)', 'orthodontic-pacifiers-6-pack', 'BPA-free orthodontic pacifiers. Designed by pediatric dentists.', 'Orthodontic pacifiers designed in collaboration with pediatric dentists to support healthy oral development. Made from 100% medical-grade silicone, completely BPA-free. One-piece design with no small parts. Includes sterilizer case. Dishwasher and microwave safe. Suitable for 0-6 months and 6-18 months. Comes in assorted soothing colors.', 1, 3, 12.99, NULL, 'newborn', 'unisex', false, true, true, false, 'https://example.com/pacifiers.jpg', 'Orthodontic Pacifiers 6-Pack BPA-Free | Soft Start', 'Pediatric dentist-designed pacifiers. BPA-free, one-piece silicone design. Safe for newborns.'),

-- Diapers & Wipes (Category ID: 5)
('GB-DIA-004', 'Eco-Friendly Disposable Diapers Size 1 (100-count)', 'eco-friendly-disposable-diapers-size-1', 'Plant-based, chlorine-free diapers. Hypoallergenic, 12-hour leak protection.', 'Our eco-friendly diapers are made from sustainable, plant-based materials and are completely chlorine-free. Hypoallergenic and dermatologist-tested for sensitive skin. Features wetness indicator, stretchy sides, and leak guards for 12-hour protection. Newborn to 14 lbs. Certified by multiple environmental and safety organizations.', 5, 2, 49.99, NULL, 'newborn', 'unisex', false, true, true, true, 'https://example.com/diapers.jpg', 'Eco-Friendly Disposable Diapers Size 1 | GreenBaby', 'Plant-based, chlorine-free diapers. Hypoallergenic with 12-hour leak protection. Perfect for newborns 8-14 lbs.'),

('GB-WIP-005', 'Water-Based Baby Wipes (12 Packs, 960 Wipes)', 'water-based-baby-wipes-12-packs', '99.9% water, fragrance-free, hypoallergenic baby wipes.', 'Ultra-gentle baby wipes made with 99.9% purified water and a drop of fruit extract. Fragrance-free, alcohol-free, and hypoallergenic. Thicker and softer than standard wipes. Perfect for sensitive skin, eczema-prone babies, and newborns. Dermatologist and pediatrician tested. Biodegradable plant-based fibers.', 5, 2, 39.99, 49.99, 'newborn', 'unisex', false, true, false, false, 'https://example.com/wipes.jpg', 'Water-Based Baby Wipes 12-Pack | 99.9% Water | GreenBaby', '99.9% water baby wipes. Fragrance-free, hypoallergenic, perfect for sensitive skin and newborns.'),

-- Travel Gear (Category ID: 6)
('UB-STR-006', 'Premium Baby Stroller with Bassinet', 'premium-baby-stroller-bassinet', 'All-terrain wheels, one-hand fold, reversible seat, adjustable handlebar.', 'Premium all-terrain stroller designed for urban and outdoor use. Features reversible seat (parent-facing or forward-facing), one-hand quick fold, adjustable handlebar for different heights, and included bassinet for newborns. Large storage basket, all-wheel suspension, and puncture-proof foam tires. Includes rain cover, cup holder, and mosquito net. Birth to 50 lbs. JPMA certified.', 6, 3, 399.99, 499.99, 'newborn', 'unisex', false, false, true, true, 'https://example.com/stroller.jpg', 'Premium Baby Stroller with Bassinet | All-Terrain | Urban Baby Gear', 'Versatile baby stroller with bassinet, one-hand fold, reversible seat. JPMA certified. Birth to 50 lbs.'),

('UB-CAR-007', 'Infant Car Seat with Base', 'infant-car-seat-base', 'Rear-facing car seat 4-35 lbs. Side-impact protection, easy installation.', 'Premium infant car seat featuring advanced side-impact protection system and energy-absorbing foam. Easy installation with included base and LATCH system. Adjustable base ensures proper recline angle. Removable infant insert for smallest babies. Machine-washable, drip-dry fabrics. 5-point harness with no-rethread adjustment. Compatible with many stroller brands. Rear-facing for 4-35 lbs. Exceeds all federal safety standards.', 6, 3, 229.99, 279.99, 'newborn', 'unisex', false, false, true, true, 'https://example.com/carseat.jpg', 'Infant Car Seat with Base | Rear-Facing 4-35 lbs | Safety First', 'Premium infant car seat with side-impact protection. Easy install, adjustable base. 4-35 lbs.'),

-- Feeding (Category ID: 4)
('SS-BRE-008', 'Wearable Electric Breast Pump (Double)', 'wearable-electric-breast-pump', 'Hands-free, quiet operation, rechargeable battery. 9 suction levels.', 'Revolutionary hands-free breast pump that fits inside your nursing bra. Completely wireless with rechargeable battery (up to 3 hours). Hospital-grade suction with 9 customizable levels and memory function. Ultra-quiet motor under 45dB. Includes 4 different flange sizes for perfect fit. BPA-free, easy to clean with only 4 parts. App connectivity for tracking. FSA/HSA eligible. Perfect for working moms.', 4, 3, 279.99, 349.99, 'newborn', 'unisex', false, false, true, true, 'https://example.com/breastpump.jpg', 'Wearable Electric Breast Pump Double | Hands-Free | Soft Start', 'Hands-free wearable breast pump. 9 suction levels, quiet, rechargeable. FSA/HSA eligible.'),

('LW-BOT-009', 'Anti-Colic Baby Bottles (8-Pack)', 'anti-colic-baby-bottles-8-pack', 'Reduces colic, gas, and spit-up. Includes 4 slow-flow and 4 medium-flow nipples.', 'Clinically proven to reduce colic, gas, and fussiness. Advanced venting system draws air away from milk to prevent oxidation. Includes 4oz and 8oz bottles with both slow-flow (0m+) and medium-flow (3m+) nipples. Wide-neck design for easy cleaning. BPA-free, phthalate-free. Dishwasher safe. Compatible with breast pumps and sterilizers. Helps preserve vitamins C, A, and E.', 4, 1, 44.99, NULL, 'newborn', 'unisex', false, true, true, false, 'https://example.com/bottles.jpg', 'Anti-Colic Baby Bottles 8-Pack | Reduces Gas | Little Wonders', 'Anti-colic baby bottles with advanced venting. Reduces gas, colic, spit-up. BPA-free.'),

('LW-HIG-010', 'Adjustable High Chair 6-in-1', 'adjustable-high-chair-6in1', 'Grows from infant to adult. Removable tray, adjustable height and recline.', 'This versatile high chair grows with your child from infant (with infant insert) to adult. 6 height positions, 3 recline positions, 5-point safety harness. Dishwasher-safe removable tray with cup holder. Wipe-clean seat pad and adjustable footrest. Converts to toddler chair, booster seat, and eventually adult chair. JPMA certified. Supports up to 250 lbs.', 4, 1, 149.99, 199.99, 'infant', 'unisex', false, false, true, false, 'https://example.com/highchair.jpg', 'Adjustable 6-in-1 High Chair | Infant to Adult | JPMA Certified', '6-in-1 high chair grows from infant to adult. Adjustable height, removable tray. JPMA certified.'),

-- Nursery Furniture (Category ID: 3)
('LW-CRI-011', 'Convertible 4-in-1 Crib', 'convertible-4in1-crib', 'Grows with baby: crib, toddler bed, daybed, full-size bed. Solid wood.', 'Beautiful 4-in-1 convertible crib crafted from sustainable solid wood. Converts to toddler bed, daybed, and full-size bed (conversion kits sold separately). Three adjustable mattress heights. Non-toxic, lead-free finish. Meets all CPSC and ASTM safety standards. Fits standard crib mattress. Includes teething rails. Assembly required (approximately 45 minutes). JPMA certified.', 3, 1, 349.99, 449.99, 'newborn', 'unisex', false, true, true, true, 'https://example.com/crib.jpg', 'Convertible 4-in-1 Crib | Grows to Full Bed | JPMA Certified', 'Solid wood 4-in-1 convertible crib. Grows from crib to full-size bed. JPMA certified, non-toxic finish.'),

('LW-MAT-012', 'Organic Crib Mattress - Dual Firmness', 'organic-crib-mattress-dual', 'Organic cotton cover, dual-sided: firm for infant, softer for toddler.', 'Premium dual-firmness crib mattress with organic cotton cover and GOTS-certified materials. Firm side for infants (recommended by pediatricians), slightly softer side for toddlers. Waterproof layer protects against accidents. Hypoallergenic, free from flame retardants, phthalates, and VOCs. Greenguard Gold certified for low emissions. Fits standard cribs. 15-year warranty.', 3, 2, 249.99, 299.99, 'newborn', 'unisex', true, true, true, false, 'https://example.com/mattress.jpg', 'Organic Dual-Firmness Crib Mattress | Greenguard Gold | GreenBaby', 'Organic crib mattress with dual firmness. GOTS certified, Greenguard Gold. No flame retardants.'),

('LW-CHA-013', 'Nursery Glider Rocking Chair', 'nursery-glider-rocking-chair', 'Smooth gliding motion, lumbar support, wide armrests for nursing.', 'Comfortable glider designed specifically for nursing mothers. Smooth, whisper-quiet gliding mechanism. High back with lumbar support pillow. Wide, padded armrests at perfect height for feeding. Easy-to-clean microfiber upholstery. Solid wood frame supports up to 300 lbs. Includes matching ottoman with storage. Available in 5 colors. Some assembly required.', 3, 1, 329.99, NULL, 'newborn', 'unisex', false, false, true, false, 'https://example.com/glider.jpg', 'Nursery Glider Rocking Chair | Perfect for Nursing | Little Wonders', 'Comfortable nursery glider with lumbar support. Wide armrests, quiet gliding. Includes storage ottoman.'),

-- Toys & Books (Category ID: 7)
('HF-ACT-014', 'Wooden Activity Cube - Montessori', 'wooden-activity-cube-montessori', '5-sided activity cube with bead maze, shape sorter, gears. Non-toxic paint.', 'Montessori-inspired wooden activity cube encourages fine motor skills, problem-solving, and hand-eye coordination. Five sides of activities: bead maze, shape sorter, spinning gears, sliding maze, and counting beads. Made from sustainable hardwood with water-based, non-toxic paint. No small parts - completely safe for babies. ASTM certified. Perfect for 12 months to 3 years.', 7, 4, 79.99, NULL, 'toddler', 'unisex', false, true, true, false, 'https://example.com/activity-cube.jpg', 'Wooden Activity Cube Montessori | 5 Activities | Safe Wood Toy', 'Montessori wooden activity cube. 5 sides of learning activities. Non-toxic, sustainable wood. 12m-3y.'),

('SS-TEE-015', 'Silicone Teething Toys (4-Pack)', 'silicone-teething-toys-4-pack', 'Food-grade silicone teethers. Freezer-safe, dishwasher-safe, BPA-free.', 'Safe and effective teething toys made from 100% food-grade silicone. Four different textures and shapes to soothe sore gums. Freezer-safe for extra relief. One-piece design with no small parts. BPA-free, PVC-free, phthalate-free. Dishwasher safe. Bright colors stimulate vision. Lightweight and easy for baby to hold. Recommended for 3 months and up.', 7, 3, 16.99, NULL, 'infant', 'unisex', false, true, true, false, 'https://example.com/teethers.jpg', 'Silicone Teething Toys 4-Pack | Food-Grade | BPA-Free | Soft Start', 'Food-grade silicone teethers. Freezer-safe, dishwasher-safe. 4 textures for sore gums. 3m+.'),

-- Bath & Skincare (Category ID: 8)
('GB-BTH-016', 'Organic Baby Shampoo & Body Wash', 'organic-baby-shampoo-body-wash', 'Tear-free, plant-based formula. Hypoallergenic, no synthetic fragrances.', 'Gentle, tear-free shampoo and body wash made with certified organic ingredients. Plant-based formula cleanses without stripping natural oils. Free from parabens, sulfates, phthalates, synthetic fragrances, and dyes. Hypoallergenic and dermatologist-tested. pH-balanced for baby''s delicate skin. Light natural scent from organic calendula and chamomile. 16 oz bottle. Safe from newborn through childhood.', 8, 2, 14.99, NULL, 'newborn', 'unisex', true, true, false, false, 'https://example.com/body-wash.jpg', 'Organic Baby Shampoo & Body Wash | Tear-Free | GreenBaby', 'Organic tear-free baby shampoo. Plant-based, hypoallergenic, no synthetic fragrances. Safe for newborns.'),

('SS-LOT-017', 'Eczema Relief Baby Lotion', 'eczema-relief-baby-lotion', 'Fragrance-free, dermatologist-recommended. Colloidal oatmeal and ceramides.', 'Pediatrician and dermatologist-recommended lotion specifically formulated for eczema-prone skin. Contains colloidal oatmeal to soothe itching and irritation, plus ceramides to restore skin barrier. Fragrance-free, steroid-free, hypoallergenic. Clinically shown to relieve dry, itchy skin in 24 hours. National Eczema Association Seal of Acceptance. 8 oz tube. Safe for newborns.', 8, 3, 12.99, NULL, 'newborn', 'unisex', false, true, true, false, 'https://example.com/eczema-lotion.jpg', 'Eczema Relief Baby Lotion | Dermatologist Recommended | NEA Seal', 'Eczema relief lotion with colloidal oatmeal. Fragrance-free, clinically proven. Safe for newborns.'),

('LW-TUB-018', 'Baby Bathtub with Temperature Indicator', 'baby-bathtub-temperature-indicator', 'Color-changing temperature plug, slip-resistant, newborn insert included.', 'Ergonomic baby bathtub designed to grow from newborn to toddler. Features color-changing drain plug that indicates water temperature (blue = too cold, white = perfect, pink = too hot). Textured slip-resistant surface. Includes removable newborn sling for smallest babies. Built-in soap dish and toy holder. Easy-to-clean plastic. Fits over most sinks and in adult bathtubs. Drain hole for easy emptying.', 8, 1, 39.99, NULL, 'newborn', 'unisex', false, false, true, false, 'https://example.com/bathtub.jpg', 'Baby Bathtub with Temperature Indicator | Color-Changing | Safe', 'Baby bathtub with color-changing temperature indicator. Slip-resistant, includes newborn insert.'),

-- Clothing (Category ID: 2)
('LW-SLP-019', 'Organic Cotton Sleep Sacks (2-Pack)', 'organic-cotton-sleep-sacks-2-pack', 'Wearable blankets with inverted zipper. TOG 1.0 for year-round use.', 'Safe alternative to loose blankets in crib. Made from GOTS-certified organic cotton. Inverted zipper prevents scratching and makes diaper changes easy. Sleeveless design reduces overheating. TOG rating 1.0 suitable for room temperature 68-72°F. Machine washable. Available in sizes 0-6m, 6-12m, 12-18m. Meets CPSC safety standards for sleepwear.', 2, 1, 44.99, 54.99, 'infant', 'unisex', true, true, true, false, 'https://example.com/sleep-sacks.jpg', 'Organic Cotton Sleep Sacks 2-Pack | Safe Sleep | GOTS Certified', 'Organic cotton wearable blankets. Inverted zipper, TOG 1.0. Safe alternative to loose blankets.'),

('HF-SHO-020', 'Soft Sole Baby Shoes', 'soft-sole-baby-shoes', 'Flexible leather, ankle support, non-slip sole. Perfect for first walkers.', 'Pediatrician-recommended soft sole shoes support natural foot development. Made from genuine leather with breathable lining. Flexible sole allows natural foot movement. Elastic ankle ensures shoes stay on. Non-slip grip perfect for early walkers. Available in 6 sizes from 0-24 months. Comes in 8 colors. Hand wash only.', 2, 4, 34.99, NULL, 'infant', 'unisex', false, true, false, false, 'https://example.com/baby-shoes.jpg', 'Soft Sole Baby Shoes | Leather | Perfect for First Walkers', 'Soft sole leather baby shoes. Support natural foot development. Non-slip, stay-on design. 0-24m.');

-- ==================== INVENTORY ====================

INSERT INTO inventory (product_id, quantity, low_stock_threshold) VALUES
(1, 250, 20),
(2, 180, 15),
(3, 320, 25),
(4, 150, 10),
(5, 200, 15),
(6, 45, 5),
(7, 38, 5),
(8, 22, 3),
(9, 165, 15),
(10, 55, 8),
(11, 42, 5),
(12, 88, 10),
(13, 28, 5),
(14, 75, 10),
(15, 145, 15),
(16, 220, 20),
(17, 190, 18),
(18, 95, 12),
(19, 125, 15),
(20, 85, 10);

-- ==================== SAMPLE CUSTOMERS ====================

-- Password for all sample users: 'password123'
-- Hashed with bcrypt
INSERT INTO customers (email, password_hash, first_name, last_name, phone, date_of_birth) VALUES
('sarah.johnson@email.com', '$2b$10$rQ7vYKLPZvMXOKZnX8DQ8eTGGr4/mJP/0IQ9VGPx3wW7Ll1K8xBPG', 'Sarah', 'Johnson', '415-555-0101', '1990-05-15'),
('mike.chen@email.com', '$2b$10$rQ7vYKLPZvMXOKZnX8DQ8eTGGr4/mJP/0IQ9VGPx3wW7Ll1K8xBPG', 'Mike', 'Chen', '415-555-0102', '1988-08-22'),
('emily.davis@email.com', '$2b$10$rQ7vYKLPZvMXOKZnX8DQ8eTGGr4/mJP/0IQ9VGPx3wW7Ll1K8xBPG', 'Emily', 'Davis', '415-555-0103', '1992-12-03'),
('james.wilson@email.com', '$2b$10$rQ7vYKLPZvMXOKZnX8DQ8eTGGr4/mJP/0IQ9VGPx3wW7Ll1K8xBPG', 'James', 'Wilson', '415-555-0104', '1985-03-28'),
('lisa.martinez@email.com', '$2b$10$rQ7vYKLPZvMXOKZnX8DQ8eTGGr4/mJP/0IQ9VGPx3wW7Ll1K8xBPG', 'Lisa', 'Martinez', '415-555-0105', '1993-07-19');

-- ==================== SAMPLE REVIEWS ====================

INSERT INTO reviews (customer_id, product_id, rating, title, comment, approved) VALUES
(1, 1, 5, 'Best onesies ever!', 'These are so soft and wash beautifully. My baby has sensitive skin and these have never caused any irritation. Worth every penny!', true),
(2, 1, 5, 'Highly recommend', 'Great quality organic cotton. The snaps are easy to use and they hold up well after many washes.', true),
(3, 4, 5, 'Life saver for diaper changes', 'These diapers are amazing! No leaks, even overnight. Love that they are eco-friendly too.', true),
(4, 6, 4, 'Great stroller but pricey', 'Love the quality and features. The bassinet is perfect for newborns. Only downside is the price, but you get what you pay for.', true),
(1, 8, 5, 'Game changer for pumping', 'I can finally pump hands-free while working! Quiet, efficient, and comfortable. Best purchase for going back to work.', true),
(5, 11, 5, 'Beautiful and sturdy crib', 'Absolutely love this crib. It was easy to assemble and feels very solid. Love that it converts to a full bed.', true),
(2, 14, 5, 'Baby loves this toy', 'Our 14-month-old plays with this every day. Great for developing motor skills. High quality wood.', true),
(3, 16, 5, 'Gentle on baby skin', 'We have tried many baby washes and this is by far the best. Smells great naturally and leaves skin soft.', true);

-- ==================== SAMPLE DISCOUNT CODES ====================

INSERT INTO discount_codes (code, type, value, min_purchase_amount, usage_limit, valid_from, valid_until) VALUES
('WELCOME15', 'percentage', 15.00, 50.00, 1000, '2024-01-01', '2025-12-31'),
('SAVE25', 'fixed', 25.00, 100.00, 500, '2024-01-01', '2025-12-31'),
('FREESHIP', 'percentage', 100.00, NULL, NULL, '2024-01-01', '2025-12-31'),
('NEWBABY20', 'percentage', 20.00, 75.00, 750, '2024-01-01', '2025-12-31');

-- ==================== SUCCESS MESSAGE ====================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sample data loaded successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Summary:';
    RAISE NOTICE '   - % Products', (SELECT COUNT(*) FROM products);
    RAISE NOTICE '   - % Categories', (SELECT COUNT(*) FROM categories);
    RAISE NOTICE '   - % Brands', (SELECT COUNT(*) FROM brands);
    RAISE NOTICE '   - % Sample Customers', (SELECT COUNT(*) FROM customers);
    RAISE NOTICE '   - % Reviews', (SELECT COUNT(*) FROM reviews);
    RAISE NOTICE '';
    RAISE NOTICE '👤 Test User Credentials:';
    RAISE NOTICE '   Email: sarah.johnson@email.com';
    RAISE NOTICE '   Password: password123';
    RAISE NOTICE '';
END $$;
