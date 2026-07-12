fetch("components/header.html")
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("afterbegin", data);

        if (typeof initHeader === "function") {
            initHeader();
        }
    });


fetch("components/footer.html")
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("beforeend", data);
    });


document.addEventListener("DOMContentLoaded", () => {

    if (typeof initFAQ === "function" && document.querySelector(".faq-item")) {
        initFAQ();
    }

});