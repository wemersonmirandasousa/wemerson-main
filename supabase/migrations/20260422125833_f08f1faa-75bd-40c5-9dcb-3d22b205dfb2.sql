-- 1. Update 'Comunidade' (blue button) to become 'Notas'
UPDATE public.social_cards 
SET 
  titulo = 'Notas',
  url = '#notes',
  icon = 'notes',
  descricao = 'Minhas notas pessoais'
WHERE id = '534e3a96-ffc4-481e-9dbd-7df551503556';

-- 2. Remove old 'Notas' card
DELETE FROM public.social_cards 
WHERE id = 'db03cc2b-69b2-4cd6-9b4d-18b23de1702a';

-- 3. Remove 'Processos' card
DELETE FROM public.social_cards 
WHERE id = 'ef957cb5-5826-4cc1-b5a5-a75fdc2004a5';

-- 4. Rename 'Notas (ChatDocs)' to 'ChatDocs'
UPDATE public.social_cards 
SET 
  titulo = 'ChatDocs'
WHERE id = '5efa2ccd-4ace-423d-b583-55f40c829344';
