function initHeader() {
    const navigation = document.querySelector(".navigation");
    const menuToggle = document.querySelector(".menu-toggle");

    menuToggle.addEventListener("click", () => {
        navigation.classList.toggle("is-active");
    });

    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".navigation a").forEach(link => {
    const linkPage = link.getAttribute("href");

    if (window.location.pathname.endsWith(linkPage)) {
        link.classList.add("active");
    }

    console.log(window.location.pathname);
    console.log(currentPage);
});
}