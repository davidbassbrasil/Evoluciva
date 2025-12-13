-- Habilitar RLS na view modules_with_stats
ALTER VIEW modules_with_stats SET (security_invoker = true);

-- Ou como alternativa, podemos criar políticas na tabela base modules
-- já que a view herda as permissões das tabelas subjacentes

-- Se preferir deletar a view e recriar como tabela materializada:
-- DROP VIEW IF EXISTS modules_with_stats;
