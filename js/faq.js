function initFAQ() {

    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {

        const button = item.querySelector(".faq-question");

        button.addEventListener("click", () => {

            const isOpen = item.classList.contains("is-open");


            faqItems.forEach(faq => {
                faq.classList.remove("is-open");

                faq.querySelector(".faq-question")
                    .setAttribute("aria-expanded", "false");
            });


            if (!isOpen) {

                item.classList.add("is-open");

                button.setAttribute("aria-expanded", "true");

            }

        });

    });

}