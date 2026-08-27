import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const BOOKING_NOTIFICATION_EMAIL = Deno.env.get(
  "BOOKING_NOTIFICATION_EMAIL",
);
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ??
  "onboarding@resend.dev";

const VALID_EVENTS = [
  "new_booking",
  "booking_confirmed",
  "booking_cancelled",
  "booking_rescheduled",
  "booking_reminder",
] as const;

type EmailEvent = (typeof VALID_EVENTS)[number];

const DEFAULT_SETTINGS = {
  notify_provider_new_booking: true,
  notify_provider_cancellation: true,
  notify_provider_reschedule: true,
  notify_customer_confirmation: true,
  notify_customer_cancellation: true,
  notify_customer_reschedule: true,
  notify_customer_reminder: true,
  reminder_hours: 24,
};

const EMAIL_SUBJECTS: Record<EmailEvent, { customer: string; office: string }> = {
  new_booking: {
    customer: "Ihre Buchungsanfrage – Aufwind Beratung",
    office: "Neue Buchungsanfrage – Aufwind Beratung",
  },
  booking_confirmed: {
    customer: "Ihre Buchung wurde bestätigt – Aufwind Beratung",
    office: "Buchung bestätigt – Aufwind Beratung",
  },
  booking_cancelled: {
    customer: "Ihre Buchung wurde storniert – Aufwind Beratung",
    office: "Buchung storniert – Aufwind Beratung",
  },
  booking_rescheduled: {
    customer: "Terminänderung – Aufwind Beratung",
    office: "Terminänderung – Aufwind Beratung",
  },
  booking_reminder: {
    customer: "Erinnerung: Ihr Termin bei Aufwind Beratung",
    office: "Erinnerung: Termin bei Aufwind Beratung",
  },
};

export default {
  fetch: withSupabase<Database>(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {
      try {
        if (!RESEND_API_KEY) {
          return Response.json(
            { error: "RESEND_API_KEY fehlt." },
            { status: 500 },
          );
        }

        if (!BOOKING_NOTIFICATION_EMAIL) {
          return Response.json(
            { error: "BOOKING_NOTIFICATION_EMAIL fehlt." },
            { status: 500 },
          );
        }

        const body = await req.json();
        const event = normalizeEvent(body?.event ?? body?.type ?? "new_booking");
        const bookingId = body?.bookingId;

        if (!bookingId) {
          return Response.json(
            { error: "bookingId fehlt." },
            { status: 400 },
          );
        }

        if (!VALID_EVENTS.includes(event)) {
          return Response.json(
            { error: "ungültiger event/type." },
            { status: 400 },
          );
        }

        const { booking, service } = await loadBookingAndService(ctx, bookingId);

        const settings = await loadSettings(ctx);
        const emailPlan = getEmailPlan(event, settings);
        const results: Record<string, unknown> = {};

        const isDuplicate = await hasEmailEventBeenSent(ctx, bookingId, event);
        if (isDuplicate) {
          return Response.json({
            success: true,
            bookingId,
            event,
            duplicate: true,
            emails: results,
          });
        }

        const eventRecorded = await recordEmailEvent(ctx, bookingId, event);
        if (!eventRecorded) {
          return Response.json({
            success: true,
            bookingId,
            event,
            duplicate: true,
            emails: results,
          });
        }

        if (emailPlan.customer) {
          const html = renderCustomerEmail(event, booking, service);
          const response = await sendResendEmail({
            to: booking.customer_email,
            subject: EMAIL_SUBJECTS[event].customer,
            html,
          });

          results.customer = response;
        }

        if (emailPlan.office) {
          const html = renderOfficeEmail(event, booking, service);
          const response = await sendResendEmail({
            to: BOOKING_NOTIFICATION_EMAIL,
            subject: EMAIL_SUBJECTS[event].office,
            html,
          });

          results.office = response;
        }

        return Response.json({
          success: true,
          bookingId,
          event,
          duplicate: false,
          emails: results,
        });
      } catch (error) {
        console.error("send-booking-email error:", error);

        return Response.json(
          {
            error: "Interner Fehler beim E-Mail-Versand.",
          },
          { status: 500 },
        );
      }
    },
  ),
};

function normalizeEvent(value: unknown): EmailEvent {
  if (typeof value !== "string") {
    return "new_booking";
  }

  const lowerCase = value.trim().toLowerCase();

  if (VALID_EVENTS.includes(lowerCase as EmailEvent)) {
    return lowerCase as EmailEvent;
  }

  return "new_booking";
}

async function loadBookingAndService(
  ctx: any,
  bookingId: string,
) {
  const { data: booking, error: bookingError } = await ctx.supabaseAdmin
    .from("bookings")
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      notes,
      status,
      service_id
    `)
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    console.error("Buchung konnte nicht geladen werden:", bookingError);
    throw new Error("Buchung nicht gefunden.");
  }

  const { data: service, error: serviceError } = await ctx.supabaseAdmin
    .from("services")
    .select("id, title, description, price, duration, active")
    .eq("id", booking.service_id)
    .single();

  if (serviceError || !service) {
    console.error("Beratungsangebot konnte nicht geladen werden:", serviceError);
    throw new Error("Beratungsangebot nicht gefunden.");
  }

  return { booking, service };
}

async function loadSettings(ctx: any) {
  const { data, error } = await ctx.supabaseAdmin
    .from("settings")
    .select(`
      notify_provider_new_booking,
      notify_provider_cancellation,
      notify_provider_reschedule,
      notify_customer_confirmation,
      notify_customer_cancellation,
      notify_customer_reschedule,
      notify_customer_reminder,
      reminder_hours
    `)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Settings konnten nicht geladen werden:", error);
  }

  return {
    ...DEFAULT_SETTINGS,
    ...(data ?? {}),
  };
}

async function hasEmailEventBeenSent(ctx: any, bookingId: string, event: EmailEvent) {
  const { data, error } = await ctx.supabaseAdmin
    .from("booking_email_events")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("event_type", event)
    .limit(1);

  if (error) {
    console.error("Email-Log konnte nicht geprüft werden:", error);
    return false;
  }

  return (data ?? []).length > 0;
}

async function recordEmailEvent(ctx: any, bookingId: string, event: EmailEvent) {
  const { error } = await ctx.supabaseAdmin
    .from("booking_email_events")
    .upsert({
      booking_id: bookingId,
      event_type: event,
    }, {
      onConflict: "booking_id,event_type",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("Email-Event konnte nicht gespeichert werden:", error);
    return false;
  }

  return true;
}

function getEmailPlan(event: EmailEvent, settings: typeof DEFAULT_SETTINGS) {
  switch (event) {
    case "new_booking":
      return {
        customer: true,
        office: Boolean(settings.notify_provider_new_booking),
      };

    case "booking_confirmed":
      return {
        customer: Boolean(settings.notify_customer_confirmation),
        office: false,
      };

    case "booking_cancelled":
      return {
        customer: Boolean(settings.notify_customer_cancellation),
        office: Boolean(settings.notify_provider_cancellation),
      };

    case "booking_rescheduled":
      return {
        customer: Boolean(settings.notify_customer_reschedule),
        office: Boolean(settings.notify_provider_reschedule),
      };

    case "booking_reminder":
      return {
        customer: Boolean(settings.notify_customer_reminder),
        office: false,
      };

    default:
      return { customer: false, office: false };
  }
}

function renderCustomerEmail(
  event: EmailEvent,
  booking: Record<string, any>,
  service: Record<string, any>,
) {
  const brandedTitle = {
    new_booking: "Ihre Buchungsanfrage ist eingegangen",
    booking_confirmed: "Ihre Buchung wurde bestätigt",
    booking_cancelled: "Ihre Buchung wurde storniert",
    booking_rescheduled: "Ihre Buchung wurde angepasst",
    booking_reminder: "Erinnerung an Ihren Termin",
  }[event] ?? "Ihre Buchung";

  const introText = {
    new_booking:
      "vielen Dank für Ihre Buchungsanfrage. Ihre Anfrage wurde erfolgreich übermittelt.",
    booking_confirmed:
      "Ihre Buchung wurde bestätigt. Wir freuen uns auf Ihren Termin.",
    booking_cancelled:
      "Ihre Buchung wurde storniert. Wenn Sie möchten, können Sie gerne einen neuen Termin buchen.",
    booking_rescheduled:
      "Ihre Buchung wurde entsprechend der neuen Terminplanung angepasst.",
    booking_reminder:
      "Dies ist eine freundliche Erinnerung an Ihren kommenden Termin.",
  }[event] ?? "Vielen Dank für Ihre Buchung.";

  const noteText = {
    new_booking:
      "Der Termin ist noch nicht bestätigt. Sie erhalten eine weitere E-Mail, sobald die Buchung bestätigt wurde.",
    booking_confirmed:
      "Bitte halten Sie die Terminzeit ein und melden Sie sich bei Fragen gerne bei uns.",
    booking_cancelled:
      "Falls Sie den Termin erneut buchen möchten, senden Sie uns gerne eine neue Anfrage.",
    booking_rescheduled:
      "Bitte prüfen Sie die geänderten Terminangaben sorgfältig.",
    booking_reminder:
      "Bitte prüfen Sie noch einmal Datum und Uhrzeit sowie die Angaben zu Ihrer Beratung.",
  }[event] ?? "";

  return `
    <div style="font-family:Arial, sans-serif; line-height:1.6; color:#2a2421; background:#fdfbf9; margin:0; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #d4b295; border-radius:12px; overflow:hidden;">
        <div style="background:#2a2421; padding:24px 32px;">
          <h1 style="margin:0; color:#ffffff; font-size:28px; line-height:1.2;">Aufwind Beratung</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px; color:#2a2421; font-size:26px; line-height:1.3;">${escapeHtml(brandedTitle)}</h2>
          <p style="margin:0 0 12px; color:#2a2421; font-size:16px;">Hallo ${escapeHtml(booking.customer_name)},</p>
          <p style="margin:0 0 16px; color:#2a2421; font-size:16px;">${escapeHtml(introText)}</p>
          <p style="margin:0 0 20px; color:#2a2421; font-size:15px; background:#fdfbf9; border-left:4px solid #d4b295; padding:12px 14px; border-radius:6px;">${escapeHtml(noteText)}</p>

          <div style="background:#fdfbf9; border:1px solid #d4b295; border-radius:10px; padding:18px; margin:0 0 20px;">
            <h3 style="margin:0 0 12px; color:#2a2421; font-size:18px;">Ihre Buchung</h3>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Beratung:</strong> ${escapeHtml(service.title)}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Dauer:</strong> ${service.duration} Minuten</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Preis:</strong> ${formatCurrency(service.price)}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Datum:</strong> ${escapeHtml(formatBookingDate(booking.booking_date))}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Uhrzeit:</strong> ${escapeHtml(formatBookingTime(booking.booking_time))} Uhr</p>
          </div>

          <p style="margin:0; color:#2a2421; font-size:15px;">Viele Grüße<br><strong>Aufwind Beratung</strong></p>
        </div>
      </div>
    </div>
  `;
}

function renderOfficeEmail(
  event: EmailEvent,
  booking: Record<string, any>,
  service: Record<string, any>,
) {
  const subjectTitle = {
    new_booking: "Neue Buchungsanfrage",
    booking_confirmed: "Buchung bestätigt",
    booking_cancelled: "Buchung storniert",
    booking_rescheduled: "Terminänderung",
    booking_reminder: "Erinnerung an Termin",
  }[event] ?? "Buchungsinformation";

  const summaryText = {
    new_booking: "Eine neue Buchungsanfrage ist eingegangen.",
    booking_confirmed: "Eine Buchung wurde bestätigt.",
    booking_cancelled: "Eine Buchung wurde storniert.",
    booking_rescheduled: "Ein Termin wurde angepasst.",
    booking_reminder: "Ein bereits bestätigter Termin steht bald an.",
  }[event] ?? "Es liegt eine Buchungsinformation vor.";

  return `
    <div style="font-family:Arial, sans-serif; line-height:1.6; color:#2a2421; background:#fdfbf9; margin:0; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #d4b295; border-radius:12px; overflow:hidden;">
        <div style="background:#2a2421; padding:24px 32px;">
          <h1 style="margin:0; color:#ffffff; font-size:26px; line-height:1.2;">${escapeHtml(subjectTitle)}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px; color:#2a2421; font-size:16px;">${escapeHtml(summaryText)}</p>

          <div style="background:#fdfbf9; border:1px solid #d4b295; border-radius:10px; padding:18px; margin:0 0 20px;">
            <h2 style="margin:0 0 12px; color:#2a2421; font-size:20px;">Buchungsdaten</h2>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Beratung:</strong> ${escapeHtml(service.title)}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Dauer:</strong> ${service.duration} Minuten</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Preis:</strong> ${formatCurrency(service.price)}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Datum:</strong> ${escapeHtml(formatBookingDate(booking.booking_date))}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Uhrzeit:</strong> ${escapeHtml(formatBookingTime(booking.booking_time))} Uhr</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Status:</strong> ${escapeHtml(booking.status)}</p>
          </div>

          <div style="background:#ffffff; border:1px solid #d4b295; border-radius:10px; padding:18px;">
            <h2 style="margin:0 0 12px; color:#2a2421; font-size:20px;">Kundendaten</h2>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Name:</strong> ${escapeHtml(booking.customer_name)}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>E-Mail:</strong> ${escapeHtml(booking.customer_email)}</p>
            <p style="margin:4px 0; color:#2a2421; font-size:15px;"><strong>Telefon:</strong> ${escapeHtml(booking.customer_phone || "Nicht angegeben")}</p>
            ${booking.notes ? `<p style="margin:12px 0 0; color:#2a2421; font-size:15px;"><strong>Nachricht:</strong><br>${escapeHtml(booking.notes)}</p>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendResendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Resend error:", data);
    throw new Error("Resend error");
  }

  return data;
}

function formatCurrency(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatBookingDate(dateValue: string | null | undefined) {
  if (!dateValue) {
    return "–";
  }

  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatBookingTime(timeValue: string | null | undefined) {
  if (!timeValue) {
    return "–";
  }

  return String(timeValue).slice(0, 5);
}


function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}