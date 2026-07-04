-- =====================================================================
-- 3. Sá»­a phiáº¿u nháº­p â€” delegate delete + process (Ä‘Ã£ tá»± Ä‘á»™ng ghi Ä‘áº£o + má»›i)
-- =====================================================================
CREATE OR REPLACE FUNCTION update_import_v2(p_receipt_id TEXT, p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_receipt_id IS NULL OR p_receipt_id = '' THEN
    RAISE EXCEPTION 'MÃ£ phiáº¿u nháº­p cáº§n sá»­a khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng';
  END IF;

  p_payload := jsonb_set(p_payload, '{id}', to_jsonb(p_receipt_id));

  SELECT delete_import_v2(p_receipt_id) INTO v_result;

  RETURN process_import_v2(p_payload);
END;
$$;
