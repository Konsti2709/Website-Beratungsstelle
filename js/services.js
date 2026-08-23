import { supabase } from "./supabase.js";
import { icons } from "./icons.js";

async function loadServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("Fehler beim Laden der Services:", error);

    const container = document.querySelector("#services-container");

    container.innerHTML = `
            <p>
                Die Angebote konnten gerade nicht geladen werden.
                Bitte versuchen Sie es später erneut.
            </p>
        `;

    return;
  }

  const container = document.querySelector("#services-container");

  container.innerHTML = "";
  container.classList.remove(
    "services-count-1",
    "services-count-2",
    "services-count-3-plus"
  );

  if (data.length === 0) {
    container.innerHTML = `
            <p>
                Aktuell sind keine Beratungsangebote verfügbar.
            </p>
        `;

    return;
  }

  const countClass =
    data.length === 1
      ? "services-count-1"
      : data.length === 2
        ? "services-count-2"
        : "services-count-3-plus";

  container.classList.add(countClass);

  data.forEach((service) => {
    const card = document.createElement("article");

    card.className = "service-card";

    card.innerHTML = `
            <div class="service-content">

                <h3>${service.title}</h3>

          <p class="service-description">${service.description ?? ""}</p>

          <div class="service-info">
            <span class="service-meta-item">${icons.clock3}<span>${service.duration} Minuten</span></span>
            <span class="service-meta-item">${icons.euro}<span>${service.price} €</span></span>
          </div>

          <a
            href="booking.html?service=${service.id}"
            class="btn btn-primary select-service-button"
          >Termin buchen</a>

            </div>
        `;

    container.appendChild(card);
  });
}

loadServices();
