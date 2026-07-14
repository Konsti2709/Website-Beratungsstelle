from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json


PROJECT = Path(".")
PRESET_FILE = "presets.json"

IGNORE = {
    ".git",
    "node_modules",
    ".venv",
    "__pycache__"
}


EXTENSIONS = {
    "Alle": None,
    "HTML": [".html"],
    "CSS": [".css"],
    "JavaScript": [".js"],
    "Markdown": [".md"],
    "Python": [".py"]
}


files = []
checkbox_vars = {}
folder_vars = {}


# -------------------------
# Dateien finden
# -------------------------

def scan_files():

    result = []

    for path in PROJECT.rglob("*"):

        if not path.is_file():
            continue

        if any(
            part in IGNORE
            for part in path.parts
        ):
            continue

        if path.name == Path(__file__).name:
            continue

        result.append(path)

    return sorted(result)



# -------------------------
# Filter
# -------------------------

def allowed_file(path):

    search = search_var.get().lower()

    if search:
        if search not in str(path).lower():
            return False


    ext = EXTENSIONS[type_var.get()]

    if ext:
        return path.suffix in ext

    return True



# -------------------------
# Checkbox Logik
# -------------------------

def update_folder(folder):

    value = folder_vars[folder].get()

    for file in checkbox_vars:

        if str(file).startswith(str(folder)):

            checkbox_vars[file].set(value)



def update_counter():

    selected = [
        file for file,var in checkbox_vars.items()
        if var.get()
    ]

    words = 0
    chars = 0

    for file in selected:

        try:
            text = file.read_text(
                encoding="utf-8"
            )

            words += len(text.split())
            chars += len(text)

        except:
            pass


    counter.config(
        text=
        f"Ausgewählt: {len(selected)} Dateien | "
        f"Wörter: {words} | "
        f"Zeichen: {chars}"
    )



def checkbox_changed():

    update_counter()



# -------------------------
# Baum bauen
# -------------------------

def build_tree():

    for widget in tree_frame.winfo_children():
        widget.destroy()


    checkbox_vars.clear()
    folder_vars.clear()


    visible = [
        f for f in files
        if allowed_file(f)
    ]


    folders = {}


    for file in visible:

        parts = file.parts

        current = Path(".")

        for part in parts[:-1]:

            current /= part

            folders.setdefault(
                current,
                []
            )

            folders[current].append(file)



    for folder in sorted(folders):

        var = tk.BooleanVar()

        folder_vars[folder] = var


        cb = tk.Checkbutton(
            tree_frame,
            text="📁 " + folder.name,
            variable=var,
            command=lambda f=folder:update_folder(f)
        )

        cb.pack(
            anchor="w",
            padx=len(folder.parts)*10
        )


        for file in folders[folder]:

            if file.parent == folder:

                add_file_checkbox(
                    file,
                    len(folder.parts)
                )



    for file in visible:

        if file.parent == Path("."):

            add_file_checkbox(
                file,
                0
            )


def add_file_checkbox(file, indent):

    var=tk.BooleanVar()

    checkbox_vars[file]=var


    cb=tk.Checkbutton(
        tree_frame,
        text="📄 " + file.name,
        variable=var,
        command=update_counter
    )

    cb.pack(
        anchor="w",
        padx=(indent+1)*20
    )



# -------------------------
# Auswahl
# -------------------------

def select_all():

    for var in checkbox_vars.values():
        var.set(True)

    update_counter()



def deselect_all():

    for var in checkbox_vars.values():
        var.set(False)

    update_counter()



# -------------------------
# Export
# -------------------------

def export_md():

    selected=[
        f for f,var in checkbox_vars.items()
        if var.get()
    ]


    if not selected:
        messagebox.showwarning(
            "Fehlt",
            "Keine Dateien ausgewählt"
        )
        return


    path=filedialog.asksaveasfilename(
        defaultextension=".md",
        filetypes=[
            ("Markdown","*.md")
        ]
    )


    if not path:
        return


    with open(
        path,
        "w",
        encoding="utf-8"
    ) as out:


        for file in selected:

            text=file.read_text(
                encoding="utf-8"
            )


            out.write(
                "\n"
                + "="*60
                + f"\nDATEI: {file}\n"
                + "="*60
                + "\n\n"
            )

            out.write(text)
            out.write("\n\n")


    messagebox.showinfo(
        "Fertig",
        "Markdown Datei erstellt"
    )



# -------------------------
# Presets
# -------------------------

def save_preset():

    name = preset_name.get().strip()

    if not name:
        messagebox.showwarning(
            "Fehler",
            "Bitte einen Namen eingeben."
        )
        return


    try:
        with open(PRESET_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

    except:
        data = {}


    data[name] = [
        str(file)
        for file,var in checkbox_vars.items()
        if var.get()
    ]


    with open(
        PRESET_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            data,
            f,
            indent=4,
            ensure_ascii=False
        )


    load_preset_names()


    preset_box.set(name)


    messagebox.showinfo(
        "Gespeichert",
        f"Preset '{name}' gespeichert."
    )



def load_preset():

    name = preset_box.get()

    if not name:
        return


    try:
        with open(
            PRESET_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

    except:
        return


    if name not in data:
        messagebox.showwarning(
            "Fehler",
            "Preset nicht gefunden."
        )
        return


    saved_files = data[name]


    for file,var in checkbox_vars.items():

        var.set(
            str(file) in saved_files
        )


    update_counter()


def load_preset():

    name = preset_box.get()

    if not name:
        return


    try:
        with open(
            PRESET_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

    except:
        return


    if name not in data:
        messagebox.showwarning(
            "Fehler",
            "Preset nicht gefunden."
        )
        return


    saved_files = data[name]


    for file,var in checkbox_vars.items():

        var.set(
            str(file) in saved_files
        )


    update_counter()


def load_preset_names():

    try:
        with open(
            PRESET_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

    except:
        data = {}


    preset_box["values"] = list(
        data.keys()
    )


# -------------------------
# GUI
# -------------------------

root=tk.Tk()

root.title(
    "Markdown Projekt Exporter"
)

root.geometry(
    "900x800"
)



search_var=tk.StringVar()

tk.Entry(
    root,
    textvariable=search_var
).pack(
    fill="x",
    padx=10,
    pady=5
)


search_var.trace(
    "w",
    lambda *x:build_tree()
)



type_var=tk.StringVar(
    value="Alle"
)


ttk.Combobox(
    root,
    textvariable=type_var,
    values=list(EXTENSIONS.keys())
).pack()


type_var.trace(
    "w",
    lambda *x:build_tree()
)



canvas=tk.Canvas(root)

scroll=tk.Scrollbar(
    root,
    command=canvas.yview
)

tree_frame=tk.Frame(canvas)


canvas.create_window(
    (0,0),
    window=tree_frame,
    anchor="nw"
)


tree_frame.bind(
    "<Configure>",
    lambda e:
    canvas.configure(
        scrollregion=canvas.bbox("all")
    )
)


canvas.configure(
    yscrollcommand=scroll.set
)


canvas.pack(
    side="left",
    fill="both",
    expand=True
)

scroll.pack(
    side="right",
    fill="y"
)



buttons=tk.Frame(root)

buttons.pack()



tk.Button(
    buttons,
    text="Alle auswählen",
    command=select_all
).grid(
    row=0,
    column=0
)


tk.Button(
    buttons,
    text="Alles abwählen",
    command=deselect_all
).grid(
    row=0,
    column=1
)


tk.Button(
    buttons,
    text="Export",
    command=export_md
).grid(
    row=0,
    column=2
)



counter=tk.Label(
    root,
    text=""
)

counter.pack()



preset_name=tk.Entry(root)

preset_name.pack()


tk.Button(
    root,
    text="Preset speichern",
    command=save_preset
).pack()



preset_box=ttk.Combobox(root)

preset_box.pack()


tk.Button(
    root,
    text="Preset laden",
    command=load_preset
).pack()



files=scan_files()

build_tree()

load_preset_names()

root.mainloop()