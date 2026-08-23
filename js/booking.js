import { supabase } from "./supabase.js";
import { icons } from "./icons.js";

import {
  initBookingData,
  loadBlockedDaysForMonth,
  isDateSelectable,
  getAvailableSlots,
  formatDateISO,
} from "./booking-api.js";

console.log("Booking System gestartet");

// Utility: race a promise against a timeout (does not abort underlying request)
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

const servicesContainer = document.getElementById("services-list");

const bookingState = {
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  customer: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  },
};

const nextButtons = document.querySelectorAll(".next-step");
const previousButtons = document.querySelectorAll(".previous-step");
const bookingForm = document.getElementById("booking-form");
const bookingFormError = document.getElementById("booking-form-error");
const bookingSummaryError = document.getElementById("booking-summary-error");
const bookingConfirmButton = document.getElementById("booking-confirm-button");
let isBookingSubmitting = false;

function setBookingSubmitting(isSubmitting) {
  isBookingSubmitting = isSubmitting;
  if (!bookingConfirmButton) {
    return;
  }

  bookingConfirmButton.disabled = isSubmitting;
  bookingConfirmButton.textContent = isSubmitting
    ? "Buchung wird verarbeitet..."
    : "Termin bestätigen";
}

if (bookingConfirmButton) {
  bookingConfirmButton.addEventListener("click", confirmBooking);
}

// Attach live counter to message textarea
document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("message");
  if (msg) {
    msg.addEventListener("input", updateMessageCounter);
    // initialize
    updateMessageCounter();
    // also check message length state (warning + disable next)
    msg.addEventListener("input", checkMessageLengthState);
    checkMessageLengthState();
  }
});

nextButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const currentStep = event.target.closest(".booking-step");

    if (!currentStep) {
      return;
    }

    if (currentStep.id === "booking-step-service") {
      if (!bookingState.selectedService) {
        alert("Bitte wählen Sie zuerst eine Beratung aus.");
        return;
      }

      showStep("booking-step-date");
      return;
    }

    if (currentStep.id === "booking-step-date") {
      if (!bookingState.selectedDate) {
        alert("Bitte wählen Sie zuerst ein Datum aus.");
        return;
      }

      if (!bookingState.selectedTime) {
        alert("Bitte wählen Sie zuerst eine Uhrzeit aus.");
        return;
      }

      showStep("booking-step-data");
      return;
    }

    if (currentStep.id === "booking-step-data") {
      collectCustomerFormValues();

      if (!validateCustomerForm()) {
        return;
      }

      showStep("booking-step-summary");
      return;
    }
  });
});

previousButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const currentStep = button.closest(".booking-step");

    if (!currentStep) {
      return;
    }

    if (currentStep.id === "booking-step-date") {
      showStep("booking-step-service");
      return;
    }

    if (currentStep.id === "booking-step-data") {
      showStep("booking-step-date");
      return;
    }

    if (currentStep.id === "booking-step-summary") {
      showStep("booking-step-data");
      return;
    }
  });
});

function showError(message) {
  servicesContainer.innerHTML = `

        <div class="booking-error">

            <p>
                ${message}
            </p>

            <a href="services.html" class="btn btn-primary">
                Zu den Angeboten
            </a>

        </div>

    `;
}

function showStep(stepId) {
  const steps = document.querySelectorAll(".booking-step");

  steps.forEach((step) => {
    step.style.display = "none";
    step.classList.remove("active");
  });

  const activeStep = document.getElementById(stepId);

  if (activeStep) {
    activeStep.style.display = "block";
    activeStep.classList.add("active");
  }

  if (stepId === "booking-step-date") {
    updateTimesPanel();
  }

  if (stepId === "booking-step-data") {
    populateCustomerForm();
  }

  if (stepId === "booking-step-summary") {
    renderBookingSummary();
  }

  updateProgress(stepId);
}

function updateProgress(stepId) {
  const progressSteps = document.querySelectorAll(".progress-step");

  progressSteps.forEach((step) => {
    step.classList.remove("active");
  });

  let activeIndex = 0;

  if (stepId === "booking-step-date") {
    activeIndex = 1;
  }

  if (stepId === "booking-step-data") {
    activeIndex = 2;
  }

  if (stepId === "booking-step-summary") {
    activeIndex = 3;
  }

  if (progressSteps[activeIndex]) {
    progressSteps[activeIndex].classList.add("active");
  }
}

async function loadServices() {
  console.log("Lade Beratungsangebote...");

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  console.log("Services-Abfrage:", {
    data,
    error,
  });

  if (error) {
    console.error("Fehler beim Laden der Services:", error);

    showError("Die Beratungsangebote konnten gerade nicht geladen werden.");

    return;
  }

  if (!data || data.length === 0) {
    showError("Aktuell sind keine Beratungsangebote verfügbar.");

    return;
  }

  console.log("Services geladen:", data);

  servicesContainer.innerHTML = "";

  data.forEach((service) => {
    const card = document.createElement("div");
    card.className = "booking-service-card";

    const titleEl = document.createElement("h3");
    titleEl.textContent = service.title;

    const descriptionEl = document.createElement("p");
    descriptionEl.textContent = service.description || "";

    const infoDiv = document.createElement("div");
    infoDiv.className = "service-info";

    const durationSpan = document.createElement("span");
    durationSpan.innerHTML = `${icons.clock3}<span>${service.duration} Minuten</span>`;

    const priceSpan = document.createElement("span");
    priceSpan.innerHTML = `${icons.euro}<span>${service.price} €</span>`;

    infoDiv.append(durationSpan, priceSpan);

    const button = document.createElement("button");
    button.className = "btn btn-primary select-service-button";
    button.type = "button";
    button.textContent = "Auswählen";

    card.append(titleEl, descriptionEl, infoDiv, button);
    servicesContainer.appendChild(card);

    button.addEventListener("click", () => {
      document.querySelectorAll(".booking-service-card").forEach((card) => {
        card.classList.remove("selected");
      });

      card.classList.add("selected");

      bookingState.selectedService = {
        id: service.id,
        title: service.title,
        duration: service.duration,
        price: service.price,
      };

      console.log("Ausgewählte Beratung:", bookingState.selectedService);

      showStep("booking-step-date");
    });
  });
}

// Welcher Monat gerade im Kalender angezeigt wird (unabhängig vom gewählten Datum)
let calendarViewDate = new Date();
calendarViewDate.setDate(1);
calendarViewDate.setHours(0, 0, 0, 0);

function getTodayAtMidnight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function createDateAtMidnight(year, month, day) {
  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(dateA, dateB) {
  if (!dateA || !dateB) {
    return false;
  }

  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function initCalendar() {
  const previousMonthButton = document.getElementById("previous-month");
  const nextMonthButton = document.getElementById("next-month");

  previousMonthButton.addEventListener("click", async () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
    await loadBlockedDaysForMonth(
      calendarViewDate.getFullYear(),
      calendarViewDate.getMonth(),
    );
    renderCalendar();
  });

  nextMonthButton.addEventListener("click", async () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
    await loadBlockedDaysForMonth(
      calendarViewDate.getFullYear(),
      calendarViewDate.getMonth(),
    );
    renderCalendar();
  });

  renderCalendar();
}

function renderCalendar() {
  const monthTitle = document.getElementById("current-month");
  const daysContainer = document.getElementById("calendar-days");

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const today = getTodayAtMidnight();

  const monthName = calendarViewDate.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  monthTitle.textContent = monthName;

  daysContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay();

  // Sonntag = 0 → Montag ist der erste Wochentag
  if (startDay === 0) {
    startDay = 7;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Leere Felder vor dem ersten Tag des Monats
  for (let i = 1; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    daysContainer.appendChild(empty);
  }

  // Tage des Monats erstellen
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = createDateAtMidnight(year, month, day);
    const dayElement = document.createElement("button");

    dayElement.type = "button";
    dayElement.className = "calendar-day";
    dayElement.textContent = day;

    const isPastDay = dayDate < today;
    const isToday = isSameDay(dayDate, today);
    const isSelected = isSameDay(dayDate, bookingState.selectedDate);
    const canSelect = isDateSelectable(dayDate, today);

    if (!canSelect) {
      dayElement.classList.add("unavailable");
      dayElement.disabled = true;

      if (isPastDay) {
        dayElement.classList.add("past");
      }
    }

    if (isToday) {
      dayElement.classList.add("today");
    }

    if (isSelected) {
      dayElement.classList.add("selected");
    }

    if (canSelect) {
      dayElement.addEventListener("click", () => {
        document.querySelectorAll(".calendar-day.selected").forEach((el) => {
          el.classList.remove("selected");
        });

        dayElement.classList.add("selected");

        bookingState.selectedDate = dayDate;

        // Bei neuem Datum: alte Uhrzeit zurücksetzen
        bookingState.selectedTime = null;

        console.log("Ausgewähltes Datum:", bookingState.selectedDate);

        updateTimesPanel();
      });
    }

    daysContainer.appendChild(dayElement);
  }
}

const timesPlaceholder = document.getElementById("times-placeholder");
const timesContent = document.getElementById("times-content");
const selectedDateLabel = document.getElementById("selected-date-label");
const timeSlotsContainer = document.getElementById("time-slots");

function formatDateLabel(date) {
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateLabelShort(date) {
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

function renderBookingSummary() {
  const summaryContainer = document.getElementById("booking-summary");

  if (!summaryContainer) {
    return;
  }

  const service = bookingState.selectedService;
  const date = bookingState.selectedDate;
  const time = bookingState.selectedTime;
  const customer = bookingState.customer;

  if (!service || !date || !time) {
    summaryContainer.innerHTML = `
      <p class="times-empty">Bitte wählen Sie zuerst eine Beratung, ein Datum und eine Uhrzeit aus.</p>
    `;
    return;
  }

  summaryContainer.innerHTML = "";

  const summaryCard = document.createElement("div");
  summaryCard.className = "booking-summary-card";

  const title = document.createElement("h3");
  title.textContent = "Ihre Buchung";
  summaryCard.appendChild(title);

  function appendSummaryRow(section, label, value, isLink = false) {
    const heading = document.createElement("p");
    heading.className = "summary-heading";
    heading.textContent = label;

    const valueEl = document.createElement("p");
    valueEl.className = "summary-value";

    if (isLink) {
      const link = document.createElement("a");
      link.href = `mailto:${value}`;
      link.textContent = value;
      valueEl.appendChild(link);
    } else {
      valueEl.textContent = value;
    }

    section.append(heading, valueEl);
  }

  const serviceSection = document.createElement("div");
  serviceSection.className = "summary-section";
  appendSummaryRow(serviceSection, "Beratung", service.title);
  appendSummaryRow(serviceSection, "Dauer", `${service.duration} Minuten`);
  appendSummaryRow(serviceSection, "Preis", formatCurrency(service.price));
  summaryCard.appendChild(serviceSection);

  const dateSection = document.createElement("div");
  dateSection.className = "summary-section";
  appendSummaryRow(dateSection, "Datum", formatDateLabelShort(date));
  appendSummaryRow(dateSection, "Uhrzeit", `${time} Uhr`);
  summaryCard.appendChild(dateSection);

  const customerSection = document.createElement("div");
  customerSection.className = "summary-section";
  appendSummaryRow(customerSection, "Ihre Daten", `${customer.firstName} ${customer.lastName}`);
  appendSummaryRow(customerSection, "E-Mail", customer.email, true);

  if (customer.phone) {
    appendSummaryRow(customerSection, "Telefon", customer.phone);
  }

  if (customer.message) {
    appendSummaryRow(customerSection, "Nachricht", customer.message);
  }

  summaryCard.appendChild(customerSection);

  summaryContainer.appendChild(summaryCard);
}

function collectCustomerFormValues() {
  if (!bookingForm) {
    return;
  }

  bookingState.customer = {
    firstName: document.getElementById("first-name").value.trim(),
    lastName: document.getElementById("last-name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    message: document.getElementById("message").value.trim(),
  };
}

function populateCustomerForm() {
  if (!bookingForm) {
    return;
  }

  document.getElementById("first-name").value = bookingState.customer.firstName;
  document.getElementById("last-name").value = bookingState.customer.lastName;
  document.getElementById("email").value = bookingState.customer.email;
  document.getElementById("phone").value = bookingState.customer.phone;
  document.getElementById("message").value = bookingState.customer.message;

  // update message counter when populating
  const msgEl = document.getElementById("message");
  if (msgEl) {
    updateMessageCounter();
  }

  if (bookingFormError) {
    bookingFormError.hidden = true;
  }
}

function updateMessageCounter() {
  const counter = document.getElementById("message-counter");
  const msg = document.getElementById("message");
  if (!counter || !msg) return;
  const len = msg.value.length;
  counter.textContent = len;
  if (len > 1800) {
    counter.style.color = "#b45200"; // warn color
  } else {
    counter.style.color = "";
  }
}

function checkMessageLengthState() {
  const msg = document.getElementById("message");
  const warning = document.getElementById("message-warning");
  if (!msg || !warning) return;
  const len = msg.value.length;
  const nexts = document.querySelectorAll(".next-step");

  if (len > 2000) {
    warning.hidden = false;
    nexts.forEach((b) => (b.disabled = true));
  } else {
    warning.hidden = true;
    nexts.forEach((b) => (b.disabled = false));
  }
}

function validateCustomerForm() {
  if (!bookingForm) {
    return false;
  }

  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return false;
  }

  const emailValue = bookingState.customer.email;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(emailValue)) {
    if (bookingFormError) {
      bookingFormError.textContent =
        "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
      bookingFormError.hidden = false;
    }
    return false;
  }

  // Vorname / Nachname Mindestlänge
  const first = bookingState.customer.firstName || "";
  const last = bookingState.customer.lastName || "";
  if (first.length < 2 || last.length < 2) {
    if (bookingFormError) {
      bookingFormError.textContent =
        "Bitte geben Sie Vor- und Nachname mit mindestens 2 Zeichen an.";
      bookingFormError.hidden = false;
    }
    return false;
  }

  // Telefon: optional, aber wenn angegeben muss es ein plausibles Format haben
  const phone = bookingState.customer.phone || "";
  if (phone.length > 0) {
    const phonePattern = /^[+0-9()\s\-]{6,20}$/;
    if (!phonePattern.test(phone)) {
      if (bookingFormError) {
        bookingFormError.textContent =
          "Bitte geben Sie eine gültige Telefonnummer ein (Ziffern, +, -, Leerzeichen).";
        bookingFormError.hidden = false;
      }
      return false;
    }
  }

  // Nachricht: optional, max Länge
  const message = bookingState.customer.message || "";
  if (message.length > 2000) {
    if (bookingFormError) {
      bookingFormError.textContent =
        "Die Nachricht ist zu lang. Bitte kürzen Sie Ihre Mitteilung.";
      bookingFormError.hidden = false;
    }
    return false;
  }

  if (bookingFormError) {
    bookingFormError.hidden = true;
  }

  return true;
}

async function updateTimesPanel() {
  if (!bookingState.selectedDate) {
    timesPlaceholder.hidden = false;
    timesContent.hidden = true;
    return;
  }

  timesPlaceholder.hidden = true;
  timesContent.hidden = false;

  selectedDateLabel.textContent = formatDateLabel(bookingState.selectedDate);

  timeSlotsContainer.innerHTML =
    '<p class="times-loading">Zeiten werden geladen...</p>';

  const duration = bookingState.selectedService?.duration;

  if (!duration) {
    timeSlotsContainer.innerHTML =
      '<p class="times-empty">Bitte wählen Sie zuerst eine Beratung aus.</p>';
    return;
  }

  const slots = await getAvailableSlots(bookingState.selectedDate, duration);

  timeSlotsContainer.innerHTML = "";

  if (slots.length === 0) {
    timeSlotsContainer.innerHTML =
      '<p class="times-empty">Keine freien Zeiten an diesem Tag.</p>';
    return;
  }

  slots.forEach((time) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "time-slot";
    button.textContent = time;

    if (bookingState.selectedTime === time) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      document.querySelectorAll(".time-slot.selected").forEach((el) => {
        el.classList.remove("selected");
      });

      button.classList.add("selected");
      bookingState.selectedTime = time;

      console.log("Ausgewählte Uhrzeit:", bookingState.selectedTime);
    });

    timeSlotsContainer.appendChild(button);
  });
}

function showSummaryError(message) {
  if (!bookingSummaryError) {
    return;
  }

  bookingSummaryError.textContent = message;
  bookingSummaryError.hidden = false;
}

function hideSummaryError() {
  if (bookingSummaryError) {
    bookingSummaryError.hidden = true;
  }
}

async function confirmBooking() {
  if (isBookingSubmitting) {
    return;
  }

  hideSummaryError();
  setBookingSubmitting(true);

  try {
    // --------------------------------------------------
    // 1. Grundlegende Validierung
    // --------------------------------------------------

    if (!bookingState.selectedService) {
      showSummaryError("Bitte wählen Sie zuerst ein Beratungsangebot aus.");
      return;
    }

    if (!bookingState.selectedDate) {
      showSummaryError("Bitte wählen Sie zuerst ein Datum aus.");
      return;
    }

    if (!bookingState.selectedTime) {
      showSummaryError("Bitte wählen Sie zuerst eine Uhrzeit aus.");
      return;
    }

    collectCustomerFormValues();

    if (!validateCustomerForm()) {
      showSummaryError("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    // --------------------------------------------------
    // 2. Service noch einmal direkt aus Supabase laden
    // --------------------------------------------------

    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .select("id, duration, price, active")
      .eq("id", bookingState.selectedService.id)
      .single();

    if (serviceError || !serviceData || !serviceData.active) {
      console.error(
        "Fehler beim Laden des Dienstes:",
        serviceError,
      );

      showSummaryError(
        "Der gewählte Service ist leider nicht mehr verfügbar.",
      );

      return;
    }

    // --------------------------------------------------
    // 3. Verfügbarkeit unmittelbar vor der Buchung prüfen
    // --------------------------------------------------

    const availableSlots = await getAvailableSlots(
      bookingState.selectedDate,
      serviceData.duration,
    );

    if (!availableSlots.includes(bookingState.selectedTime)) {
      showSummaryError(
        "Der gewählte Termin ist leider inzwischen vergeben. Bitte wählen Sie eine andere Uhrzeit.",
      );

      return;
    }

    // --------------------------------------------------
    // 4. Buchungsdaten vorbereiten
    // --------------------------------------------------

    const bookingDate = formatDateISO(bookingState.selectedDate);

    const bookingTime = bookingState.selectedTime;

    const customerName =
      `${bookingState.customer.firstName} ${bookingState.customer.lastName}`;


    // --------------------------------------------------
    // 5. Buchung über sichere PostgreSQL-Funktion speichern
    // --------------------------------------------------

    const rpcPromise = supabase.rpc("create_booking", {
      p_service_id: serviceData.id,
      p_customer_name: customerName,
      p_customer_email: bookingState.customer.email,
      p_customer_phone: bookingState.customer.phone || null,
      p_booking_date: bookingDate,
      p_booking_time: bookingTime,
      p_notes: bookingState.customer.message || null,
    });

    const result = await withTimeout(rpcPromise, 10000);

    if (result?.error) {
      const bookingError = result.error;

      console.error(
        "Fehler beim Erstellen der Buchung:",
        bookingError,
      );

      console.error(
        "Booking error code:",
        bookingError.code,
      );

      console.error(
        "Booking error message:",
        bookingError.message,
      );

      const errorMessage =
        bookingError.message || "";

      if (errorMessage.includes("SERVICE_NOT_AVAILABLE")) {
        showSummaryError(
          "Der gewählte Service ist leider nicht mehr verfügbar.",
        );
      } else if (errorMessage.includes("MINIMUM_NOTICE_NOT_MET")) {
        showSummaryError(
          "Dieser Termin liegt zu kurzfristig. Bitte wählen Sie eine spätere Uhrzeit.",
        );
      } else if (errorMessage.includes("MAXIMUM_ADVANCE_REACHED")) {
        showSummaryError(
          "Dieser Termin liegt außerhalb des möglichen Buchungszeitraums.",
        );
      } else if (errorMessage.includes("DAY_BLOCKED")) {
        showSummaryError(
          "Dieser Tag ist leider nicht buchbar.",
        );
      } else if (errorMessage.includes("OUTSIDE_AVAILABILITY")) {
        showSummaryError(
          "Diese Uhrzeit liegt nicht innerhalb der verfügbaren Arbeitszeit.",
        );
      } else if (errorMessage.includes("TIME_BLOCKED")) {
        showSummaryError(
          "Diese Uhrzeit ist bereits gesperrt.",
        );
      } else if (errorMessage.includes("TIME_ALREADY_BOOKED")) {
        showSummaryError(
          "Dieser Termin wurde gerade von jemand anderem gebucht. Bitte wählen Sie eine andere Uhrzeit.",
        );
      } else {
        showSummaryError(
          "Die Buchung konnte leider nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
        );
      }

      return;
    }

    const bookingId = result.data;


    // --------------------------------------------------
    // 6. Erfolgreiche Buchung
    // --------------------------------------------------

    console.log("Buchung erfolgreich gespeichert:", bookingId);

    const createdAt = new Date().toISOString();

    const params = new URLSearchParams({
      id: bookingId,
      service: bookingState.selectedService.title || "",
      date: bookingDate,
      time: bookingTime,
      created_at: createdAt,
    });

    window.location.href = `success.html?${params.toString()}`;

  } catch (error) {
    console.error(
      "Unbekannter Fehler bei der Buchungsbestätigung:",
      error,
    );

    if (error?.message === "timeout") {
      showSummaryError(
        "Die Anfrage hat zu lange gedauert. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      );
    } else {
      showSummaryError(
        "Die Buchung konnte leider nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
      );
    }

  } finally {
    setBookingSubmitting(false);
  }
}

async function initBookingPage() {
  await initBookingData();
  loadServices();
  initCalendar();
  updateTimesPanel();
}

initBookingPage();
