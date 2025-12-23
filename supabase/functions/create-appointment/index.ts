import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAppointmentRequest {
  salonId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
}

// Validação de entrada
function validateInput(data: CreateAppointmentRequest): string | null {
  if (!data.salonId || typeof data.salonId !== 'string') {
    return "salonId is required";
  }
  if (!data.professionalId || typeof data.professionalId !== 'string') {
    return "professionalId is required";
  }
  if (!data.serviceId || typeof data.serviceId !== 'string') {
    return "serviceId is required";
  }
  if (!data.date || typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return "date is required and must be in YYYY-MM-DD format";
  }
  if (!data.time || typeof data.time !== 'string' || !/^\d{2}:\d{2}$/.test(data.time)) {
    return "time is required and must be in HH:MM format";
  }
  if (!data.clientName || typeof data.clientName !== 'string' || data.clientName.trim().length < 2) {
    return "clientName is required and must have at least 2 characters";
  }
  if (data.clientName.length > 100) {
    return "clientName must be less than 100 characters";
  }
  if (!data.clientPhone || typeof data.clientPhone !== 'string') {
    return "clientPhone is required";
  }
  // Validar formato de telefone brasileiro básico
  const phoneClean = data.clientPhone.replace(/\D/g, '');
  if (phoneClean.length < 10 || phoneClean.length > 11) {
    return "clientPhone must be a valid Brazilian phone number";
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json() as CreateAppointmentRequest;
    
    // Validar entrada
    const validationError = validateInput(body);
    if (validationError) {
      console.log("create-appointment: validation error", validationError);
      return new Response(
        JSON.stringify({ error: validationError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { salonId, professionalId, serviceId, date, time, clientName, clientPhone } = body;

    console.log("create-appointment: received", { salonId, professionalId, serviceId, date, time });

    // Verificar se o salão existe e tem assinatura ativa
    const { data: salon, error: salonError } = await admin
      .from("salons")
      .select("id, owner_id")
      .eq("id", salonId)
      .maybeSingle();

    if (salonError || !salon) {
      console.error("create-appointment: salon not found", salonError);
      return new Response(
        JSON.stringify({ error: "Salon not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    // Verificar assinatura do dono do salão
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("status")
      .eq("user_id", salon.owner_id)
      .maybeSingle();

    if (subscription?.status !== "active") {
      console.log("create-appointment: salon subscription inactive");
      return new Response(
        JSON.stringify({ error: "Salon subscription is not active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    // Verificar se o profissional pertence ao salão
    const { data: professional, error: profError } = await admin
      .from("professionals")
      .select("id")
      .eq("id", professionalId)
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .maybeSingle();

    if (profError || !professional) {
      console.error("create-appointment: professional not found", profError);
      return new Response(
        JSON.stringify({ error: "Professional not found in this salon" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    // Verificar se o serviço pertence ao salão
    const { data: service, error: serviceError } = await admin
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .maybeSingle();

    if (serviceError || !service) {
      console.error("create-appointment: service not found", serviceError);
      return new Response(
        JSON.stringify({ error: "Service not found in this salon" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    // Verificar se já existe agendamento no mesmo horário
    const { data: existingAppointment } = await admin
      .from("appointments")
      .select("id")
      .eq("salon_id", salonId)
      .eq("professional_id", professionalId)
      .eq("date", date)
      .eq("time", time)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existingAppointment) {
      console.log("create-appointment: time slot already booked");
      return new Response(
        JSON.stringify({ error: "This time slot is already booked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
      );
    }

    // Criar o agendamento
    const { data: appointment, error: insertError } = await admin
      .from("appointments")
      .insert({
        salon_id: salonId,
        professional_id: professionalId,
        service_id: serviceId,
        date,
        time,
        client_name: clientName.trim(),
        client_phone: clientPhone.replace(/\D/g, ''), // Armazenar apenas números
        status: "confirmed",
      })
      .select("id, date, time, status")
      .single();

    if (insertError) {
      console.error("create-appointment: insert error", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create appointment" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    console.log("create-appointment: success", { appointmentId: appointment.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointment: {
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 },
    );
  } catch (error: unknown) {
    console.error("create-appointment: error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
