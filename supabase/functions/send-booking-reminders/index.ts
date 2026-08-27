import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (_req, ctx) => {
    try {
      if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        return Response.json(
          { error: "Supabase-Umgebungsvariablen fehlen." },
          { status: 500 },
        );
      }

      const { data: settingsData, error: settingsError } = await (ctx.supabaseAdmin as any)
        .from("settings")
        .select("notify_customer_reminder, reminder_hours")
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        console.error("Reminder-Settings konnten nicht geladen werden:", settingsError);
      }

      const settings = {
        notify_customer_reminder: settingsData?.notify_customer_reminder ?? true,
        reminder_hours: Number(settingsData?.reminder_hours ?? 24),
      };

      if (!settings.notify_customer_reminder) {
        return Response.json({
          success: true,
          processed: 0,
          reason: "customer reminder disabled",
        });
      }

      const { data: bookings, error: bookingsError } = await (ctx.supabaseAdmin as any)
        .from("bookings")
        .select("id, booking_date, booking_time, customer_email, customer_name, status")
        .eq("status", "confirmed");

      if (bookingsError) {
        console.error("Reminder-Buchungen konnten nicht geladen werden:", bookingsError);
        return Response.json(
          { error: "Reminder-Buchungen konnten nicht geladen werden." },
          { status: 500 },
        );
      }

      const reminderWindowMs = Math.max(1, Number(settings.reminder_hours ?? 24)) * 60 * 60 * 1000;
      const now = Date.now();
      const dueBookings = ((bookings ?? []) as any[]).filter((booking: any) => {
        if (!booking.booking_date || !booking.booking_time) {
          return false;
        }

        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);

        if (Number.isNaN(bookingDateTime.getTime())) {
          return false;
        }

        const diffMs = bookingDateTime.getTime() - now;

        return diffMs >= 0 && diffMs <= reminderWindowMs;
      });

      const sent: string[] = [];

      for (const booking of dueBookings) {
        try {
          const response = await triggerReminderEmail(booking.id);
          sent.push(booking.id);
          console.log("Reminder gesendet für Buchung:", booking.id, response);
        } catch (error) {
          console.error("Reminder für Buchung konnte nicht gesendet werden:", booking.id, error);
        }
      }

      return Response.json({
        success: true,
        processed: sent.length,
        sent,
        reminderHours: settings.reminder_hours,
      });
    } catch (error) {
      console.error("send-booking-reminders error:", error);
      return Response.json(
        { error: "Interner Fehler beim Reminder-Versand." },
        { status: 500 },
      );
    }
  }),
};

async function triggerReminderEmail(bookingId: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-booking-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      bookingId,
      event: "booking_reminder",
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? "Reminder dispatch failed");
  }

  return data;
}

/*
  Local test example:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-booking-reminders' \
    --header 'Content-Type: application/json' \
    --header 'apiKey: sb_publishable_...' \
    --data '{}'
*/
