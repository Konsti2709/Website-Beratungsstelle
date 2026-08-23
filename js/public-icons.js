import { icons } from "./icons.js";

function initializePublicIcons() {
  document.querySelectorAll("[data-icon]").forEach((element) => {
    const icon = icons[element.dataset.icon];

    if (icon) {
      element.innerHTML = icon;
    }
  });
}

initializePublicIcons();