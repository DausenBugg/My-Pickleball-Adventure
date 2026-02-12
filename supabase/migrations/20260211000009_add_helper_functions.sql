-- Helper functions for updating win/loss counts
CREATE OR REPLACE FUNCTION increment_wins(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET wins = wins + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_losses(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET losses = losses + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
