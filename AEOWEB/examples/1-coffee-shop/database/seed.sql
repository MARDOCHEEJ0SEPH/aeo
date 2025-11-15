-- Bean & Brew Coffee - Sample Data
-- Run this after schema.sql to populate database with realistic sample data

-- Insert Menu Categories
INSERT INTO menu_categories (name, slug, description, display_order) VALUES
('Espresso Drinks', 'espresso-drinks', 'Handcrafted espresso beverages', 1),
('Brewed Coffee', 'brewed-coffee', 'Pour-over and drip coffee', 2),
('Cold Drinks', 'cold-drinks', 'Iced and cold brew options', 3),
('Pastries', 'pastries', 'Fresh-baked daily', 4),
('Food', 'food', 'Sandwiches and breakfast items', 5);

-- Insert Menu Items
INSERT INTO menu_items (category_id, name, slug, description, price_small, price_medium, price_large, calories_small, calories_medium, calories_large, is_available, is_featured, dietary_tags) VALUES

-- Espresso Drinks
(1, 'Espresso', 'espresso', 'Double shot of rich, bold espresso from our signature blend', 4.50, NULL, NULL, 10, NULL, NULL, true, true, ARRAY['vegan-option']),
(1, 'Americano', 'americano', 'Espresso with hot water for a smooth, rich coffee', 4.75, 5.25, 5.75, 15, 20, 25, true, false, ARRAY['vegan-option']),
(1, 'Latte', 'latte', 'Espresso with steamed milk and light foam', 5.50, 6.00, 6.50, 150, 190, 240, true, true, ARRAY['vegetarian']),
(1, 'Cappuccino', 'cappuccino', 'Espresso with equal parts steamed and foamed milk', 5.50, 6.00, 6.50, 120, 150, 180, true, false, ARRAY['vegetarian']),
(1, 'Mocha', 'mocha', 'Espresso, chocolate, steamed milk, whipped cream', 6.00, 6.50, 7.00, 290, 360, 450, true, true, ARRAY['vegetarian']),
(1, 'Vanilla Bean Latte', 'vanilla-bean-latte', 'Latte with real vanilla bean - our signature drink', 5.75, 6.25, 6.75, 170, 220, 270, true, true, ARRAY['vegetarian']),
(1, 'Caramel Macchiato', 'caramel-macchiato', 'Vanilla, espresso, milk, caramel drizzle', 6.00, 6.50, 7.00, 240, 310, 380, true, false, ARRAY['vegetarian']),

-- Cold Drinks
(3, 'Nitro Cold Brew', 'nitro-cold-brew', 'Smooth, creamy cold brew infused with nitrogen - naturally sweet', NULL, 6.00, NULL, NULL, 5, NULL, true, true, ARRAY['vegan']),
(3, 'Cold Brew', 'cold-brew', 'Steeped for 24 hours for smooth, low-acid flavor', 5.00, 5.50, 6.00, 5, 10, 15, true, false, ARRAY['vegan']),
(3, 'Iced Latte', 'iced-latte', 'Espresso over ice with cold milk', 5.75, 6.25, 6.75, 140, 180, 220, true, false, ARRAY['vegetarian']),
(3, 'Iced Mocha', 'iced-mocha', 'Iced version of our signature mocha', 6.00, 6.50, 7.00, 280, 350, 440, true, false, ARRAY['vegetarian']),

-- Pastries
(4, 'Butter Croissant', 'butter-croissant', 'Buttery, flaky French croissant - baked fresh daily', 4.50, NULL, NULL, 280, NULL, NULL, true, true, ARRAY['vegetarian']),
(4, 'Chocolate Croissant', 'chocolate-croissant', 'Croissant filled with rich dark chocolate', 5.00, NULL, NULL, 320, NULL, NULL, true, false, ARRAY['vegetarian']),
(4, 'Blueberry Muffin', 'blueberry-muffin', 'Made with organic blueberries, baked fresh every morning', 4.00, NULL, NULL, 380, NULL, NULL, true, false, ARRAY['vegetarian']),
(4, 'Banana Nut Muffin', 'banana-nut-muffin', 'Moist banana muffin with walnuts', 4.00, NULL, NULL, 400, NULL, NULL, true, false, ARRAY['vegetarian']),
(4, 'Scone', 'scone', 'Traditional English scone - flavors rotate daily', 4.25, NULL, NULL, 350, NULL, NULL, true, false, ARRAY['vegetarian']),

-- Food
(5, 'Avocado Toast', 'avocado-toast', 'Sourdough toast, smashed avocado, everything bagel seasoning', 8.50, NULL, NULL, 280, NULL, NULL, true, true, ARRAY['vegan', 'vegetarian']),
(5, 'Breakfast Sandwich', 'breakfast-sandwich', 'Egg, cheese, choice of bacon or sausage on English muffin', 7.50, NULL, NULL, 450, NULL, NULL, true, false, ARRAY['vegetarian-option']),
(5, 'Bagel with Cream Cheese', 'bagel-cream-cheese', 'Fresh bagel with cream cheese', 4.50, NULL, NULL, 320, NULL, NULL, true, false, ARRAY['vegetarian']);

-- Insert Sample Daily Special
INSERT INTO daily_specials (date, menu_item_id, special_price, description) VALUES
(CURRENT_DATE, 1, 3.50, 'Happy Hour Special - $1 off all espresso drinks!');

-- Insert Sample Loyalty Members
INSERT INTO loyalty_members (customer_name, email, phone, points_balance, lifetime_points, tier, last_visit, total_spent) VALUES
('Sarah Chen', 'sarah.chen@email.com', '206-555-0101', 45, 145, 'silver', CURRENT_DATE - INTERVAL '2 days', 289.50),
('Michael Rodriguez', 'michael.r@email.com', '206-555-0102', 78, 278, 'gold', CURRENT_DATE, 556.75),
('Emily Parker', 'emily.parker@email.com', '206-555-0103', 12, 12, 'bronze', CURRENT_DATE - INTERVAL '5 days', 24.00);

-- Insert Sample Store Location
INSERT INTO store_locations (name, street_address, city, state, zip_code, phone, email, latitude, longitude, amenities) VALUES
('Bean & Brew Coffee - Pike Street', '742 Pike Street', 'Seattle', 'WA', '98101',
 '(206) 555-BREW', 'hello@beanandbrewcoffee.com', 47.6101, -122.3394,
 ARRAY['Free WiFi', 'Outdoor Seating', 'Wheelchair Accessible', 'Power Outlets', 'Pet Friendly']);

-- Insert Sample Customer Reviews
INSERT INTO customer_reviews (customer_name, email, rating, review_title, review_text, visit_date, is_verified, is_approved) VALUES
('Sarah Chen', 'sarah.chen@email.com', 5, 'Best coffee in Seattle!',
 'The pour-over is incredible and the baristas really know their craft. I work here 3-4 times a week - great WiFi and atmosphere.',
 CURRENT_DATE - INTERVAL '7 days', true, true),

('Michael Rodriguez', 'michael.r@email.com', 5, 'My daily ritual',
 'Bean & Brew has become my daily ritual. The consistency is amazing - every latte is perfect. Plus they remember my order which makes me feel like family.',
 CURRENT_DATE - INTERVAL '14 days', true, true),

('Emily Parker', 'emily.parker@email.com', 5, 'Love the outdoor seating!',
 'Dog-friendly, great coffee, and friendly staff. The nitro cold brew is addictive. This is THE spot in downtown Seattle.',
 CURRENT_DATE - INTERVAL '21 days', true, true),

('James Wilson', 'james.w@email.com', 4, 'Great coffee, busy during morning rush',
 'Excellent coffee quality. Gets very busy 8-9am but worth the wait. The avocado toast is delicious!',
 CURRENT_DATE - INTERVAL '30 days', true, true);

-- Insert Sample Orders
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, order_type, status, subtotal, tax, total, payment_method, created_at, completed_at) VALUES
('BRW-' || EXTRACT(EPOCH FROM NOW())::bigint, 'Sarah Chen', 'sarah.chen@email.com', '206-555-0101', 'online', 'completed', 10.50, 1.05, 11.55, 'credit_card', CURRENT_DATE - INTERVAL '1 hour', CURRENT_DATE - INTERVAL '45 minutes'),
('BRW-' || (EXTRACT(EPOCH FROM NOW())::bigint + 1), 'John Doe', 'john@email.com', '206-555-0104', 'in-store', 'completed', 15.00, 1.50, 16.50, 'cash', CURRENT_DATE - INTERVAL '2 hours', CURRENT_DATE - INTERVAL '2 hours');

-- Insert Sample Catering Request
INSERT INTO catering_requests (company_name, contact_name, email, phone, event_date, event_time, number_of_people, event_type, service_type, delivery_address, menu_preferences, budget_range, status) VALUES
('Tech Startup Inc', 'Lisa Johnson', 'lisa@techstartup.com', '206-555-0200',
 CURRENT_DATE + INTERVAL '14 days', '09:00:00', 25, 'Morning Meeting',
 'delivery', '1234 Tech Way, Seattle, WA 98109',
 'Coffee, pastries, and breakfast sandwiches', '$200-300', 'new');

-- Insert Sample Coffee Subscription
INSERT INTO coffee_subscriptions (customer_name, email, phone, shipping_address, coffee_preference, frequency, quantity, status, next_shipment_date) VALUES
('Robert Brown', 'robert.brown@email.com', '206-555-0105',
 '5678 Main St, Seattle, WA 98115', 'Signature Blend', 'biweekly', 2, 'active',
 CURRENT_DATE + INTERVAL '7 days');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'Menu items: % rows', (SELECT COUNT(*) FROM menu_items);
  RAISE NOTICE 'Loyalty members: % rows', (SELECT COUNT(*) FROM loyalty_members);
  RAISE NOTICE 'Reviews: % rows', (SELECT COUNT(*) FROM customer_reviews);
END $$;
