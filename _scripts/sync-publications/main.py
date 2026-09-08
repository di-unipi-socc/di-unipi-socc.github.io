#### MANUALLY CHANGE academic.templates.publication.md file, removing the default body
import json
import subprocess
import sys
from pathlib import Path
from time import sleep

import requests

DBLP_URL = "https://dblp.org/pid/{pid}.bib"

BIB_DIR = Path(__file__).parent / "bibs"


def download_bib(user: dict[str, object], folder: str | Path = BIB_DIR):

    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)

    r = requests.get(DBLP_URL.format(pid=user["pid"]))

    if r.status_code == 200:
        print(f"Downloaded bib file for {user['name']}")
        bib = r.text
        bibpath = folder / f"{user['name']}.bib"
        with open(bibpath, "w") as f:
            f.write(bib)
    else:
        print(f"Error: {r.status_code}")
        sys.exit(-1)


def concat_bib_files(bib_files, folder: str | Path = BIB_DIR):

    output_file = Path(folder) / "bibliography.bib"
    with output_file.open("w", encoding="utf-8") as tmp:

        for bib_file in bib_files:
            bib_file = Path(bib_file)

            with bib_file.open("r", encoding="utf-8") as f:
                content = f.read().strip()

            if content:
                tmp.write(content)
                tmp.write("\n\n")

    return output_file


def main():
    # Install bibtex-tidy (if not already installed)
    subprocess.call(["npm", "install", "-g", "bibtex-tidy"])

    # Read the users from the json file 'members.json'
    with open("members.json", "r") as f:
        users = json.load(f)

    # UNCOMMENT TO DOWNLOAD BIB FILES FROM DBLP
    # for u in users:
    #     download_bib(u)
    #     sleep(2)  # Wait 2 seconds to avoid being blocked by DBLP

    # List of bib filepaths
    bibfiles = [BIB_DIR / f"{u['name']}.bib" for u in users]
    all_bib = concat_bib_files(bibfiles, folder=BIB_DIR)
    # Tidy the bib files

    subprocess.call(
        [
            "bibtex-tidy",
            "--modify",
            "--omit=url,timestamp,biburl,bibsource,note,source,publication_stage,type",
            "--curly",
            "--numeric",
            "--align=13",
            "--enclosing-braces=title",
            "--sort=-year,title",
            "--duplicates=key,doi,citation,abstract",
            "--merge=last",
            "--no-escape",
            "--strip-comments",
            "--no-remove-dupe-fields",
            "--generate-keys",
            all_bib,
        ]
    )


if __name__ == "__main__":
    main()
