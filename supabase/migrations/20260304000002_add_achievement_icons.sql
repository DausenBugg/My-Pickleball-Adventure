-- ============================================================
-- Populate achievement icons with Ionicons icon names
-- These are rendered as <Ionicons name={icon} /> in the mobile app
-- Uses only trophy and ribbon style icons
-- ============================================================

-- Bronze tier → trophy (colored bronze via UI tier colors)
UPDATE public.achievements SET icon = 'trophy' WHERE tier = 'bronze';

-- Silver tier → trophy-outline
UPDATE public.achievements SET icon = 'trophy-outline' WHERE tier = 'silver';

-- Gold tier → trophy
UPDATE public.achievements SET icon = 'trophy' WHERE tier = 'gold';

-- Platinum tier → trophy
UPDATE public.achievements SET icon = 'trophy' WHERE tier = 'platinum';

-- Fallback for any achievements that might still be NULL
UPDATE public.achievements SET icon = 'trophy' WHERE icon IS NULL;
