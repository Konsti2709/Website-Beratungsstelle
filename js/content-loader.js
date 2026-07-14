async function loadContent() {

    try {

        const page = document.body.dataset.page;

        const sheets = {

            index: "1sPaDWJYZ6_7JlKYdlbT7SOMAk-0v9VXGdYz_GXch3eM",
            about: "1Cq4gFvYquYbyCl-4k1w57_kcdlU1brnu2VH0ycig-p4",
            contact: "1sR_GcKTrGrD35taUbTsC1y4kX84v9n7Sb0GdvB4ch68",
            faq: "1T4w2k_bK5prNJadxsWkR8cbnA2aNNwMLvDA2n9WeU14",
            services: "1Gkkq7kKnleeYDUPWWSmZwZ21KNCEIFMziOCdJFRCUvI"

        };


        const sheetId = sheets[page];


        if (!sheetId) {
            console.error("Kein Sheet für Seite gefunden:", page);
            return;
        }


        const response = await fetch(
            `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
        );


        const csv = await response.text();


        const rows = csv.split("\n").map(row => {

            return row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
            ?.map(cell => cell.replace(/^"|"$/g, ""));

        });


        const content = {};


        rows.slice(1).forEach(row => {

            if (!row) return;


            const page = row[0];
            const section = row[1];
            const field = row[2];
            const text = row[3];


            if (!page || !section || !field) {
                return;
            }


            const key = `${page}_${section}_${field}`;


            content[key] = text;

        });



        document.querySelectorAll("[data-text]").forEach(element => {


            const key = element.dataset.text;


            if (content[key]) {

                element.textContent = content[key];

            }


        });


    } catch(error) {

        console.error(
            "Fehler beim Laden der Inhalte:",
            error
        );

    }

}


loadContent();