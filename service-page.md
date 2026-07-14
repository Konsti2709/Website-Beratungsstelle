
============================================================
DATEI: css\services-page.css
============================================================

/* Hero */

.services-hero {
    padding:90px 20px;
    background:linear-gradient(
        135deg,
        var(--color-background),
        var(--color-primary-soft)
    );
    text-align:center;
}

.services-hero-content {
    max-width:800px;
    margin:0 auto;
    opacity:0;
    transform:translateY(20px);
    animation:fadeUp .8s ease forwards;
}

.services-hero h1 {
    margin-bottom:20px;
    color:var(--color-dark);
    font-size:2.3rem;
}

.services-hero p {
    color:var(--color-text-muted);
    line-height:1.7;
}


/* Allgemein */

.services-container {
    max-width:var(--container-width);
    margin:0 auto;
}

.services-overview,
.services-process,
.services-suitable,
.services-cta {
    padding:80px 20px;
}

.services-container h2 {
    margin-bottom:30px;
    text-align:center;
    color:var(--color-dark);
}


/* Angebote */

.services-cards {
    display:grid;
    grid-template-columns:1fr;
    gap:25px;
}

.service-card {
    padding:35px 25px;
    background:var(--color-surface);
    text-align:center;
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    transition:var(--transition);
}

.service-card:hover {
    transform:translateY(-5px);
}

.service-icon {
    margin-bottom:15px;
    font-size:2rem;
}

.service-card h3 {
    margin-bottom:15px;
    color:var(--color-dark);
}

.service-card p {
    color:var(--color-text-muted);
    line-height:1.6;
}


/* Ablauf */

.services-process {
    background:var(--color-surface);
}

.services-steps {
    display:grid;
    grid-template-columns:1fr;
    gap:45px;
}

.services-step {
    position:relative;
    text-align:center;
}

.services-step span {
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

.services-step:hover span {
    transform:scale(1.15);
}

.services-step:not(:last-child)::after {
    content:"↓";
    display:block;
    margin-top:35px;
    font-size:1.5rem;
    color:var(--color-primary);
}

.services-step h3 {
    margin-bottom:15px;
    color:var(--color-dark);
}

.services-step p {
    color:var(--color-text-muted);
    line-height:1.6;
}


/* Geeignet */

.services-suitable {
    background:var(--color-background);
}

.services-suitable p {
    max-width:800px;
    margin:0 auto 30px;
    color:var(--color-text-muted);
    line-height:1.7;
    text-align:center;
}

.services-suitable ul {
    max-width:700px;
    margin:0 auto;
    color:var(--color-text-muted);
    line-height:1.8;
}


/* CTA */

.services-cta {
    background:var(--color-dark);
    text-align:center;
}

.services-cta h2 {
    color:var(--color-text-light);
    margin-bottom:30px;
}

.services-cta .btn {
    display:inline-block;
    padding:14px 28px;
    background:var(--color-primary);
    color:var(--color-dark);
    border-radius:var(--radius);
    text-decoration:none;
    font-weight:600;
    transition:var(--transition);
}

.services-cta .btn:hover {
    transform:translateY(-2px);
    filter:brightness(.95);
}


/* Animation */

@keyframes fadeUp {
    to {
        opacity:1;
        transform:translateY(0);
    }
}


/* Desktop */

@media(min-width:1024px) {

    .services-hero h1 {
        font-size:3.5rem;
    }

    .services-cards {
        grid-template-columns:repeat(4,1fr);
    }


    .services-steps {
        grid-template-columns:repeat(3,1fr);
        gap:30px;
    }


    .services-step {
        display:flex;
        flex-direction:column;
        align-items:center;
    }


    .services-step:not(:last-child)::after {
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
DATEI: services.html
============================================================

<!DOCTYPE html>
<html lang="de">
<head>
    <title>Aufwind Beratung</title>

    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/header.css">
    <link rel="stylesheet" href="css/footer.css">
    <link rel="stylesheet" href="css/services-page.css">
</head>

<body>

<main>

    <section class="services-hero">

        <div class="services-hero-content">

            <h1>
                Beratung, die zu Ihrer Situation passt
            </h1>

            <p>
                Gemeinsam entwickeln wir neue Perspektiven,
                entdecken Ihre Ressourcen und finden Wege,
                die zu Ihnen und Ihrem Leben passen.
            </p>

        </div>

    </section>



    <section class="services-overview">

        <div class="services-container">

            <h2>
                Meine Beratungsangebote
            </h2>


            <div class="services-cards">


                <article class="service-card">

                    <div class="service-icon">
                        🌱
                    </div>

                    <h3>
                        Psychologische Beratung
                    </h3>

                    <p>
                        Unterstützung bei persönlichen Krisen,
                        belastenden Lebensphasen, Überforderung,
                        Stress und wichtigen Entscheidungen.
                    </p>

                </article>



                <article class="service-card">

                    <div class="service-icon">
                        🔎
                    </div>

                    <h3>
                        Systemische Beratung
                    </h3>

                    <p>
                        Gemeinsam betrachten wir Zusammenhänge,
                        Beziehungen und Ressourcen, um neue
                        Perspektiven und Lösungen zu entwickeln.
                    </p>

                </article>



                <article class="service-card">

                    <div class="service-icon">
                        🤝
                    </div>

                    <h3>
                        Familienberatung
                    </h3>

                    <p>
                        Unterstützung bei familiären Konflikten,
                        Veränderungen und Herausforderungen
                        im Zusammenleben.
                    </p>

                </article>



                <article class="service-card">

                    <div class="service-icon">
                        📚
                    </div>

                    <h3>
                        Schulische Herausforderungen
                    </h3>

                    <p>
                        Beratung für Familien bei Lernproblemen,
                        Motivation, Konflikten und schwierigen
                        Übergängen im Schulalltag.
                    </p>

                </article>


            </div>

        </div>

    </section>



    <section class="services-process">

        <div class="services-container">

            <h2>
                So läuft eine Beratung ab
            </h2>


            <div class="services-steps">

                <div class="services-step">
                    <span>1</span>
                    <h3>Kontakt aufnehmen</h3>
                    <p>
                        Sie schildern Ihr Anliegen und wir
                        vereinbaren ein erstes Gespräch.
                    </p>
                </div>

                <div class="services-step">
                    <span>2</span>
                    <h3>Erstgespräch</h3>
                    <p>
                        Gemeinsam schauen wir auf Ihre Situation
                        und mögliche nächste Schritte.
                    </p>
                </div>

                <div class="services-step">
                    <span>3</span>
                    <h3>Gemeinsam weitergehen</h3>
                    <p>
                        Wir entwickeln Lösungen, die zu Ihnen
                        und Ihrer Lebenssituation passen.
                    </p>
                </div>

            </div>
            
        </div>

    </section>



    <section class="services-suitable">

        <div class="services-container">

            <h2>
                Für wen ist die Beratung geeignet?
            </h2>


            <p>
                Die Beratung richtet sich an Menschen,
                die sich Unterstützung wünschen, neue
                Perspektiven suchen oder schwierige
                Situationen besser verstehen möchten.
            </p>


            <ul>

                <li>
                    Persönliche Krisen und Veränderungen
                </li>

                <li>
                    Überforderung und anhaltender Stress
                </li>

                <li>
                    Familien- und Beziehungskonflikte
                </li>

                <li>
                    Schulische Herausforderungen
                </li>

                <li>
                    Entscheidungen und neue Lebenswege
                </li>

            </ul>

        </div>

    </section>



    <section class="services-cta">

        <div class="services-container">

            <h2>
                Sie möchten mehr erfahren?
            </h2>


            <a href="contact.html" class="btn btn-primary">
                Kontakt aufnehmen
            </a>

        </div>

    </section>


</main>


<script src="js/header.js"></script>
<script src="js/load-components.js"></script>

</body>
</html>

