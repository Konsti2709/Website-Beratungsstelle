CREATE TABLE IF NOT EXISTS public.booking_email_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  booking_id uuid NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.booking_email_events
  ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS booking_email_events_booking_event_unique
  ON public.booking_email_events (booking_id, event_type);

CREATE POLICY "Admins can view booking email events"
  ON public.booking_email_events
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert booking email events"
  ON public.booking_email_events
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update booking email events"
  ON public.booking_email_events
  FOR UPDATE
  USING (public.is_admin());

ALTER TABLE public.booking_email_events
  ADD CONSTRAINT booking_email_events_event_type_check
  CHECK (event_type = ANY (ARRAY['new_booking'::text, 'booking_confirmed'::text, 'booking_cancelled'::text, 'booking_rescheduled'::text, 'booking_reminder'::text]));

ALTER TABLE public.booking_email_events
  ADD CONSTRAINT booking_email_events_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
