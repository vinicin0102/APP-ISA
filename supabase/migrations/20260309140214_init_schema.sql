-- ====================================================
-- ESTRUTURA DO BANCO DE DADOS SUPABASE (PostgreSQL)
-- Execute isso no SQL Editor do seu projeto Supabase
-- ====================================================

-- 1. Tabela: Anotações da Agenda
CREATE TABLE IF NOT EXISTS public.agenda_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    content text,
    notification_time time without time zone,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date) -- Limita 1 anotação/horários por dia por usuário (opcional dependendo da sua regra de negócio)
);

-- 2. Tabela: Assinaturas de Push Notification do Navegador (PWA)
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription jsonb NOT NULL, -- Aqui ficará o dado de subscription gerado pelo browser via VAPID Key
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela: Configurações Globais de Notificações
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_time time without time zone DEFAULT '08:00',
    incentive_type text DEFAULT 'both' CHECK (incentive_type IN ('both', 'daily', 'specific')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela: Notificações Recorrentes
CREATE TABLE IF NOT EXISTS public.recurring_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    notification_time time without time zone NOT NULL,
    days_of_week integer[] NOT NULL, -- Exemplo: [1,2,3,4,5] (Seg-Sex)
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================
-- Habilitar Row Level Security (RLS)
-- Garante que cada usuário só leia/escreva nos PRÓPRIOS dados
-- ====================================================

-- Ativar RLS nas tabelas
ALTER TABLE public.agenda_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para: agenda_notes
CREATE POLICY "Users can manage their own agenda notes"
ON public.agenda_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para: notification_subscriptions
CREATE POLICY "Users can manage their own subscriptions"
ON public.notification_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para: user_notification_settings
CREATE POLICY "Users can manage their own notification settings"
ON public.user_notification_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para: recurring_notifications
CREATE POLICY "Users can manage their own recurring notifications"
ON public.recurring_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
