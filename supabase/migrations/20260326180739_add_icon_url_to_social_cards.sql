DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'social_cards'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'social_cards'
        AND column_name = 'icon_url'
    ) THEN
      ALTER TABLE public.social_cards
      ADD COLUMN icon_url text;
    END IF;
  ELSE
    RAISE EXCEPTION 'Tabela public.social_cards não existe';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'social_cards'
ORDER BY ordinal_position;
