DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

CREATE POLICY "Public can insert bookings"
  ON public.bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
