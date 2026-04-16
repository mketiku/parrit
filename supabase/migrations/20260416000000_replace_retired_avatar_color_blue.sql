-- Replace retired avatar color #3b82f6 (brand blue) with indigo #6366f1
-- This color was removed because it collides visually with app button colors.
UPDATE people
SET avatar_color_hex = '#6366f1'
WHERE avatar_color_hex = '#3b82f6';
