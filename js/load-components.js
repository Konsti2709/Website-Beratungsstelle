fetch("components/header.html")
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("afterbegin", data);

        if (typeof initHeader === "function") initHeader();
        if (typeof initFAQ === "function") initFAQ();
    });