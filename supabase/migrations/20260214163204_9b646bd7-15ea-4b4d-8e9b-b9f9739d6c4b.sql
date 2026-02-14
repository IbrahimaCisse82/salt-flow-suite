
-- Nettoyer les doublons dans chart_of_accounts pour le tenant admin
-- Garder l'enregistrement le plus ancien (original), supprimer les doublons récents du seed
DELETE FROM chart_of_accounts
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY account_number, tenant_id 
        ORDER BY created_at ASC
      ) as rn
    FROM chart_of_accounts
  ) ranked
  WHERE rn > 1
);
