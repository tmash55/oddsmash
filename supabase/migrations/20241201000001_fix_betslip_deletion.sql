-- Fix betslip deletion to handle finalized betslips
-- Update the delete_betslip function to set original_betslip_id to NULL in finalized_betslips before deleting

CREATE OR REPLACE FUNCTION delete_betslip(p_betslip_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, update any finalized betslips that reference this betslip
  -- Set original_betslip_id to NULL so they become standalone records
  UPDATE finalized_betslips
  SET original_betslip_id = NULL
  WHERE original_betslip_id = p_betslip_id;
  
  -- Now delete the betslip (selections will be cascade deleted)
  DELETE FROM betslips
  WHERE id = p_betslip_id;
  
  RETURN FOUND;
END;
$$; 