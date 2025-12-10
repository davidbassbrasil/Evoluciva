# ⚠️ ERRO 500? EXECUTE ISTO PRIMEIRO! ⚠️

Se você está vendo este erro no console:

```
Failed to load resource: the server responded with a status of 500
jvfjvzotrqhlfwzcnixj.supabase.co/rest/v1/profiles
```

## Solução em 3 passos:

### 1️⃣ Abra o Supabase SQL Editor
👉 https://supabase.com/dashboard/project/jvfjvzotrqhlfwzcnixj/sql/new

### 2️⃣ Cole este SQL completo:

```sql
-- Quick Fix SQL - Execute este script se você está tendo erro 500
DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  full_name text,
  whatsapp text,
  cpf text,
  address text,
  number text,
  complement text,
  state text,
  city text,
  cep text,
  avatar text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  purchased_courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE name_text text := '';
BEGIN
  BEGIN name_text := COALESCE(NULLIF((NEW.raw_user_meta_data->>'name')::text, ''), NULLIF((NEW.raw_user_meta_data->>'full_name')::text, ''), '');
  EXCEPTION WHEN OTHERS THEN name_text := ''; END;
  INSERT INTO public.profiles (id, email, full_name, role, created_at) VALUES (NEW.id, NEW.email, name_text, 'student', now()) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auth_user_created_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_admins_or_own ON public.profiles FOR SELECT USING (id = auth.uid() OR role = 'admin');
CREATE POLICY profiles_insert_admin_or_self ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_admin_or_own ON public.profiles FOR UPDATE USING (id = auth.uid() OR role = 'admin') WITH CHECK (id = auth.uid() AND (role = 'student' OR role = (SELECT role FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY profiles_delete_admin_or_own ON public.profiles FOR DELETE USING (id = auth.uid() OR role = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', email) as full_name, 'student' as role, created_at
FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles) ON CONFLICT (id) DO NOTHING;
```

### 3️⃣ Clique em RUN (ou Ctrl+Enter)

Deve retornar: **"Success. No rows returned"**

---

## ✅ Teste agora:

1. Recarregue a página: http://localhost:8081
2. O erro 500 deve ter sumido
3. Faça um cadastro de teste em `/aluno/login`
4. Promova o usuário a admin:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'seu_email@example.com';
   ```

---

## 📚 Documentação completa

Veja `SUPABASE_SETUP.md` para mais detalhes e troubleshooting.
