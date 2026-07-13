from pathlib import Path

project = Path(".")

files = [
    "index.html",
    "contact.html"
    "faq.html",
    "about.html",
    "services.html",

    "components/header.html",
    "components/footer.html",
    
    "css/about.css",
    "css/about-page.css",
    "css/faq.css",
    "css/faq-page.css",
    "css/footer.css",
    "css/global.css",
    "css/header.css",
    "css/hero.css",
    "css/process.css",
    "css/services.css",
    "css/services-page.css",

    "js/header.js",
    "js/faq.js",
    "js/load-components.js"
]

output = "website_all_files.txt"

with open(output, "w", encoding="utf-8") as f:
    for file in files:
        path = project / file

        if path.exists():
            f.write("\n")
            f.write("=" * 60)
            f.write(f"\nDATEI: {file}\n")
            f.write("=" * 60)
            f.write("\n\n")

            f.write(path.read_text(encoding="utf-8"))

            f.write("\n\n")

print("Fertig:", output)