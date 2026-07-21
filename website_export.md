
============================================================
DATEI: css\contact.css
============================================================

.contact-hero {
    padding:90px 20px;
    background:linear-gradient(135deg,var(--color-background),#F4E7DB);
    text-align:center;
}

.contact-hero-content {
    max-width:800px;
    margin:0 auto;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeUp .8s ease forwards;
}

.contact-hero h1 {
    margin-bottom:20px;
    color:var(--color-dark);
    font-size:2.2rem;
}

.contact-hero p {
    color:var(--color-text-muted);
    line-height:1.7;
}

.contact-container {
    max-width:1200px;
    margin:0 auto;
}

.contact-options,
.contact-process,
.contact-form-section {
    padding:80px 20px;
}

.contact-options h2,
.contact-process h2,
.contact-form-section h2 {
    margin-bottom:30px;
    text-align:center;
    color:var(--color-dark);
}

.contact-cards {
    display:flex;
    flex-direction:column;
    gap:25px;
}

.contact-card {
    padding:35px 25px;
    background:var(--color-background);
    text-align:center;
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    transition:var(--transition);
}

.contact-card:hover {
    transform:translateY(-5px);
}

.contact-icon {
    margin-bottom:15px;
    font-size:2rem;
}

.contact-card h3 {
    margin-bottom:15px;
    color:var(--color-dark);
}

.contact-card p {
    line-height:1.6;
}

.contact-card a:not(.btn) {
    color:var(--color-dark);
}

.contact-small {
    opacity:.8;
    font-size:.9rem;
}

.contact-process {
    background:var(--color-surface);
}

.contact-steps {
    display:grid;
    grid-template-columns:1fr;
    gap:45px;
}

.contact-step {
    position:relative;
    text-align:center;
}

.contact-step span {
    display:flex;
    justify-content:center;
    align-items:center;
    width:60px;
    height:60px;
    margin:0 auto 20px;
    background:var(--color-primary);
    color:var(--color-dark);
    border-radius:50%;
    font-size:1.3rem;
    font-weight:700;
    transition:var(--transition);
}

.contact-step:hover span {
    transform:scale(1.15);
}

.contact-step:not(:last-child)::after {
    content:"↓";
    display:block;
    margin-top:35px;
    font-size:1.5rem;
    color:var(--color-primary);
}

.contact-step p {
    max-width:250px;
    margin:0 auto;
    line-height:1.6;
    color:var(--color-text-muted);
}

.contact-form-section {
    background:var(--color-background);
}

.contact-form-container {
    max-width:600px;
    margin:0 auto;
}

.contact-intro {
    margin-bottom:35px;
    color:var(--color-text-muted);
    text-align:center;
}

.contact-form {
    display:flex;
    flex-direction:column;
    gap:12px;
}

.contact-form label {
    margin-top:10px;
    color:var(--color-dark);
    font-weight:600;
}

.contact-form input,
.contact-form textarea,
.contact-form select {
    width:100%;
    padding:14px 16px;
    border:1px solid rgba(42,36,33,.15);
    border-radius:var(--radius);
    background:#fff;
    color:var(--color-dark);
    font-family:inherit;
    font-size:1rem;
    transition:var(--transition);
}

.contact-form input:focus,
.contact-form textarea:focus,
.contact-form select:focus {
    outline:none;
    border-color:var(--color-primary);
    box-shadow:0 0 0 3px rgba(212,178,149,.25);
}

.contact-form textarea {
    min-height:140px;
    resize:vertical;
}

.contact-submit {
    align-self:center;
    padding:14px 28px;
    background:var(--color-primary);
    color:var(--color-dark);
    border-radius:var(--radius);
    border:none;
    font-family:inherit;
    font-size:1rem;
    font-weight:600;
    cursor:pointer;
    transition:var(--transition);
}

.contact-submit:hover {
    transform:translateY(-2px);
    filter:brightness(.95);
}

.privacy-note {
    margin:25px 0;
    padding:15px;
    background:var(--color-primary-soft);
    border-radius:var(--radius);
    color:var(--color-dark);
    text-align:center;
    line-height:1.5;
}

.faq-link {
    margin-top:50px;
    text-align:center;
}

.faq-link p {
    margin-bottom:10px;
    color:var(--color-dark);
}

.faq-link a {
    color:var(--color-dark);
    font-weight:600;
    text-decoration:none;
    border-bottom:2px solid var(--color-primary);
}

.faq-link a:hover {
    color:var(--color-primary);
}

@media(min-width:1024px) {

    .contact-hero h1 {
        font-size:3.5rem;
    }

    .contact-cards {
        flex-direction:row;
    }

    .contact-card {
        flex:1;
    }

    .contact-steps {
        grid-template-columns:repeat(3,1fr);
        gap:30px;
    }

    .contact-step {
        display:flex;
        flex-direction:column;
        align-items:center;
    }

    .contact-step:not(:last-child)::after {
        content:"→";
        position:absolute;
        top:30px;
        right:-18px;
        margin:0;
        font-size:1.5rem;
        color:var(--color-primary);
    }

}


============================================================
DATEI: contact.html
============================================================

<!DOCTYPE html>
<html lang="de">
<head>
    <title>Aufwind Beratung</title>
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/header.css">
    <link rel="stylesheet" href="css/footer.css">
    <link rel="stylesheet" href="css/contact.css">
</head>
<body data-page="contact">
<main>
<section class="contact-hero">
    <div class="contact-hero-content">
        <h1 data-text="contact_Hero_title"></h1>
        <p data-text="contact_Hero_text"></p>
    </div>
</section>

<section class="contact-options">
    <div class="contact-container">
        <h2 data-text="contact_Kontaktmöglichkeiten_title"></h2>
        <div class="contact-cards">

            <article class="contact-card">
                <div class="contact-icon">✉</div>
                <h3 data-text="contact_Kontakt_1_title"></h3>
                <p data-text="contact_Kontakt_1_text"></p>
                <a href="mailto:kontakt@aufwind-beratung.de" class="btn btn-primary" data-text="contact_Kontakt_1_button"></a>
            </article>

            <article class="contact-card">
                <div class="contact-icon">☎</div>
                <h3 data-text="contact_Kontakt_2_title"></h3>
                <p data-text="contact_Kontakt_2_text"></p>
                <p class="contact-small" data-text="contact_Kontakt_2_zeit"></p>
            </article>

            <article class="contact-card">
                <div class="contact-icon">📍</div>
                <h3 data-text="contact_Kontakt_3_title"></h3>
                <p data-text="contact_Kontakt_3_text"></p>
                <p class="contact-small" data-text="contact_Kontakt_3_untertitel"></p>
            </article>

        </div>
    </div>
</section>

<section class="contact-process">
    <div class="contact-container">
        <h2 data-text="contact_Ablauf_title"></h2>
        <div class="contact-steps">

            <div class="contact-step">
                <span>1</span>
                <p data-text="contact_Schritt_1_title"></p>
            </div>

            <div class="contact-step">
                <span>2</span>
                <p data-text="contact_Schritt_2_title"></p>
            </div>

            <div class="contact-step">
                <span>3</span>
                <p data-text="contact_Schritt_3_title"></p>
            </div>

        </div>
    </div>
</section>

<section class="contact-form-section">
    <div class="contact-form-container">

        <h2 data-text="contact_Formular_title"></h2>
        <p class="contact-intro" data-text="contact_Formular_intro"></p>

        <form class="contact-form">

            <label for="name" data-text="contact_Formular_label_name"></label>
            <input type="text" id="name" name="name" required>

            <label for="email" data-text="contact_Formular_label_email"></label>
            <input type="email" id="email" name="email" required>

            <label for="topic" data-text="contact_Formular_label_topic"></label>
            <select id="topic" name="topic">
                <option data-text="contact_Formular_option_1"></option>
                <option data-text="contact_Formular_option_2"></option>
                <option data-text="contact_Formular_option_3"></option>
                <option data-text="contact_Formular_option_4"></option>
            </select>

            <label for="contact-type" data-text="contact_Formular_label_contact_type"></label>
            <select id="contact-type" name="contact-type">
                <option data-text="contact_Formular_option_email"></option>
                <option data-text="contact_Formular_option_phone"></option>
            </select>

            <label for="message" data-text="contact_Formular_label_message"></label>
            <textarea id="message" name="message" rows="5" required></textarea>

            <p class="privacy-note" data-text="contact_Formular_privacy"></p>

            <button type="submit" class="btn btn-primary contact-submit" data-text="contact_Formular_button"></button>

        </form>

        <div class="faq-link">
            <p data-text="contact_FAQ_Link_text"></p>
            <a href="faq.html" data-text="contact_FAQ_Link_link"></a>
        </div>

    </div>
</section>
</main>

<script src="js/header.js"></script>
<script src="js/load-components.js"></script>
<script src="js/content-loader.js"></script>
</body>
</html>

