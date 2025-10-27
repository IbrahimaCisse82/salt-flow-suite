-- Activer Realtime sur la table user_roles pour détecter les changements de rôles en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;