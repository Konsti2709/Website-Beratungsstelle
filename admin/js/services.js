import { supabase } from "../../js/supabase.js";
import { icons } from "../../js/icons.js";

/* ========================================
   ELEMENTE
   ======================================== */

const listElement =
  document.getElementById("services-list");

const loadingElement =
  document.getElementById("services-loading");

const emptyElement =
  document.getElementById("services-empty");

const errorElement =
  document.getElementById("services-error");

const messageElement =
  document.getElementById("services-message");

const addButton =
  document.getElementById("add-service-button");

const emptyAddButton =
  document.getElementById("empty-add-service");

const retryButton =
  document.getElementById("retry-services");

const modal =
  document.getElementById("service-modal");

const modalTitle =
  document.getElementById("service-modal-title");

const modalCloseButton =
  document.getElementById("service-modal-close");

const modalCancelButton =
  document.getElementById("service-cancel");

const form =
  document.getElementById("service-form");

const saveButton =
  document.getElementById("service-save");

const formError =
  document.getElementById("service-form-error");

const editIdInput =
  document.getElementById("service-edit-id");

const titleInput =
  document.getElementById("service-title");

const descriptionInput =
  document.getElementById("service-description");

const durationInput =
  document.getElementById("service-duration");

const priceInput =
  document.getElementById("service-price");

const activeInput =
  document.getElementById("service-active");


/* ========================================
   DATEN
   ======================================== */

let services = [];


/* ========================================
   HILFSFUNKTIONEN
   ======================================== */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatCurrency(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "–";
  }

  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }
  ).format(number);
}


/* ========================================
   NACHRICHTEN
   ======================================== */

function showMessage(message, type) {
  if (!messageElement) {
    return;
  }

  messageElement.textContent =
    message;

  messageElement.className =
    `services-message ${type}`;

  messageElement.hidden = false;
}


function hideMessage() {
  if (!messageElement) {
    return;
  }

  messageElement.hidden = true;
  messageElement.textContent = "";
  messageElement.className =
    "services-message";
}


function showFormError(message) {
  if (!formError) {
    return;
  }

  formError.textContent =
    message;

  formError.hidden = false;
}


function hideFormError() {
  if (!formError) {
    return;
  }

  formError.textContent = "";
  formError.hidden = true;
}


/* ========================================
   ZUSTÄNDE
   ======================================== */

function showLoading() {
  loadingElement.hidden = false;
  emptyElement.hidden = true;
  errorElement.hidden = true;

  listElement.innerHTML = "";
}


function showEmpty() {
  loadingElement.hidden = true;
  emptyElement.hidden = false;
  errorElement.hidden = true;

  listElement.innerHTML = "";
}


function showErrorState() {
  loadingElement.hidden = true;
  emptyElement.hidden = true;
  errorElement.hidden = false;

  listElement.innerHTML = "";
}


function showList() {
  loadingElement.hidden = true;
  emptyElement.hidden = true;
  errorElement.hidden = true;
}


/* ========================================
   MODAL
   ======================================== */

function openCreateModal() {
  form.reset();

  editIdInput.value = "";

  modalTitle.textContent =
    "Neues Beratungsangebot";

  saveButton.textContent =
    "Angebot speichern";

  activeInput.value =
    "true";

  hideFormError();

  modal.hidden = false;

  document.body.classList.add(
    "service-modal-open"
  );

  requestAnimationFrame(() => {
    titleInput.focus();
  });
}


function openEditModal(service) {
  form.reset();

  hideFormError();

  editIdInput.value =
    service.id;

  modalTitle.textContent =
    "Beratungsangebot bearbeiten";

  saveButton.textContent =
    "Änderungen speichern";

  titleInput.value =
    service.title ?? "";

  descriptionInput.value =
    service.description ?? "";

  durationInput.value =
    service.duration ?? "";

  priceInput.value =
    service.price ?? "";

  activeInput.value =
    service.active ? "true" : "false";

  modal.hidden = false;

  document.body.classList.add(
    "service-modal-open"
  );

  requestAnimationFrame(() => {
    titleInput.focus();
  });
}


function closeModal() {
  modal.hidden = true;

  document.body.classList.remove(
    "service-modal-open"
  );

  hideFormError();

  form.reset();

  editIdInput.value = "";
}


/* ========================================
   VALIDIERUNG
   ======================================== */

function validateForm() {
  const title =
    titleInput.value.trim();

  const description =
    descriptionInput.value.trim();

  const duration =
    Number(durationInput.value);

  const price =
    Number(priceInput.value);

  if (!title) {
    return "Bitte gib einen Titel ein.";
  }

  if (!description) {
    return "Bitte gib eine Beschreibung ein.";
  }

  if (
    !Number.isInteger(duration) ||
    duration <= 0
  ) {
    return "Die Dauer muss eine positive ganze Zahl sein.";
  }

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    return "Bitte gib einen gültigen Preis ein.";
  }

  return null;
}


/* ========================================
   DATEN LADEN
   ======================================== */

async function loadServices() {
  showLoading();
  hideMessage();

  const {
    data,
    error,
  } = await supabase
    .from("services")
    .select(
      "id, title, description, price, duration, active, sort_order"
    )
    .order(
      "sort_order",
      {
        ascending: true,
        nullsFirst: false,
      }
    );

  if (error) {
    console.error(
      "Beratungsangebote konnten nicht geladen werden:",
      error
    );

    showErrorState();
    return;
  }

  services =
    data ?? [];

  renderServices();
}


/* ========================================
   DARSTELLUNG
   ======================================== */

function renderServices() {
  if (services.length === 0) {
    showEmpty();
    return;
  }

  showList();

  listElement.innerHTML =
    services
      .map(
        (service) => {

          const statusClass =
            service.active
              ? "service-status-active"
              : "service-status-inactive";

          const statusText =
            service.active
              ? "Aktiv"
              : "Inaktiv";

          const cardClass =
            service.active
              ? "service-card"
              : "service-card inactive";

          return `
            <article class="${cardClass}">

              <div class="service-card-header">

                <h3 class="service-card-title">
                  ${escapeHtml(service.title)}
                </h3>

                <span
                  class="service-status ${statusClass}"
                >
                  ${statusText}
                </span>

              </div>

              <p class="service-card-description">
                ${escapeHtml(
                  service.description || "Keine Beschreibung."
                )}
              </p>

              <div class="service-card-info">

                <span class="service-meta-item">
                  ${icons.clock3}
                  <span>
                  ${escapeHtml(service.duration)}
                  Minuten
                  </span>
                </span>

                <span class="service-meta-item">
                  ${icons.euro}
                  <span>
                  ${escapeHtml(
                    formatCurrency(service.price)
                  )}
                  </span>
                </span>

              </div>

              <div class="service-card-footer">

                <button
                  type="button"
                  class="service-edit-button"
                  data-action="edit"
                  data-id="${escapeHtml(service.id)}"
                >
                  ${icons.edit}
                  Bearbeiten
                </button>

              </div>

            </article>
          `;
        }
      )
      .join("");
}


/* ========================================
   SPEICHERN
   ======================================== */

async function handleFormSubmit(event) {
  event.preventDefault();

  hideFormError();

  const validationError =
    validateForm();

  if (validationError) {
    showFormError(validationError);
    return;
  }

  const title =
    titleInput.value.trim();

  const description =
    descriptionInput.value.trim();

  const duration =
    Number(durationInput.value);

  const price =
    Number(priceInput.value);

  const active =
    activeInput.value === "true";

  const editId =
    editIdInput.value;

  saveButton.disabled = true;

  saveButton.textContent =
    editId
      ? "Änderungen speichern..."
      : "Angebot speichern...";

  try {

    const payload = {
      title,
      description,
      duration,
      price,
      active,
    };

    let error = null;

    if (editId) {

      const result =
        await supabase
          .from("services")
          .update(payload)
          .eq("id", editId);

      error =
        result.error;

    } else {

      const maxSortOrder =
        services.reduce(
          (max, service) => {
            const value =
              Number(service.sort_order);

            return Number.isFinite(value)
              ? Math.max(max, value)
              : max;
          },
          0
        );

      const result =
        await supabase
          .from("services")
          .insert({
            ...payload,
            sort_order:
              maxSortOrder + 1,
          });

      error =
        result.error;
    }

    if (error) {
      console.error(
        "Beratungsangebot konnte nicht gespeichert werden:",
        error
      );

      throw error;
    }

    closeModal();

    await loadServices();

    showMessage(
      editId
        ? "Beratungsangebot wurde aktualisiert."
        : "Beratungsangebot wurde erstellt.",
      "success"
    );

  } catch (error) {

    console.error(
      "Fehler beim Speichern des Beratungsangebots:",
      error
    );

    showFormError(
      "Das Beratungsangebot konnte nicht gespeichert werden."
    );

  } finally {

    saveButton.disabled = false;

    saveButton.textContent =
      editId
        ? "Änderungen speichern"
        : "Angebot speichern";
  }
}


/* ========================================
   AKTIONEN
   ======================================== */

listElement?.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) {
      return;
    }

    if (
      button.dataset.action !== "edit"
    ) {
      return;
    }

    const id =
      button.dataset.id;

    const service =
      services.find(
        (item) =>
          item.id === id
      );

    if (!service) {
      return;
    }

    openEditModal(service);
  }
);


/* ========================================
   EVENTS
   ======================================== */

addButton?.addEventListener(
  "click",
  openCreateModal
);

emptyAddButton?.addEventListener(
  "click",
  openCreateModal
);

retryButton?.addEventListener(
  "click",
  loadServices
);

modalCloseButton?.addEventListener(
  "click",
  closeModal
);

modalCancelButton?.addEventListener(
  "click",
  closeModal
);

modal?.addEventListener(
  "click",
  (event) => {

    if (
      event.target.matches(
        "[data-modal-close]"
      )
    ) {
      closeModal();
    }

  }
);

form?.addEventListener(
  "submit",
  handleFormSubmit
);


/* ========================================
   ESC
   ======================================== */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      modal &&
      !modal.hidden
    ) {
      closeModal();
    }

  }
);


/* ========================================
   START
   ======================================== */

loadServices();