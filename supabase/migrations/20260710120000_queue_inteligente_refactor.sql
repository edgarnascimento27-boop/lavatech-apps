-- ============================================
-- LavaTech: Reestruturação para Fila Inteligente
-- ============================================

-- 1) Remover dependências legadas de agendamentos
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.appointments;

DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TYPE IF EXISTS public.appointment_status;

-- 2) Criar novo enum de status e migrar coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status_new') THEN
    DROP TYPE public.queue_status_new;
  END IF;
END $$;

CREATE TYPE public.queue_status_new AS ENUM (
  'aguardando',
  'chamado',
  'em_atendimento',
  'finalizado',
  'nao_compareceu',
  'cancelado'
);

ALTER TABLE public.queue_entries
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.queue_entries
  ALTER COLUMN status TYPE public.queue_status_new
  USING (
    CASE status::text
      WHEN 'aguardando' THEN 'aguardando'
      WHEN 'em_preparacao' THEN 'aguardando'
      WHEN 'lavando' THEN 'em_atendimento'
      WHEN 'finalizando' THEN 'em_atendimento'
      WHEN 'pronto' THEN 'chamado'
      WHEN 'concluido' THEN 'finalizado'
      WHEN 'cancelado' THEN 'cancelado'
      ELSE 'aguardando'
    END
  )::public.queue_status_new;

ALTER TABLE public.queue_status_history
  ALTER COLUMN from_status TYPE public.queue_status_new
  USING (
    CASE
      WHEN from_status IS NULL THEN NULL
      WHEN from_status::text = 'aguardando' THEN 'aguardando'
      WHEN from_status::text = 'em_preparacao' THEN 'aguardando'
      WHEN from_status::text = 'lavando' THEN 'em_atendimento'
      WHEN from_status::text = 'finalizando' THEN 'em_atendimento'
      WHEN from_status::text = 'pronto' THEN 'chamado'
      WHEN from_status::text = 'concluido' THEN 'finalizado'
      WHEN from_status::text = 'cancelado' THEN 'cancelado'
      ELSE 'aguardando'
    END
  )::public.queue_status_new;

ALTER TABLE public.queue_status_history
  ALTER COLUMN to_status TYPE public.queue_status_new
  USING (
    CASE to_status::text
      WHEN 'aguardando' THEN 'aguardando'
      WHEN 'em_preparacao' THEN 'aguardando'
      WHEN 'lavando' THEN 'em_atendimento'
      WHEN 'finalizando' THEN 'em_atendimento'
      WHEN 'pronto' THEN 'chamado'
      WHEN 'concluido' THEN 'finalizado'
      WHEN 'cancelado' THEN 'cancelado'
      ELSE 'aguardando'
    END
  )::public.queue_status_new;

DROP TYPE public.queue_status;
ALTER TYPE public.queue_status_new RENAME TO queue_status;

ALTER TABLE public.queue_entries
  ALTER COLUMN status SET DEFAULT 'aguardando';

-- 3) Origem do cliente e metadados de operação
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_source') THEN
    CREATE TYPE public.queue_source AS ENUM ('app', 'presencial');
  END IF;
END $$;

ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS source public.queue_source NOT NULL DEFAULT 'app',
  ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ;

-- 4) Configuração operacional por estabelecimento
ALTER TABLE public.establishment_settings
  ADD COLUMN IF NOT EXISTS queue_boxes INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS active_attendants INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS no_show_window_minutes INT NOT NULL DEFAULT 10;

-- 5) Aprendizado de tempos médios por serviço
ALTER TABLE public.wash_types
  ADD COLUMN IF NOT EXISTS historical_avg_minutes INT,
  ADD COLUMN IF NOT EXISTS completed_services_count INT NOT NULL DEFAULT 0;

-- 6) Notificações de fila
CREATE TABLE IF NOT EXISTS public.queue_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.queue_notifications TO authenticated;
GRANT ALL ON public.queue_notifications TO service_role;

ALTER TABLE public.queue_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "queue_notifications_member_select" ON public.queue_notifications;
CREATE POLICY "queue_notifications_member_select"
ON public.queue_notifications
FOR SELECT
TO authenticated
USING (public.is_establishment_member(auth.uid(), establishment_id));

DROP POLICY IF EXISTS "queue_notifications_member_insert" ON public.queue_notifications;
CREATE POLICY "queue_notifications_member_insert"
ON public.queue_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_establishment_member(auth.uid(), establishment_id));

CREATE INDEX IF NOT EXISTS idx_queue_notifications_establishment
  ON public.queue_notifications(establishment_id, sent_at DESC);

-- 7) Funções de cálculo e atualização de fila

-- 7.1 Atualizar posições (fila única)
CREATE OR REPLACE FUNCTION public.recalculate_queue_positions(_establishment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH ordered AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY arrived_at ASC, created_at ASC) AS new_position
    FROM public.queue_entries
    WHERE establishment_id = _establishment_id
      AND status IN ('aguardando', 'chamado')
  )
  UPDATE public.queue_entries q
  SET position = o.new_position,
      updated_at = now()
  FROM ordered o
  WHERE q.id = o.id;

  UPDATE public.queue_entries
  SET position = NULL,
      updated_at = now()
  WHERE establishment_id = _establishment_id
    AND status NOT IN ('aguardando', 'chamado')
    AND position IS NOT NULL;
END;
$$;

-- 7.2 Tempo médio efetivo do serviço (configurado + histórico)
CREATE OR REPLACE FUNCTION public.get_effective_service_minutes(_wash_type_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT GREATEST(
    1,
    COALESCE(historical_avg_minutes, estimated_minutes, 30)
  )::INT
  FROM public.wash_types
  WHERE id = _wash_type_id;
$$;

-- 7.3 Recalcular estimativa dos itens da fila
CREATE OR REPLACE FUNCTION public.recalculate_queue_estimates(_establishment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity INT := 1;
  v_running_count INT := 0;
BEGIN
  SELECT GREATEST(1, LEAST(
      COALESCE(queue_boxes, 1),
      COALESCE(active_attendants, 1)
    ))
  INTO v_capacity
  FROM public.establishment_settings
  WHERE establishment_id = _establishment_id;

  IF v_capacity IS NULL THEN
    v_capacity := 1;
  END IF;

  SELECT COUNT(*)
  INTO v_running_count
  FROM public.queue_entries
  WHERE establishment_id = _establishment_id
    AND status = 'em_atendimento';

  WITH waiting AS (
    SELECT
      q.id,
      q.position,
      COALESCE(public.get_effective_service_minutes(q.wash_type_id), 30) AS svc_minutes
    FROM public.queue_entries q
    WHERE q.establishment_id = _establishment_id
      AND q.status IN ('aguardando', 'chamado')
    ORDER BY q.position ASC NULLS LAST, q.arrived_at ASC
  ),
  calc AS (
    SELECT
      w.id,
      CASE
        WHEN w.position IS NULL THEN NULL
        ELSE (
          GREATEST(0, CEIL((w.position::numeric - v_capacity)::numeric / v_capacity))::INT
          * w.svc_minutes
        ) + CASE WHEN v_running_count > 0 THEN w.svc_minutes ELSE 0 END
      END AS est_min
    FROM waiting w
  )
  UPDATE public.queue_entries q
  SET estimated_minutes = c.est_min,
      updated_at = now()
  FROM calc c
  WHERE q.id = c.id;
END;
$$;

-- 7.4 Indicador de movimento
CREATE OR REPLACE FUNCTION public.get_queue_movement_label(_estimated_minutes INT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF _estimated_minutes IS NULL OR _estimated_minutes <= 15 THEN
    RETURN '🟢 Atendimento rápido';
  ELSIF _estimated_minutes <= 25 THEN
    RETURN '🔵 Pouco movimento';
  ELSIF _estimated_minutes <= 45 THEN
    RETURN '🟠 Movimento moderado';
  ELSE
    RETURN '🔴 Muito movimento';
  END IF;
END;
$$;

-- 7.5 Aprendizado de média histórica ao finalizar atendimento
CREATE OR REPLACE FUNCTION public.update_wash_type_historical_average(_queue_entry_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wash_type_id UUID;
  v_started_at TIMESTAMPTZ;
  v_finished_at TIMESTAMPTZ;
  v_duration_minutes INT;
BEGIN
  SELECT wash_type_id, started_at, finished_at
  INTO v_wash_type_id, v_started_at, v_finished_at
  FROM public.queue_entries
  WHERE id = _queue_entry_id;

  IF v_wash_type_id IS NULL OR v_started_at IS NULL OR v_finished_at IS NULL THEN
    RETURN;
  END IF;

  v_duration_minutes := GREATEST(
    1,
    ROUND(EXTRACT(EPOCH FROM (v_finished_at - v_started_at)) / 60.0)::INT
  );

  UPDATE public.wash_types wt
  SET historical_avg_minutes = ROUND(
      (
        COALESCE(wt.historical_avg_minutes, wt.estimated_minutes, 30) * wt.completed_services_count
        + v_duration_minutes
      )::numeric / (wt.completed_services_count + 1)
    )::INT,
    completed_services_count = wt.completed_services_count + 1,
    updated_at = now()
  WHERE wt.id = v_wash_type_id;
END;
$$;

-- 8) Trigger central de manutenção da fila
DROP TRIGGER IF EXISTS trg_queue_status_change ON public.queue_entries;

CREATE OR REPLACE FUNCTION public.on_queue_entry_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notify_enabled BOOLEAN := TRUE;
  v_no_show_window INT := 10;
  v_vehicles_ahead INT := 0;
  v_estimated INT := 0;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.queue_status_history (queue_entry_id, establishment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NEW.establishment_id, OLD.status, NEW.status, auth.uid());

    IF NEW.status = 'chamado' AND NEW.called_at IS NULL THEN
      NEW.called_at := now();
      SELECT COALESCE(no_show_window_minutes, 10)
      INTO v_no_show_window
      FROM public.establishment_settings
      WHERE establishment_id = NEW.establishment_id;
      NEW.no_show_deadline_at := now() + make_interval(mins => v_no_show_window);
    END IF;

    IF NEW.status = 'em_atendimento' AND NEW.started_at IS NULL THEN
      NEW.started_at := now();
      NEW.check_in_at := now();
    END IF;

    IF NEW.status IN ('finalizado','cancelado','nao_compareceu') AND NEW.finished_at IS NULL THEN
      NEW.finished_at := now();
    END IF;
  END IF;

  PERFORM public.recalculate_queue_positions(COALESCE(NEW.establishment_id, OLD.establishment_id));
  PERFORM public.recalculate_queue_estimates(COALESCE(NEW.establishment_id, OLD.establishment_id));

  IF TG_OP = 'UPDATE' AND NEW.status = 'finalizado' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.update_wash_type_historical_average(NEW.id);
  END IF;

  SELECT COALESCE(notify_customers, TRUE)
  INTO v_notify_enabled
  FROM public.establishment_settings
  WHERE establishment_id = COALESCE(NEW.establishment_id, OLD.establishment_id);

  IF v_notify_enabled IS TRUE THEN
    IF TG_OP = 'INSERT' THEN
      SELECT COUNT(*)::INT
      INTO v_vehicles_ahead
      FROM public.queue_entries
      WHERE establishment_id = NEW.establishment_id
        AND status IN ('aguardando','chamado')
        AND position < NEW.position;

      INSERT INTO public.queue_notifications (
        establishment_id, queue_entry_id, customer_id, title, message, payload
      ) VALUES (
        NEW.establishment_id,
        NEW.id,
        NEW.customer_id,
        'Você entrou na fila',
        format('Existem %s veículos à sua frente.', COALESCE(v_vehicles_ahead, 0)),
        jsonb_build_object('position', NEW.position, 'vehiclesAhead', COALESCE(v_vehicles_ahead, 0))
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'chamado' THEN
        INSERT INTO public.queue_notifications (
          establishment_id, queue_entry_id, customer_id, title, message, payload
        ) VALUES (
          NEW.establishment_id,
          NEW.id,
          NEW.customer_id,
          'Dirija-se ao estabelecimento',
          'Seu atendimento será iniciado em breve. Você possui 10 minutos para chegar.',
          jsonb_build_object('status', NEW.status, 'deadline', NEW.no_show_deadline_at)
        );
      ELSIF NEW.status = 'em_atendimento' THEN
        INSERT INTO public.queue_notifications (
          establishment_id, queue_entry_id, customer_id, title, message, payload
        ) VALUES (
          NEW.establishment_id,
          NEW.id,
          NEW.customer_id,
          'Seu atendimento começou',
          'Seu veículo já está em atendimento.',
          jsonb_build_object('status', NEW.status)
        );
      ELSIF NEW.status = 'nao_compareceu' THEN
        INSERT INTO public.queue_notifications (
          establishment_id, queue_entry_id, customer_id, title, message, payload
        ) VALUES (
          NEW.establishment_id,
          NEW.id,
          NEW.customer_id,
          'Não compareceu',
          'Sua entrada na fila foi marcada como não compareceu.',
          jsonb_build_object('status', NEW.status)
        );
      END IF;
    END IF;

    -- alerta de "faltam ~15 minutos"
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
      SELECT estimated_minutes INTO v_estimated
      FROM public.queue_entries
      WHERE id = NEW.id;

      IF v_estimated IS NOT NULL AND v_estimated <= 15 AND NEW.status IN ('aguardando','chamado') THEN
        INSERT INTO public.queue_notifications (
          establishment_id, queue_entry_id, customer_id, title, message, payload
        ) VALUES (
          NEW.establishment_id,
          NEW.id,
          NEW.customer_id,
          'Faltam aproximadamente 15 minutos',
          'Prepare-se para dirigir-se ao estabelecimento.',
          jsonb_build_object('estimatedMinutes', v_estimated)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_queue_entry_changed
BEFORE INSERT OR UPDATE ON public.queue_entries
FOR EACH ROW
EXECUTE FUNCTION public.on_queue_entry_changed();

-- 9) Função para avançar automaticamente para próximo cliente
CREATE OR REPLACE FUNCTION public.call_next_queue_entry(_establishment_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_id UUID;
BEGIN
  SELECT id INTO v_next_id
  FROM public.queue_entries
  WHERE establishment_id = _establishment_id
    AND status = 'aguardando'
  ORDER BY position ASC NULLS LAST, arrived_at ASC
  LIMIT 1;

  IF v_next_id IS NOT NULL THEN
    UPDATE public.queue_entries
    SET status = 'chamado',
        updated_at = now()
    WHERE id = v_next_id;
  END IF;

  RETURN v_next_id;
END;
$$;

-- 10) Função de visão operacional resumida (dashboard)
CREATE OR REPLACE FUNCTION public.queue_dashboard_metrics(_establishment_id UUID)
RETURNS TABLE(
  waiting_count INT,
  in_service_count INT,
  avg_wait_minutes NUMERIC,
  avg_service_minutes NUMERIC,
  served_today INT,
  walkin_today INT,
  app_today INT,
  avg_total_stay_minutes NUMERIC
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH today_entries AS (
    SELECT *
    FROM public.queue_entries
    WHERE establishment_id = _establishment_id
      AND created_at::date = now()::date
  )
  SELECT
    COALESCE((
      SELECT COUNT(*) FROM public.queue_entries
      WHERE establishment_id = _establishment_id
        AND status IN ('aguardando','chamado')
    ), 0)::INT AS waiting_count,
    COALESCE((
      SELECT COUNT(*) FROM public.queue_entries
      WHERE establishment_id = _establishment_id
        AND status = 'em_atendimento'
    ), 0)::INT AS in_service_count,
    COALESCE((
      SELECT AVG(estimated_minutes)::NUMERIC
      FROM public.queue_entries
      WHERE establishment_id = _establishment_id
        AND status IN ('aguardando','chamado')
    ), 0)::NUMERIC AS avg_wait_minutes,
    COALESCE((
      SELECT AVG(EXTRACT(EPOCH FROM (finished_at - started_at))/60.0)::NUMERIC
      FROM public.queue_entries
      WHERE establishment_id = _establishment_id
        AND status = 'finalizado'
        AND started_at IS NOT NULL
        AND finished_at IS NOT NULL
    ), 0)::NUMERIC AS avg_service_minutes,
    COALESCE((
      SELECT COUNT(*)
      FROM today_entries
      WHERE status = 'finalizado'
    ), 0)::INT AS served_today,
    COALESCE((
      SELECT COUNT(*)
      FROM today_entries
      WHERE source = 'presencial'
    ), 0)::INT AS walkin_today,
    COALESCE((
      SELECT COUNT(*)
      FROM today_entries
      WHERE source = 'app'
    ), 0)::INT AS app_today,
    COALESCE((
      SELECT AVG(EXTRACT(EPOCH FROM (finished_at - arrived_at))/60.0)::NUMERIC
      FROM public.queue_entries
      WHERE establishment_id = _establishment_id
        AND status = 'finalizado'
        AND finished_at IS NOT NULL
    ), 0)::NUMERIC AS avg_total_stay_minutes;
$$;

-- 11) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_status_history;

-- 12) Inicialização de consistência
DO $$
DECLARE
  est RECORD;
BEGIN
  FOR est IN SELECT id FROM public.establishments LOOP
    PERFORM public.recalculate_queue_positions(est.id);
    PERFORM public.recalculate_queue_estimates(est.id);
  END LOOP;
END $$;
