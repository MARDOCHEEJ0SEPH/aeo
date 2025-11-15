-- Luxe Hair Studio - Sample Data
-- Populate database with realistic salon data for testing

-- Service Categories
INSERT INTO service_categories (name, slug, description, display_order) VALUES
('Hair Color', 'hair-color', 'Professional color services from subtle highlights to bold transformations', 1),
('Hair Extensions', 'hair-extensions', 'Premium quality hair extensions for length and volume', 2),
('Special Occasions', 'special-occasions', 'Bridal styling and special event hair services', 3),
('Haircuts & Styling', 'haircuts-styling', 'Expert cuts and styling for all hair types', 4),
('Treatments', 'treatments', 'Deep conditioning and repair treatments', 5);

-- Services
INSERT INTO services (category_id, name, slug, description, duration_minutes, price_from, price_to, requires_consultation, is_available, image_url) VALUES
-- Hair Color
(1, 'Balayage', 'balayage', 'Hand-painted highlights for a natural, sun-kissed look', 180, 250.00, 400.00, false, true, '/assets/images/services/balayage.jpg'),
(1, 'Full Color', 'full-color', 'Complete color transformation with all-over color', 150, 180.00, 280.00, false, true, '/assets/images/services/full-color.jpg'),
(1, 'Highlights', 'highlights', 'Traditional foil highlights for dimension and brightness', 150, 200.00, 350.00, false, true, '/assets/images/services/highlights.jpg'),
(1, 'Color Correction', 'color-correction', 'Fix previous color mishaps and achieve your dream color', 240, 400.00, 800.00, true, true, '/assets/images/services/color-correction.jpg'),
(1, 'Ombre', 'ombre', 'Gradual color transition from dark roots to light ends', 180, 220.00, 380.00, false, true, '/assets/images/services/ombre.jpg'),

-- Hair Extensions
(2, 'Tape-In Extensions', 'tape-in-extensions', 'Semi-permanent extensions that last 6-8 weeks', 120, 400.00, 800.00, true, true, '/assets/images/services/tape-extensions.jpg'),
(2, 'Clip-In Extensions', 'clip-in-extensions', 'Temporary extensions you can apply and remove daily', 60, 150.00, 300.00, false, true, '/assets/images/services/clip-extensions.jpg'),
(2, 'Sew-In Extensions', 'sew-in-extensions', 'Long-lasting braided track extensions', 240, 600.00, 1200.00, true, true, '/assets/images/services/sew-in-extensions.jpg'),

-- Special Occasions
(3, 'Bridal Hair', 'bridal-hair', 'Complete bridal hair including trial and day-of styling', 120, 300.00, 500.00, true, true, '/assets/images/services/bridal.jpg'),
(3, 'Special Event Updo', 'special-event-updo', 'Elegant upstyles for weddings, galas, and special events', 90, 150.00, 250.00, false, true, '/assets/images/services/updo.jpg'),
(3, 'Blowout & Style', 'blowout-style', 'Professional blowout with styling', 60, 65.00, 95.00, false, true, '/assets/images/services/blowout.jpg'),

-- Haircuts & Styling
(4, 'Women\'s Haircut', 'womens-haircut', 'Precision cut tailored to your face shape and style', 60, 85.00, 150.00, false, true, '/assets/images/services/womens-cut.jpg'),
(4, 'Men\'s Haircut', 'mens-haircut', 'Sharp, modern cuts for men', 45, 55.00, 85.00, false, true, '/assets/images/services/mens-cut.jpg'),
(4, 'Curly Hair Cut', 'curly-hair-cut', 'Specialized cutting techniques for curly and textured hair', 75, 95.00, 165.00, false, true, '/assets/images/services/curly-cut.jpg'),
(4, 'Bang Trim', 'bang-trim', 'Quick bang refresh between full haircuts', 15, 20.00, 30.00, false, true, '/assets/images/services/bang-trim.jpg'),

-- Treatments
(5, 'Keratin Treatment', 'keratin-treatment', 'Smoothing treatment that reduces frizz for up to 3 months', 180, 300.00, 500.00, false, true, '/assets/images/services/keratin.jpg'),
(5, 'Deep Conditioning', 'deep-conditioning', 'Intensive moisture treatment for dry, damaged hair', 45, 50.00, 85.00, false, true, '/assets/images/services/deep-conditioning.jpg'),
(5, 'Olaplex Treatment', 'olaplex-treatment', 'Bond-building treatment to repair and strengthen hair', 30, 75.00, 95.00, false, true, '/assets/images/services/olaplex.jpg');

-- Stylists
INSERT INTO stylists (first_name, last_name, slug, title, bio, specialties, years_experience, certifications, photo_url, instagram_handle, is_accepting_clients, is_active) VALUES
('Sophia', 'Martinez', 'sophia-martinez', 'Master Colorist & Owner',
 'With over 15 years of experience, Sophia specializes in dimensional color and balayage techniques. She trained at Vidal Sassoon Academy in London and has worked with celebrities and fashion industry professionals.',
 ARRAY['Balayage', 'Color Correction', 'Dimensional Color'],
 15,
 ARRAY['Vidal Sassoon Master Colorist', 'Redken Certified', 'Olaplex Certified'],
 '/assets/images/stylists/sophia.jpg',
 '@sophiacolors',
 true, true),

('Isabella', 'Chen', 'isabella-chen', 'Senior Stylist & Extension Specialist',
 'Isabella has been perfecting her craft for 10 years, with advanced training in hair extensions and bridal styling. She has a passion for creating natural-looking volume and length transformations.',
 ARRAY['Hair Extensions', 'Bridal Styling', 'Special Events'],
 10,
 ARRAY['Hair Extension Specialist Certification', 'Bridal Hair Master Class'],
 '/assets/images/stylists/isabella.jpg',
 '@isabellaextensions',
 true, true),

('Marcus', 'Thompson', 'marcus-thompson', 'Curl Specialist',
 'Marcus specializes in curly and textured hair, having trained extensively in DevaCurl and Ouidad cutting techniques. He understands the unique needs of curly hair and creates cuts that enhance natural texture.',
 ARRAY['Curly Hair', 'Textured Hair', 'Deva Cuts'],
 8,
 ARRAY['DevaCurl Certified', 'Ouidad Certified Stylist'],
 '/assets/images/stylists/marcus.jpg',
 '@marcuscurls',
 true, true),

('Olivia', 'Park', 'olivia-park', 'Color & Cutting Specialist',
 'Olivia is known for her modern, fashion-forward cuts and vibrant color work. She stays on top of the latest trends and techniques, regularly attending advanced education classes.',
 ARRAY['Modern Cuts', 'Vivid Colors', 'Balayage'],
 7,
 ARRAY['Pravana Vivids Certified', 'Goldwell Color Specialist'],
 '/assets/images/stylists/olivia.jpg',
 '@oliviahairart',
 true, true),

('James', 'Rodriguez', 'james-rodriguez', 'Senior Stylist',
 'James brings 12 years of experience in high-end salons. He excels at classic and contemporary styling, with a keen eye for what works best for each client\'s lifestyle.',
 ARRAY['Precision Cuts', 'Mens Grooming', 'Styling'],
 12,
 ARRAY['Bumble and bumble University Graduate', 'American Board Certified Haircolorist'],
 '/assets/images/stylists/james.jpg',
 '@jamesrodriguezhair',
 true, true);

-- Stylist Services (connecting stylists to their services)
-- Sophia (Master Colorist) - All color services
INSERT INTO stylist_services (stylist_id, service_id, custom_price) VALUES
(1, 1, NULL), -- Balayage
(1, 2, NULL), -- Full Color
(1, 3, NULL), -- Highlights
(1, 4, NULL), -- Color Correction
(1, 5, NULL), -- Ombre
(1, 12, NULL), -- Women's Haircut
(1, 16, NULL), -- Keratin Treatment
(1, 18, NULL); -- Olaplex Treatment

-- Isabella (Extension & Bridal Specialist)
INSERT INTO stylist_services (stylist_id, service_id, custom_price) VALUES
(2, 6, NULL), -- Tape-In Extensions
(2, 7, NULL), -- Clip-In Extensions
(2, 8, NULL), -- Sew-In Extensions
(2, 9, NULL), -- Bridal Hair
(2, 10, NULL), -- Special Event Updo
(2, 11, NULL), -- Blowout & Style
(2, 12, NULL); -- Women's Haircut

-- Marcus (Curl Specialist)
INSERT INTO stylist_services (stylist_id, service_id, custom_price) VALUES
(3, 14, NULL), -- Curly Hair Cut
(3, 12, NULL), -- Women's Haircut
(3, 13, NULL), -- Men's Haircut
(3, 11, NULL), -- Blowout & Style
(3, 17, NULL); -- Deep Conditioning

-- Olivia (Color & Cutting Specialist)
INSERT INTO stylist_services (stylist_id, service_id, custom_price) VALUES
(4, 1, NULL), -- Balayage
(4, 2, NULL), -- Full Color
(4, 3, NULL), -- Highlights
(4, 5, NULL), -- Ombre
(4, 12, NULL), -- Women's Haircut
(4, 14, NULL), -- Curly Hair Cut
(4, 11, NULL); -- Blowout & Style

-- James (Senior Stylist - All Cuts)
INSERT INTO stylist_services (stylist_id, service_id, custom_price) VALUES
(5, 12, NULL), -- Women's Haircut
(5, 13, NULL), -- Men's Haircut
(5, 14, NULL), -- Curly Hair Cut
(5, 15, NULL), -- Bang Trim
(5, 11, NULL), -- Blowout & Style
(5, 2, NULL), -- Full Color
(5, 3, NULL); -- Highlights

-- Stylist Schedules
-- Sophia: Tuesday-Saturday, 10am-6pm
INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, is_available) VALUES
(1, 2, '10:00', '18:00', true), -- Tuesday
(1, 3, '10:00', '18:00', true), -- Wednesday
(1, 4, '10:00', '18:00', true), -- Thursday
(1, 5, '10:00', '18:00', true), -- Friday
(1, 6, '10:00', '18:00', true); -- Saturday

-- Isabella: Monday-Friday, 9am-5pm
INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, is_available) VALUES
(2, 1, '09:00', '17:00', true), -- Monday
(2, 2, '09:00', '17:00', true), -- Tuesday
(2, 3, '09:00', '17:00', true), -- Wednesday
(2, 4, '09:00', '17:00', true), -- Thursday
(2, 5, '09:00', '17:00', true); -- Friday

-- Marcus: Wednesday-Sunday, 11am-7pm
INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, is_available) VALUES
(3, 3, '11:00', '19:00', true), -- Wednesday
(3, 4, '11:00', '19:00', true), -- Thursday
(3, 5, '11:00', '19:00', true), -- Friday
(3, 6, '11:00', '19:00', true), -- Saturday
(3, 0, '11:00', '19:00', true); -- Sunday

-- Olivia: Tuesday-Saturday, 10am-6pm
INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, is_available) VALUES
(4, 2, '10:00', '18:00', true), -- Tuesday
(4, 3, '10:00', '18:00', true), -- Wednesday
(4, 4, '10:00', '18:00', true), -- Thursday
(4, 5, '10:00', '18:00', true), -- Friday
(4, 6, '10:00', '18:00', true); -- Saturday

-- James: Monday-Friday, 10am-7pm
INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, is_available) VALUES
(5, 1, '10:00', '19:00', true), -- Monday
(5, 2, '10:00', '19:00', true), -- Tuesday
(5, 3, '10:00', '19:00', true), -- Wednesday
(5, 4, '10:00', '19:00', true), -- Thursday
(5, 5, '10:00', '19:00', true); -- Friday

-- Sample Customers
INSERT INTO customers (first_name, last_name, email, phone, hair_type, hair_length, hair_color, total_visits, total_spent, last_visit) VALUES
('Emma', 'Williams', 'emma.williams@email.com', '310-555-0101', 'wavy', 'medium', 'brown', 12, 2450.00, '2025-10-28'),
('Ava', 'Johnson', 'ava.johnson@email.com', '310-555-0102', 'straight', 'long', 'blonde', 8, 1890.00, '2025-11-05'),
('Michael', 'Brown', 'michael.brown@email.com', '310-555-0103', 'straight', 'short', 'black', 15, 1275.00, '2025-11-10'),
('Sarah', 'Davis', 'sarah.davis@email.com', '310-555-0104', 'curly', 'medium', 'auburn', 6, 980.00, '2025-10-22'),
('Jessica', 'Miller', 'jessica.miller@email.com', '310-555-0105', 'wavy', 'long', 'brunette', 10, 2100.00, '2025-11-08');

-- Sample Appointments (upcoming)
INSERT INTO appointments (customer_id, stylist_id, service_id, appointment_date, start_time, end_time, status, customer_notes) VALUES
(1, 1, 1, '2025-11-20', '10:00', '13:00', 'confirmed', 'Please focus on face-framing pieces'),
(2, 2, 9, '2025-11-22', '09:00', '11:00', 'scheduled', 'Wedding on Nov 30th - trial run'),
(3, 5, 13, '2025-11-18', '14:00', '14:45', 'confirmed', NULL),
(4, 3, 14, '2025-11-25', '11:00', '12:15', 'scheduled', 'Want to enhance natural curl pattern'),
(5, 4, 1, '2025-11-21', '13:00', '16:00', 'confirmed', 'Looking for a warm honey balayage');

-- Sample Products (Retail)
INSERT INTO products (name, brand, category, description, price, size, stock_quantity, sku, is_available) VALUES
('Moisture Shampoo', 'Oribe', 'shampoo', 'Luxurious hydrating shampoo for all hair types', 49.00, '8.5 oz', 24, 'ORI-SHP-001', true),
('Gold Lust Conditioner', 'Oribe', 'conditioner', 'Rejuvenating conditioner for youthful shine', 50.00, '6.8 oz', 18, 'ORI-CND-001', true),
('Dry Texturizing Spray', 'Oribe', 'styling', 'Build in incredible volume and sexy texture', 48.00, '5.5 oz', 30, 'ORI-STY-001', true),
('No. 3 Hair Perfector', 'Olaplex', 'treatment', 'At-home bond building treatment', 30.00, '3.3 oz', 45, 'OLA-TRT-003', true),
('Purple Shampoo', 'Redken', 'shampoo', 'Tone and brighten blonde hair', 28.00, '10.1 oz', 22, 'RED-SHP-002', true),
('Curl Defining Cream', 'DevaCurl', 'styling', 'Define curls with long-lasting hold', 32.00, '5.1 oz', 28, 'DEV-STY-001', true),
('Heat Protectant Spray', 'Living Proof', 'styling', 'Protect hair from heat damage up to 450°F', 29.00, '6 oz', 35, 'LPR-STY-002', true),
('Hair Oil', 'Moroccanoil', 'treatment', 'Argan oil treatment for all hair types', 44.00, '3.4 oz', 40, 'MOR-TRT-001', true);

-- Sample Reviews (Approved)
INSERT INTO reviews (customer_id, stylist_id, rating, review_title, review_text, is_approved, created_at) VALUES
(1, 1, 5, 'Best balayage I\'ve ever had!',
 'Sophia is absolutely amazing! She listened to exactly what I wanted and created the perfect sun-kissed balayage. The color is so natural and blends beautifully. I get compliments every day!',
 true, NOW() - INTERVAL '15 days'),

(2, 2, 5, 'Wedding hair dreams came true',
 'Isabella made me feel like a princess on my wedding day. The trial was perfect, and the actual day was flawless. My hair stayed perfect for 12+ hours through the ceremony, photos, and dancing!',
 true, NOW() - INTERVAL '8 days'),

(3, 5, 5, 'Great cut, always consistent',
 'James has been cutting my hair for over a year. He\'s always professional, remembers how I like it, and the cut always looks sharp. Highly recommend!',
 true, NOW() - INTERVAL '5 days'),

(4, 3, 5, 'Finally found a curly hair expert!',
 'As someone with 3B curls, finding a stylist who knows how to cut curly hair is challenging. Marcus is THE BEST. He cut my hair dry, knew exactly what he was doing, and my curls have never looked better!',
 true, NOW() - INTERVAL '22 days'),

(5, 4, 5, 'Obsessed with my new color!',
 'Olivia gave me the most beautiful honey balayage. The color is exactly what I showed her in the photos, and it looks so natural. She\'s also super sweet and fun to talk to during the appointment.',
 true, NOW() - INTERVAL '7 days');

-- Sample Gift Cards
INSERT INTO gift_cards (card_number, purchaser_name, purchaser_email, recipient_name, recipient_email, initial_amount, current_balance, status, expiration_date) VALUES
('LHS-GC2025-001', 'David Wilson', 'david.wilson@email.com', 'Rachel Wilson', 'rachel.wilson@email.com', 200.00, 200.00, 'active', '2026-11-15'),
('LHS-GC2025-002', 'Lisa Anderson', 'lisa.anderson@email.com', 'Mom', 'mom@email.com', 150.00, 75.00, 'active', '2026-11-15'),
('LHS-GC2025-003', 'Corporate Gifts Inc', 'gifts@corporate.com', 'Employee Rewards', NULL, 500.00, 500.00, 'active', '2026-12-31');

-- Sample Promotions
INSERT INTO promotions (name, description, discount_type, discount_value, promo_code, valid_from, valid_until, max_uses, current_uses, is_active) VALUES
('New Client Special', 'First visit discount for new clients', 'percentage', 20, 'WELCOME20', '2025-11-01', '2025-12-31', 100, 12, true),
('Holiday Gift Card Bonus', 'Get $25 bonus card with $100 gift card purchase', 'fixed_amount', 25, 'HOLIDAY25', '2025-11-15', '2025-12-24', 50, 3, true),
('Refer a Friend', 'Both you and your friend get $30 off', 'fixed_amount', 30, 'REFER30', '2025-11-01', '2026-01-31', 200, 8, true);

COMMENT ON TABLE customers IS 'Hair salon client database with preferences and history';
COMMENT ON TABLE appointments IS 'Booking system for salon appointments with stylist availability';
COMMENT ON TABLE service_history IS 'Track formulas, colors used, and results for client retention';
