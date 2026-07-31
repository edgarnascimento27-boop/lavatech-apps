
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'attendant');
CREATE TYPE public.queue_status AS ENUM ('aguardando','em_preparacao','lavando','finalizando','pronto','concluido','cancelado');
CREATE TYPE public.payment_method AS ENUM ('dinheiro','pix','cartao_credito','cartao_debito','outro');
CREATE TYPE public.appointment_status AS ENUM ('pendente','confirmado','cancelado','concluido','nao_compareceu');

-- ============ UPDATED_AT HELPER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  establishment_id UUID, -- FK adicionada abaixo
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, establishment_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_establishment_role(_user_id UUID, _establishment_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND establishment_id = _establishment_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_establishment_member(_user_id UUID, _establishment_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND establishment_id = _establishment_id);
$$;

CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ ESTABLISHMENTS ============
CREATE TABLE public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.establishments TO authenticated;
GRANT ALL ON public.establishments TO service_role;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "establishments_member_select" ON public.establishments FOR SELECT TO authenticated
  USING (public.is_establishment_member(auth.uid(), id));
CREATE POLICY "establishments_owner_insert" ON public.establishments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "establishments_owner_update" ON public.establishments FOR UPDATE TO authenticated
  USING (public.has_establishment_role(auth.uid(), id, 'owner'));
CREATE POLICY "establishments_owner_delete" ON public.establishments FOR DELETE TO authenticated
  USING (public.has_establishment_role(auth.uid(), id, 'owner'));
CREATE TRIGGER trg_establishments_updated BEFORE UPDATE ON public.establishments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FK tardia
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_establishment_fk FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE CASCADE;

-- Trigger: quando um establishment é criado, grava owner em user_roles
CREATE OR REPLACE FUNCTION public.grant_owner_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, establishment_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_establishments_owner_role AFTER INSERT ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION public.grant_owner_role();

-- ============ ESTABLISHMENT SETTINGS ============
CREATE TABLE public.establishment_settings (
  establishment_id UUID PRIMARY KEY REFERENCES public.establishments(id) ON DELETE CASCADE,
  open_time TIME,
  close_time TIME,
  working_days INT[] DEFAULT ARRAY[1,2,3,4,5,6],
  accepts_pix BOOLEAN DEFAULT TRUE,
  accepts_cards BOOLEAN DEFAULT TRUE,
  accepts_cash BOOLEAN DEFAULT TRUE,
  notify_customers BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.establishment_settings TO authenticated;
GRANT ALL ON public.establishment_settings TO service_role;
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_member_select" ON public.establishment_settings FOR SELECT TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id));
CREATE POLICY "settings_owner_manage" ON public.establishment_settings FOR ALL TO authenticated
  USING (public.has_establishment_role(auth.uid(), establishment_id, 'owner'))
  WITH CHECK (public.has_establishment_role(auth.uid(), establishment_id, 'owner'));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.establishment_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EMPLOYEES ============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role public.app_role NOT NULL DEFAULT 'attendant',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_member_select" ON public.employees FOR SELECT TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id));
CREATE POLICY "employees_manager_manage" ON public.employees FOR ALL TO authenticated
  USING (public.has_establishment_role(auth.uid(), establishment_id, 'owner') OR public.has_establishment_role(auth.uid(), establishment_id, 'manager'))
  WITH CHECK (public.has_establishment_role(auth.uid(), establishment_id, 'owner') OR public.has_establishment_role(auth.uid(), establishment_id, 'manager'));
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_employees_establishment ON public.employees(establishment_id);

-- ============ WASH TYPES ============
CREATE TABLE public.wash_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_minutes INT NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wash_types TO authenticated;
GRANT ALL ON public.wash_types TO service_role;
ALTER TABLE public.wash_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wash_types_member_select" ON public.wash_types FOR SELECT TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id));
CREATE POLICY "wash_types_manager_manage" ON public.wash_types FOR ALL TO authenticated
  USING (public.has_establishment_role(auth.uid(), establishment_id, 'owner') OR public.has_establishment_role(auth.uid(), establishment_id, 'manager'))
  WITH CHECK (public.has_establishment_role(auth.uid(), establishment_id, 'owner') OR public.has_establishment_role(auth.uid(), establishment_id, 'manager'));
CREATE TRIGGER trg_wash_types_updated BEFORE UPDATE ON public.wash_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_wash_types_establishment ON public.wash_types(establishment_id);

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_member_all" ON public.customers FOR ALL TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id))
  WITH CHECK (public.is_establishment_member(auth.uid(), establishment_id));
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_customers_establishment ON public.customers(establishment_id);
CREATE INDEX idx_customers_phone ON public.customers(establishment_id, phone);

-- ============ VEHICLES ============
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  model TEXT,
  color TEXT,
  vehicle_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_member_all" ON public.vehicles FOR ALL TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id))
  WITH CHECK (public.is_establishment_member(auth.uid(), establishment_id));
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_vehicles_customer ON public.vehicles(customer_id);
CREATE INDEX idx_vehicles_plate ON public.vehicles(establishment_id, license_plate);

-- ============ QUEUE ENTRIES ============
CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  wash_type_id UUID REFERENCES public.wash_types(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status public.queue_status NOT NULL DEFAULT 'aguardando',
  position INT,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  estimated_minutes INT,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_entries TO authenticated;
GRANT ALL ON public.queue_entries TO service_role;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_member_all" ON public.queue_entries FOR ALL TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id))
  WITH CHECK (public.is_establishment_member(auth.uid(), establishment_id));
CREATE TRIGGER trg_queue_updated BEFORE UPDATE ON public.queue_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_queue_establishment_status ON public.queue_entries(establishment_id, status);
CREATE INDEX idx_queue_arrived ON public.queue_entries(establishment_id, arrived_at DESC);

-- ============ QUEUE STATUS HISTORY ============
CREATE TABLE public.queue_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID NOT NULL REFERENCES public.queue_entries(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  from_status public.queue_status,
  to_status public.queue_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.queue_status_history TO authenticated;
GRANT ALL ON public.queue_status_history TO service_role;
ALTER TABLE public.queue_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_history_member_select" ON public.queue_status_history FOR SELECT TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id));

CREATE OR REPLACE FUNCTION public.log_queue_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.queue_status_history (queue_entry_id, establishment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NEW.establishment_id, OLD.status, NEW.status, auth.uid());
    IF NEW.status = 'lavando' AND NEW.started_at IS NULL THEN NEW.started_at := now(); END IF;
    IF NEW.status IN ('concluido','cancelado') AND NEW.finished_at IS NULL THEN NEW.finished_at := now(); END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_queue_status_change BEFORE UPDATE ON public.queue_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_queue_status_change();

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  wash_type_id UUID REFERENCES public.wash_types(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_member_all" ON public.appointments FOR ALL TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id))
  WITH CHECK (public.is_establishment_member(auth.uid(), establishment_id));
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_appointments_establishment_time ON public.appointments(establishment_id, scheduled_at);

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  queue_entry_id UUID NOT NULL REFERENCES public.queue_entries(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL,
  method public.payment_method NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_member_all" ON public.payments FOR ALL TO authenticated
  USING (public.is_establishment_member(auth.uid(), establishment_id))
  WITH CHECK (public.is_establishment_member(auth.uid(), establishment_id));
CREATE INDEX idx_payments_establishment ON public.payments(establishment_id, paid_at DESC);

-- ============ NEW USER: cria profile ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
