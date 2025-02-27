/*
  # Adicionar tabela de participantes de despesas

  1. Nova Tabela
    - `expense_participants`
      - `id` (uuid, chave primária)
      - `expense_id` (uuid, referência à tabela expenses)
      - `participant_id` (uuid, referência à tabela participants)
      - `amount` (decimal, valor que o participante deve pagar)
      - `created_at` (timestamp)
  2. Segurança
    - Habilitar RLS na tabela `expense_participants`
    - Adicionar políticas para usuários autenticados
*/

-- Criar tabela de participantes de despesas
CREATE TABLE IF NOT EXISTS expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  amount decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS expense_participants_expense_id_idx ON expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS expense_participants_participant_id_idx ON expense_participants(participant_id);

-- Habilitar RLS
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas de segurança
CREATE POLICY "Qualquer um pode visualizar participantes de despesas"
  ON expense_participants
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir participantes de despesas"
  ON expense_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar participantes de despesas"
  ON expense_participants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem excluir participantes de despesas"
  ON expense_participants
  FOR DELETE
  TO authenticated
  USING (true);