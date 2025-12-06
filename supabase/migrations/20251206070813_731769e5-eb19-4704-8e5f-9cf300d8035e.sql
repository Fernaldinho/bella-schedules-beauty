-- Create app_role enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create salons table
CREATE TABLE public.salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Meu Salão',
    description TEXT DEFAULT 'Bem-vindo ao nosso espaço de beleza!',
    welcome_text TEXT DEFAULT 'Agende seu momento de beleza 💖',
    whatsapp TEXT,
    logo_url TEXT,
    logo_format TEXT DEFAULT 'square',
    theme_preset TEXT DEFAULT 'purple',
    custom_colors JSONB DEFAULT '{"primary": "270 70% 50%", "secondary": "320 70% 60%", "accent": "330 80% 60%"}',
    price_color TEXT DEFAULT '142 76% 36%',
    service_color TEXT DEFAULT '220 80% 50%',
    social_media JSONB DEFAULT '{"instagram": "", "whatsapp": "", "facebook": "", "tiktok": ""}',
    opening_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
    working_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6],
    stats JSONB DEFAULT '{"rating": "4.9", "clientCount": "+500", "since": "2020"}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Create professionals table
CREATE TABLE public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT,
    photo TEXT,
    available_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6],
    available_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Create services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 30,
    category TEXT DEFAULT 'Geral',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create professional_services junction table
CREATE TABLE public.professional_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (professional_id, service_id)
);

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    plan TEXT DEFAULT 'pro',
    price NUMERIC(10, 2) DEFAULT 45.30,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles: users can read their own role
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Salons policies
CREATE POLICY "Users can view their own salon"
ON public.salons
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own salon"
ON public.salons
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own salon"
ON public.salons
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

-- Public can view salon by id (for client booking page)
CREATE POLICY "Public can view salons"
ON public.salons
FOR SELECT
TO anon
USING (true);

-- Professionals policies
CREATE POLICY "Salon owners can manage professionals"
ON public.professionals
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.salons
        WHERE salons.id = professionals.salon_id
        AND salons.owner_id = auth.uid()
    )
);

CREATE POLICY "Public can view professionals"
ON public.professionals
FOR SELECT
TO anon
USING (true);

-- Services policies
CREATE POLICY "Salon owners can manage services"
ON public.services
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.salons
        WHERE salons.id = services.salon_id
        AND salons.owner_id = auth.uid()
    )
);

CREATE POLICY "Public can view services"
ON public.services
FOR SELECT
TO anon
USING (true);

-- Professional services junction policies
CREATE POLICY "Salon owners can manage professional services"
ON public.professional_services
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professionals p
        JOIN public.salons s ON s.id = p.salon_id
        WHERE p.id = professional_services.professional_id
        AND s.owner_id = auth.uid()
    )
);

CREATE POLICY "Public can view professional services"
ON public.professional_services
FOR SELECT
TO anon
USING (true);

-- Appointments policies
CREATE POLICY "Salon owners can view their appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.salons
        WHERE salons.id = appointments.salon_id
        AND salons.owner_id = auth.uid()
    )
);

CREATE POLICY "Salon owners can manage appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.salons
        WHERE salons.id = appointments.salon_id
        AND salons.owner_id = auth.uid()
    )
);

-- Public can create appointments (for client booking)
CREATE POLICY "Public can create appointments"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    );
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Create salon for the user
    INSERT INTO public.salons (owner_id, name)
    VALUES (NEW.id, 'Meu Salão');
    
    -- Create inactive subscription
    INSERT INTO public.subscriptions (user_id, status)
    VALUES (NEW.id, 'inactive');
    
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salons_updated_at
    BEFORE UPDATE ON public.salons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON public.professionals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();