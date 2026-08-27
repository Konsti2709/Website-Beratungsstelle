import { supabase } from "../../js/supabase.js";
import { icons } from "../../js/icons.js";

/* ========================================
   ELEMENTE
   ======================================== */

const bookingsList = document.getElementById("bookings-list");
const bookingCount = document.getElementById("booking-count");
const bookingCountLabel = document.getElementById("booking-count-label");

const searchInput = document.getElementById("booking-search");
const statusFilter = document.getElementById("status-filter");
const serviceFilter = document.getElementById("service-filter");
const dateFilter = document.getElementById("date-filter");

const customDateFilter = document.getElementById("custom-date-filter");
const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");

const activeFiltersContainer = document.getElementById(
  "active-booking-filters"
);

const refreshButton = document.getElementById("refresh-bookings");


/* ========================================
   STATE
   ======================================== */

let allBookings = [];
let services = [];


/* ========================================
   STATUS
   ======================================== */

const STATUS_LABELS = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
  no_show: "Nicht erschienen",
};


/* ========================================
   HILFSFUNKTIONEN
   ======================================== */

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatDate(dateString) {
  if (!dateString) {
    return "–";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


function formatShortDate(dateString) {
  if (!dateString) {
    return "–";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


function formatTime(timeString) {
  if (!timeString) {
    return "–";
  }

  return timeString.slice(0, 5);
}


function formatDateTime(dateTimeString) {
  if (!dateTimeString) {
    return "–";
  }

  const date = new Date(dateTimeString);

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}


function getServiceTitle(booking) {
  return booking.services?.title ?? "Beratung";
}


/* ========================================
   SERVICES LADEN
   ======================================== */

async function loadServices() {
  if (!serviceFilter) {
    return;
  }

  const { data, error } = await supabase
    .from("services")
    .select("id, title")
    .order("title", { ascending: true });

  if (error) {
    console.error(
      "Beratungsangebote konnten nicht geladen werden:",
      error
    );

    return;
  }

  services = data ?? [];

  serviceFilter.innerHTML = `
    <option value="all">Alle</option>
    ${services
      .map(
        (service) => `
          <option value="${escapeHtml(service.id)}">
            ${escapeHtml(service.title)}
          </option>
        `
      )
      .join("")}
  `;
}


/* ========================================
   BUCHUNGEN LADEN
   ======================================== */

async function loadBookings() {
  if (!bookingsList) {
    return;
  }

  bookingsList.innerHTML = `
    <div class="empty-state">
      <p>Buchungen werden geladen...</p>
    </div>
  `;

  if (refreshButton) {
    refreshButton.disabled = true;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      created_at,
      service_id,
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      notes,
      status,
      services (
        id,
        title,
        duration,
        price
      )
    `)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (refreshButton) {
    refreshButton.disabled = false;
  }

  if (error) {
    console.error(
      "Buchungen konnten nicht geladen werden:",
      error
    );

    bookingsList.innerHTML = `
      <div class="bookings-error">
        Buchungen konnten nicht geladen werden.
      </div>
    `;

    if (bookingCount) {
      bookingCount.textContent = "–";
    }

    return;
  }

  allBookings = data ?? [];

  await completePastBookings(allBookings);

  applyFilters();
}


/* ========================================
   DATUMS-HILFSFUNKTIONEN
   ======================================== */

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getBookingDateTime(booking) {
  if (!booking.booking_date || !booking.booking_time) {
    return null;
  }

  const dateTime = new Date(
    `${booking.booking_date}T${booking.booking_time.slice(0, 8)}`
  );

  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}


async function completePastBookings(bookings) {
  const pastBookings = bookings.filter((booking) => {
    const dateTime = getBookingDateTime(booking);

    return (
      dateTime &&
      dateTime < new Date() &&
      (booking.status === "pending" || booking.status === "confirmed")
    );
  });

  if (pastBookings.length === 0) {
    return;
  }

  const results = await Promise.all(
    pastBookings.map((booking) =>
      supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", booking.id)
    )
  );

  results.forEach(({ error }, index) => {
    const booking = pastBookings[index];

    if (error) {
      console.error(
        `Status der Buchung ${booking.id} konnte nicht automatisch aktualisiert werden:`,
        error
      );
      return;
    }

    booking.status = "completed";
  });
}


function addDays(date, amount) {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
}


function getStartOfWeek(date) {
  const result = new Date(date);

  const day = result.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);

  result.setHours(0, 0, 0, 0);

  return result;
}


function getEndOfWeek(date) {
  const start = getStartOfWeek(date);

  return addDays(start, 6);
}


function getDateRange() {
  const selected = dateFilter?.value ?? "all";

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  switch (selected) {
    case "today":
      return {
        from: getLocalDateString(today),
        to: getLocalDateString(today),
      };

    case "tomorrow": {
      const tomorrow = addDays(today, 1);

      return {
        from: getLocalDateString(tomorrow),
        to: getLocalDateString(tomorrow),
      };
    }

    case "this_week": {
      const start = getStartOfWeek(today);
      const end = getEndOfWeek(today);

      return {
        from: getLocalDateString(start),
        to: getLocalDateString(end),
      };
    }

    case "next_week": {
      const nextWeekStart = addDays(getStartOfWeek(today), 7);
      const nextWeekEnd = addDays(nextWeekStart, 6);

      return {
        from: getLocalDateString(nextWeekStart),
        to: getLocalDateString(nextWeekEnd),
      };
    }

    case "this_month": {
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      const end = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      return {
        from: getLocalDateString(start),
        to: getLocalDateString(end),
      };
    }

    case "custom":
      return {
        from: dateFromInput?.value || null,
        to: dateToInput?.value || null,
      };

    default:
      return {
        from: null,
        to: null,
      };
  }
}


/* ========================================
   FILTER ANWENDEN
   ======================================== */

function applyFilters() {
  let filteredBookings = [...allBookings];

  /* Suche */

  const searchTerm = searchInput?.value
    ?.trim()
    .toLowerCase();

  if (searchTerm) {
    filteredBookings = filteredBookings.filter((booking) => {
      const name = booking.customer_name?.toLowerCase() ?? "";
      const email = booking.customer_email?.toLowerCase() ?? "";

      return (
        name.includes(searchTerm) ||
        email.includes(searchTerm)
      );
    });
  }


  /* Status */

  const selectedStatus = statusFilter?.value;

  if (selectedStatus && selectedStatus !== "all") {
    filteredBookings = filteredBookings.filter(
      (booking) => booking.status === selectedStatus
    );
  }


  /* Beratungsart */

  const selectedService = serviceFilter?.value;

  if (selectedService && selectedService !== "all") {
    filteredBookings = filteredBookings.filter(
      (booking) =>
        String(booking.service_id) === String(selectedService)
    );
  }


  /* Zeitraum */

  const dateRange = getDateRange();

  if (dateRange.from) {
    filteredBookings = filteredBookings.filter(
      (booking) =>
        booking.booking_date >= dateRange.from
    );
  }

  if (dateRange.to) {
    filteredBookings = filteredBookings.filter(
      (booking) =>
        booking.booking_date <= dateRange.to
    );
  }


  renderBookings(filteredBookings);
  renderActiveFilters();
}


/* ========================================
   BUCHUNGEN DARSTELLEN
   ======================================== */

function renderBookings(bookings) {
  if (bookingCount) {
    bookingCount.textContent = bookings.length;
  }

  if (bookingCountLabel) {
    bookingCountLabel.textContent =
      bookings.length === 1
        ? "Buchung"
        : "Buchungen";
  }

  if (!bookings.length) {
    bookingsList.innerHTML = `
      <div class="empty-state">
        <p>Keine Buchungen gefunden.</p>
      </div>
    `;

    return;
  }

  bookingsList.innerHTML = bookings
    .map((booking) => {
      return renderBookingCard(booking);
    })
    .join("");
}


function renderBookingCard(booking) {
  const service = booking.services;

  const status = escapeHtml(booking.status);

  return `
    <article
      class="booking-card"
      data-booking-id="${escapeHtml(booking.id)}"
    >

      <div class="booking-card-main">

        <div class="booking-card-date">
          <strong>
            ${escapeHtml(
              formatShortDate(booking.booking_date)
            )}
          </strong>

          <span>
            ${escapeHtml(
              formatTime(booking.booking_time)
            )} Uhr
          </span>
        </div>


        <div class="booking-card-customer">

          <strong>
            ${escapeHtml(booking.customer_name)}
          </strong>

          <span>
            ${escapeHtml(booking.customer_email)}
          </span>

        </div>


        <div class="booking-card-service">

          <strong>
            ${escapeHtml(
              service?.title ?? "Beratung"
            )}
          </strong>

          <span>
            ${service?.duration ?? "–"} Minuten
          </span>

        </div>


        <div
          class="booking-card-status status-${status}"
        >
          ${escapeHtml(
            getStatusLabel(booking.status)
          )}
        </div>

      </div>


      <div class="booking-card-actions">

        <button
          type="button"
          class="booking-action"
          data-action="view"
          data-id="${escapeHtml(booking.id)}"
        >
          ${icons.eye}
          Anzeigen
        </button>

      </div>

    </article>
  `;
}


/* ========================================
   AKTIVE FILTER
   ======================================== */

function renderActiveFilters() {
  if (!activeFiltersContainer) {
    return;
  }

  const filters = [];

  const selectedStatus = statusFilter?.value;

  if (selectedStatus && selectedStatus !== "all") {
    filters.push({
      key: "status",
      label: `Status: ${getStatusLabel(selectedStatus)}`,
    });
  }


  const selectedService = serviceFilter?.value;

  if (selectedService && selectedService !== "all") {
    const service = services.find(
      (item) =>
        String(item.id) === String(selectedService)
    );

    if (service) {
      filters.push({
        key: "service",
        label: `Beratung: ${service.title}`,
      });
    }
  }


  const selectedDate = dateFilter?.value;

  if (selectedDate && selectedDate !== "all") {
    let label = "";

    switch (selectedDate) {
      case "today":
        label = "Zeitraum: Heute";
        break;

      case "tomorrow":
        label = "Zeitraum: Morgen";
        break;

      case "this_week":
        label = "Zeitraum: Diese Woche";
        break;

      case "next_week":
        label = "Zeitraum: Nächste Woche";
        break;

      case "this_month":
        label = "Zeitraum: Dieser Monat";
        break;

      case "custom":
        label = "Zeitraum: Benutzerdefiniert";
        break;
    }

    if (label) {
      filters.push({
        key: "date",
        label,
      });
    }
  }


  if (!filters.length) {
    activeFiltersContainer.innerHTML = "";

    return;
  }


  activeFiltersContainer.innerHTML = filters
    .map(
      (filter) => `
        <button
          type="button"
          class="active-booking-filter"
          data-remove-filter="${escapeHtml(filter.key)}"
        >
          <span>
            ${escapeHtml(filter.label)}
          </span>

          <span
            class="active-booking-filter-remove"
            aria-hidden="true"
          >
            ×
          </span>
        </button>
      `
    )
    .join("");
}


/* ========================================
   FILTER ENTFERNEN
   ======================================== */

activeFiltersContainer?.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest(
      "[data-remove-filter]"
    );

    if (!button) {
      return;
    }

    const filter = button.dataset.removeFilter;

    switch (filter) {
      case "status":
        if (statusFilter) {
          statusFilter.value = "all";
        }
        break;

      case "service":
        if (serviceFilter) {
          serviceFilter.value = "all";
        }
        break;

      case "date":
        if (dateFilter) {
          dateFilter.value = "all";
        }

        if (customDateFilter) {
          customDateFilter.hidden = true;
        }

        if (dateFromInput) {
          dateFromInput.value = "";
        }

        if (dateToInput) {
          dateToInput.value = "";
        }

        break;
    }

    applyFilters();
  }
);


/* ========================================
   DETAIL-MODAL
   ======================================== */

function createBookingModal() {
  if (document.getElementById("booking-details-modal")) {
    return;
  }

  const modal = document.createElement("div");

  modal.id = "booking-details-modal";
  modal.className = "booking-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="booking-modal-backdrop"
      data-modal-close
    ></div>

    <div
      class="booking-modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >

      <div class="booking-modal-header">

        <div>
          <h2 id="booking-modal-title">
            Buchungsdetails
          </h2>

          <p>
            Informationen zum Termin
          </p>
        </div>

        <button
          type="button"
          class="booking-modal-close"
          data-modal-close
          aria-label="Schließen"
        >
          ×
        </button>

      </div>


      <div
        class="booking-modal-content"
        id="booking-modal-content"
      ></div>

    </div>
  `;

  document.body.appendChild(modal);


  modal.addEventListener("click", (event) => {
    if (
      event.target.closest("[data-modal-close]")
    ) {
      closeBookingModal();
    }
  });
}


function openBookingModal(bookingId) {
  const booking = allBookings.find(
    (item) => String(item.id) === String(bookingId)
  );

  if (!booking) {
    return;
  }

  createBookingModal();

  const modal = document.getElementById(
    "booking-details-modal"
  );

  const content = document.getElementById(
    "booking-modal-content"
  );

  if (!modal || !content) {
    return;
  }

  const service = booking.services;

  content.innerHTML = `
    <div class="booking-details-grid">

      <div class="booking-details-column">

        <div class="booking-details-section">

          <span class="booking-details-label">
            Beratung
          </span>

          <strong class="booking-details-value">
            ${escapeHtml(
              service?.title ?? "Beratung"
            )}
          </strong>

        </div>


        <div class="booking-details-section">

          <span class="booking-details-label">
            Termin
          </span>

          <strong class="booking-details-value">
            ${escapeHtml(
              formatDate(booking.booking_date)
            )}
          </strong>

          <span class="booking-details-secondary">
            ${escapeHtml(
              formatTime(booking.booking_time)
            )} Uhr
            ·
            ${escapeHtml(
              service?.duration ?? "–"
            )} Minuten
          </span>

        </div>


        <div class="booking-details-section">

          <span class="booking-details-label">
            Kunde
          </span>

          <strong class="booking-details-value">
            ${escapeHtml(
              booking.customer_name
            )}
          </strong>

          <a
            href="mailto:${escapeHtml(
              booking.customer_email
            )}"
            class="booking-details-link"
          >
            ${escapeHtml(
              booking.customer_email
            )}
          </a>

          ${
            booking.customer_phone
              ? `
                <a
                  href="tel:${escapeHtml(
                    booking.customer_phone
                  )}"
                  class="booking-details-link"
                >
                  ${escapeHtml(
                    booking.customer_phone
                  )}
                </a>
              `
              : ""
          }

        </div>


        <div class="booking-details-section">

          <span class="booking-details-label">
            Erstellt am
          </span>

          <span class="booking-details-secondary">
            ${escapeHtml(
              formatDateTime(
                booking.created_at
              )
            )} Uhr
          </span>

        </div>

      </div>


      <div class="booking-details-column">

        <div class="booking-details-section">

          <span class="booking-details-label">
            Nachricht
          </span>

          <div class="booking-details-notes">
            ${
              booking.notes
                ? escapeHtml(booking.notes)
                : "Keine Nachricht hinterlassen."
            }
          </div>

        </div>


        <div class="booking-details-section">

          <span class="booking-details-label">
            Status
          </span>

          <span
            class="booking-card-status status-${escapeHtml(
              booking.status
            )}"
          >
            ${escapeHtml(
              getStatusLabel(
                booking.status
              )
            )}
          </span>

        </div>


        <div class="booking-details-actions">

          ${renderModalActions(booking)}

        </div>


        <div class="booking-danger-zone">

          <div>
            <strong>
              Danger Zone
            </strong>

            <p>
              Das dauerhafte Löschen kann
              nicht rückgängig gemacht werden.
            </p>
          </div>

          <button
            type="button"
            class="booking-danger-button"
            data-action="delete"
            data-id="${escapeHtml(
              booking.id
            )}"
          >
              ${icons.trash}
              Buchung löschen
          </button>

        </div>

      </div>

    </div>
  `;

  modal.hidden = false;

  document.body.classList.add(
    "booking-modal-open"
  );
}


function renderModalActions(booking) {
  switch (booking.status) {
    case "pending":
      return `
        <button
          type="button"
          class="booking-modal-action booking-modal-confirm"
          data-action="confirm"
          data-id="${escapeHtml(booking.id)}"
        >
          Bestätigen
        </button>

        <button
          type="button"
          class="booking-modal-action booking-modal-cancel"
          data-action="cancel"
          data-id="${escapeHtml(booking.id)}"
        >
          Stornieren
        </button>

        <button
          type="button"
          class="booking-modal-action booking-modal-no-show"
          data-action="no-show"
          data-id="${escapeHtml(booking.id)}"
        >
          Nicht erschienen
        </button>
      `;

    case "confirmed":
      return `
        <button
          type="button"
          class="booking-modal-action"
          data-action="reschedule"
          data-id="${escapeHtml(booking.id)}"
        >
          Termin ändern
        </button>

        <button
          type="button"
          class="booking-modal-action booking-modal-cancel"
          data-action="cancel"
          data-id="${escapeHtml(booking.id)}"
        >
          Stornieren
        </button>

        <button
          type="button"
          class="booking-modal-action booking-modal-no-show"
          data-action="no-show"
          data-id="${escapeHtml(booking.id)}"
        >
          Nicht erschienen
        </button>
      `;

    case "completed":
      return `
        <p class="booking-modal-info">
          Dieser Termin wurde abgeschlossen.
        </p>

        <button
          type="button"
          class="booking-modal-action booking-modal-no-show"
          data-action="no-show"
          data-id="${escapeHtml(booking.id)}"
        >
          Als nicht erschienen markieren
        </button>
      `;

    case "cancelled":
      return `
        <p class="booking-modal-info">
          Diese Buchung wurde storniert.
        </p>
      `;

    case "no_show":
      return `
        <p class="booking-modal-info">
          Der Kunde ist zu diesem Termin
          nicht erschienen.
        </p>
      `;

    default:
      return "";
  }
}


function closeBookingModal() {
  const modal = document.getElementById(
    "booking-details-modal"
  );

  if (!modal) {
    return;
  }

  modal.hidden = true;

  document.body.classList.remove(
    "booking-modal-open"
  );
}


/* ========================================
   MODAL AKTIONEN
   ======================================== */

async function handleBookingAction(
  bookingId,
  action
) {
  const booking = allBookings.find(
    (item) => String(item.id) === String(bookingId)
  );

  if (!booking) {
    return;
  }


  switch (action) {
    case "confirm":
      await changeStatus(
        booking,
        "confirmed",
        "Möchtest du diese Buchung wirklich bestätigen?"
      );
      break;


    case "cancel":
      await changeStatus(
        booking,
        "cancelled",
        "Möchtest du diese Buchung wirklich stornieren?"
      );
      break;


    case "no-show":
      await changeStatus(
        booking,
        "no_show",
        "Möchtest du diese Buchung als nicht erschienen markieren?"
      );
      break;


    case "delete":
      await deleteBooking(booking);
      break;


    case "reschedule":
      await rescheduleBooking(booking);
      break;
  }
}


async function rescheduleBooking(booking) {
  const currentDate = booking.booking_date || "";
  const currentTime = booking.booking_time
    ? booking.booking_time.slice(0, 5)
    : "09:00";

  const nextDate = window.prompt(
    "Neues Datum im Format YYYY-MM-DD:",
    currentDate
  );

  if (nextDate === null) {
    return;
  }

  const trimmedDate = nextDate.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    alert("Bitte ein gültiges Datum im Format YYYY-MM-DD eingeben.");
    return;
  }

  const nextTime = window.prompt(
    "Neue Uhrzeit im Format HH:MM:",
    currentTime
  );

  if (nextTime === null) {
    return;
  }

  const trimmedTime = nextTime.trim();

  if (!/^\d{2}:\d{2}$/.test(trimmedTime)) {
    alert("Bitte eine gültige Uhrzeit im Format HH:MM eingeben.");
    return;
  }

  const confirmed = confirm(
    `Möchtest du den Termin wirklich auf ${trimmedDate} um ${trimmedTime} Uhr verschieben?`
  );

  if (!confirmed) {
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      booking_date: trimmedDate,
      booking_time: trimmedTime,
      status: "confirmed",
    })
    .eq("id", booking.id);

  if (error) {
    console.error(
      "Termin konnte nicht angepasst werden:",
      error
    );

    alert("Der Termin konnte nicht geändert werden.");
    return;
  }

  await triggerBookingEmail(
    booking.id,
    "booking_rescheduled"
  );

  closeBookingModal();

  await loadBookings();
}


async function changeStatus(
  booking,
  newStatus,
  confirmationMessage
) {
  if (!confirm(confirmationMessage)) {
    return;
  }

  const success = await updateBookingStatus(
    booking.id,
    newStatus
  );

  if (!success) {
    return;
  }

  if (newStatus === "confirmed") {
    await triggerBookingEmail(
      booking.id,
      "booking_confirmed"
    );
  }

  if (newStatus === "cancelled") {
    await triggerBookingEmail(
      booking.id,
      "booking_cancelled"
    );
  }

  closeBookingModal();

  await loadBookings();
}


async function triggerBookingEmail(
  bookingId,
  event
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-booking-email",
      {
        body: {
          bookingId,
          event,
        },
      }
    );

    if (error) {
      console.error(
        `Fehler beim E-Mail-Event ${event}:`,
        error
      );
      return;
    }

    console.log(
      `E-Mail-Event ${event} ausgelöst:`,
      data
    );
  } catch (error) {
    console.error(
      `Unerwarteter Fehler beim E-Mail-Event ${event}:`,
      error
    );
  }
}


async function updateBookingStatus(
  bookingId,
  newStatus
) {
  const { error } = await supabase
    .from("bookings")
    .update({
      status: newStatus,
    })
    .eq("id", bookingId);

  if (error) {
    console.error(
      "Buchungsstatus konnte nicht geändert werden:",
      error
    );

    alert(
      "Der Status konnte nicht geändert werden."
    );

    return false;
  }

  return true;
}


/* ========================================
   LÖSCHEN
   ======================================== */

async function deleteBooking(booking) {
  const confirmed = confirm(
    "Möchtest du diese Buchung wirklich löschen?\n\n" +
      "Diese Aktion kann nicht rückgängig gemacht werden."
  );

  if (!confirmed) {
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", booking.id);

  if (error) {
    console.error(
      "Buchung konnte nicht gelöscht werden:",
      error
    );

    alert(
      "Die Buchung konnte nicht gelöscht werden."
    );

    return;
  }

  closeBookingModal();

  await loadBookings();
}


/* ========================================
   LISTEN-AKTIONEN
   ======================================== */

bookingsList?.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest(
      "[data-action]"
    );

    if (!button) {
      return;
    }

    const bookingId = button.dataset.id;
    const action = button.dataset.action;

    if (!bookingId || !action) {
      return;
    }

    if (action === "view") {
      openBookingModal(bookingId);
    }
  }
);


/* ========================================
   MODAL AKTIONEN GLOBAL
   ======================================== */

document.addEventListener(
  "click",
  async (event) => {
    const button = event.target.closest(
      "#booking-details-modal [data-action]"
    );

    if (!button) {
      return;
    }

    const bookingId = button.dataset.id;
    const action = button.dataset.action;

    if (!bookingId || !action) {
      return;
    }

    await handleBookingAction(
      bookingId,
      action
    );
  }
);


/* ========================================
   ESC = MODAL SCHLIESSEN
   ======================================== */

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      closeBookingModal();
    }
  }
);


/* ========================================
   FILTER-EVENTS
   ======================================== */

statusFilter?.addEventListener(
  "change",
  applyFilters
);


serviceFilter?.addEventListener(
  "change",
  applyFilters
);


dateFilter?.addEventListener(
  "change",
  () => {
    if (!customDateFilter) {
      applyFilters();

      return;
    }

    customDateFilter.hidden =
      dateFilter.value !== "custom";

    applyFilters();
  }
);


dateFromInput?.addEventListener(
  "change",
  applyFilters
);


dateToInput?.addEventListener(
  "change",
  applyFilters
);


searchInput?.addEventListener(
  "input",
  applyFilters
);


/* ========================================
   AKTUALISIEREN
   ======================================== */

refreshButton?.addEventListener(
  "click",
  loadBookings
);


/* ========================================
   INITIALISIERUNG
   ======================================== */

async function init() {
  createBookingModal();

  await loadServices();

  await loadBookings();
}


init();