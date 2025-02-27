/*
  # Adicionar campo payer_id à tabela expenses

  1. Alterações
    - Adicionar coluna `payer_id` (uuid, referência à tabela participants) à tabela `expenses`
  2. Índices
    - Adicionar índice para melhorar performance de consultas
*/

-- Adicionar coluna payer_id à tabela expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'payer_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payer_id uuid REFERENCES participants(id);
    
    -- Adicionar índice para melhorar performance
    CREATE INDEX IF NOT EXISTS expenses_payer_id_idx ON expenses(payer_id);
  END IF;
END $$;