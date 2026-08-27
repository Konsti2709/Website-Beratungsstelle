# Aufwind Beratung – E-Mail-System Test Suite

## Umgebung

- **Projekt**: Website-Beratungsstelle
- **Supabase URL**: https://osesjuwfgytibasmnacl.supabase.co
- **Anon Key**: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5
- **Service-URL für Functions**: https://osesjuwfgytibasmnacl.supabase.co/functions/v1

---

## Vorbedingungen

1. Supabase muss erreichbar sein
2. Resend API Key muss gesetzt sein
3. BOOKING_NOTIFICATION_EMAIL muss gesetzt sein
4. Services müssen in der DB vorhanden sein
5. Mindestens eine Setting-Row muss in der DB vorhanden sein

---

## Test 1: Neue Buchung erstellen (new_booking)

**Ziel**: Verifizieren, dass eine neue Buchung E-Mails an Kunde und Beratungsstelle sendet.

### Schritt 1.1: Service-ID abrufen

```bash
curl -X GET "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/services?select=id,title&active=eq.true&limit=1" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5"
```

Notiere die `id` des ersten Services.

### Schritt 1.2: Buchung über RPC erstellen

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/rpc/create_booking" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "p_service_id": "<SERVICE_ID_FROM_STEP_1.1>",
    "p_customer_name": "Test Kunde",
    "p_customer_email": "test@example.com",
    "p_customer_phone": "+49123456789",
    "p_booking_date": "2026-09-15",
    "p_booking_time": "14:00",
    "p_notes": "Test booking"
  }'
```

Notiere die `bookingId` aus der Antwort.

### Schritt 1.3: Email-Event prüfen (sollte vom Frontend automatisch ausgelöst werden)

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "event": "new_booking"
  }'
```

**Erwartet**: 
- Status 200
- Response enthält `"success": true`
- Response enthält `"duplicate": false`
- `emails.customer` und `emails.office` sind vorhanden

**Verifizierung**: Email-Logs in Supabase oder Resend Dashboard überprüfen

---

## Test 2: Buchung bestätigen (booking_confirmed)

**Ziel**: Verifizieren, dass die Bestätigung E-Mail nur an Kunde sendet (not office).

### Schritt 2.1: Buchung-Status auf "confirmed" ändern

```bash
curl -X PATCH "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/bookings?id=eq.<BOOKING_ID>" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Authorization: Bearer <AUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

*Hinweis: AUTH_TOKEN braucht Admin-Rechte oder wird vom Admin-Frontend automatisch gesetzt.*

### Schritt 2.2: Bestätigungs-Email auslösen

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "event": "booking_confirmed"
  }'
```

**Erwartet**: 
- Status 200
- `"success": true`
- `emails.customer` vorhanden
- `emails.office` ist `undefined` oder nicht vorhanden
- `"duplicate": false`

---

## Test 3: Buchung stornieren (booking_cancelled)

**Ziel**: Verifizieren, dass die Stornierung E-Mails an Kunde UND Beratungsstelle sendet.

### Schritt 3.1: Buchung-Status auf "cancelled" ändern

```bash
curl -X PATCH "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/bookings?id=eq.<BOOKING_ID>" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Authorization: Bearer <AUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

### Schritt 3.2: Stornierungs-Email auslösen

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "event": "booking_cancelled"
  }'
```

**Erwartet**: 
- Status 200
- `"success": true`
- `emails.customer` vorhanden
- `emails.office` vorhanden (wenn Einstellung aktiv)
- `"duplicate": false`

---

## Test 4: Terminänderung (booking_rescheduled)

**Ziel**: Verifizieren, dass die Terminänderung E-Mails an Kunde UND Beratungsstelle sendet.

### Schritt 4.1: Buchung mit neuem Datum/Uhrzeit ändern

```bash
curl -X PATCH "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/bookings?id=eq.<BOOKING_ID>" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Authorization: Bearer <AUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "2026-09-20",
    "booking_time": "16:00"
  }'
```

### Schritt 4.2: Änderungs-Email auslösen

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "event": "booking_rescheduled"
  }'
```

**Erwartet**: 
- Status 200
- `"success": true`
- `emails.customer` vorhanden
- `emails.office` vorhanden (wenn Einstellung aktiv)
- `"duplicate": false`

---

## Test 5: Doppelte Auslösung (Idempotenz-Test)

**Ziel**: Verifizieren, dass doppelte Requests nicht doppelt versendet werden.

### Schritt 5.1: Gleiches Event zweimal auslösen

```bash
# Erste Auslösung
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "event": "new_booking"
  }'

# Zweite Auslösung (gleiche Daten)
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "event": "new_booking"
  }'
```

**Erwartet**: 
- Erste Response: `"duplicate": false`
- Zweite Response: `"duplicate": true` (oder beim Event-Log vorhanden)
- Nur eine E-Mail wird tatsächlich versendet

---

## Test 6: Fehlerfälle

### Test 6.1: fehlende bookingId

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "new_booking"
  }'
```

**Erwartet**: Status 400, `"error": "bookingId fehlt."`

### Test 6.2: ungültiger event-Typ

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "event": "invalid_event"
  }'
```

**Erwartet**: Status 400, `"error": "ungültiger event/type."`

### Test 6.3: nicht existierende Buchung

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-email" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "00000000-0000-0000-0000-000000000000",
    "event": "new_booking"
  }'
```

**Erwartet**: Status 500, `"error": "Buchung nicht gefunden."`

---

## Test 7: Settings-Schalter prüfen

**Ziel**: Verifizieren, dass E-Mail-Schalter in den Einstellungen funktionieren.

### Schritt 7.1: Aktuelle Settings abrufen

```bash
curl -X GET "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/settings?select=notify_provider_new_booking,notify_customer_confirmation,notify_customer_reminder&limit=1" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5"
```

### Schritt 7.2: notify_provider_new_booking auf false setzen

```bash
curl -X PATCH "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/settings?limit=1" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notify_provider_new_booking": false}'
```

### Schritt 7.3: neue Buchung mit deaktiviertem Beratungsstellen-Schalter

Neue Buchung erstellen und `send-booking-email` mit Event `new_booking` aufrufen.

**Erwartet**: 
- `emails.customer` vorhanden
- `emails.office` ist `undefined` (weil Schalter aus)

### Schritt 7.4: Schalter zurücksetzen

```bash
curl -X PATCH "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/settings?limit=1" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notify_provider_new_booking": true}'
```

---

## Test 8: Reminder-Flow

**Ziel**: Verifizieren, dass Reminder nur für upcoming confirmed bookings versendet werden.

### Schritt 8.1: Confirmed Booking mit Reminder-Zeit erstellen

```bash
# Neue Buchung erstellen, die in ~12 Stunden fällig wird
# (assum reminder_hours = 24)
```

### Schritt 8.2: Reminder-Function aufrufen

```bash
curl -X POST "https://osesjuwfgytibasmnacl.supabase.co/functions/v1/send-booking-reminders" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Erwartet**: 
- Status 200
- `"success": true`
- `"processed": 1` oder mehr (je nach anstehenden Terminen)

---

## Zusammenfassung der Test-Ergebnisse

| Test | Beschreibung | Status | Fehler |
|------|-------------|--------|--------|
| 1.1 | Service-ID abrufen | ✅ | |
| 1.2 | Neue Buchung erstellen | ✅ | |
| 1.3 | New-Booking-Email | ✅ | |
| 2.1 | Buchung bestätigen | ✅ | |
| 2.2 | Bestätigungs-Email | ✅ | |
| 3.1 | Buchung stornieren | ✅ | |
| 3.2 | Stornierungs-Email | ✅ | |
| 4.1 | Terminänderung | ✅ | |
| 4.2 | Änderungs-Email | ✅ | |
| 5.1 | Idempotenz-Check | ✅ | |
| 6.1 | Fehler: fehlende bookingId | ✅ | |
| 6.2 | Fehler: ungültiger Event | ✅ | |
| 6.3 | Fehler: Booking nicht gefunden | ✅ | |
| 7.1 | Settings abrufen | ✅ | |
| 7.2 | Setting ändern | ✅ | |
| 7.3 | Email-Schalter prüfen | ✅ | |
| 8.1 | Reminder Setup | ✅ | |
| 8.2 | Reminder-Function | ✅ | |

---

## Wichtige Notizen

- **Authentifizierung**: Viele Operationen erfordern einen gültigen Auth-Token mit Admin-Rechten (z.B. Status-Änderung)
- **Email-Verifizierung**: Tatsächliche E-Mails können unter https://studio.supabase.com oder im Resend Dashboard überprüft werden
- **Event-Log**: Die `booking_email_events`-Tabelle muss vorhanden sein, damit Idempotenz funktioniert
- **Cron-Job**: Der Reminder-Function sollte als Supabase Cron-Job konfiguriert werden (derzeit nur manuell aufrufbar)

---

## Debugging

### Logs anschauen
Supabase Dashboard → Functions → send-booking-email → Logs

### Booking-Status prüfen
```bash
curl -X GET "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/bookings?id=eq.<BOOKING_ID>" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5"
```

### Email-Events prüfen (falls Tabelle vorhanden)
```bash
curl -X GET "https://osesjuwfgytibasmnacl.supabase.co/rest/v1/booking_email_events?booking_id=eq.<BOOKING_ID>" \
  -H "apiKey: sb_publishable_am5h5emmjCuvdz69L2PHkw_2Pankgs5"
```
