#### MANUALLY CHANGE academic.templates.publication.md file, removing the default body
import json
import re
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
from time import sleep

from playwright.sync_api import BrowserContext, sync_playwright

DBLP_URL = "https://dblp.org/pid/{pid}.bib"

SCRIPT_DIR = Path(__file__).parent


def download_bib(user: dict[str, object], context: BrowserContext, folder: str | Path):

    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)

    response = context.request.get(DBLP_URL.format(pid=user["pid"]), timeout=30_000)
    try:
        bib = response.text()
        if response.status != 200 or not re.match(r"\s*@\w+\s*[{(]", bib):
            raise RuntimeError(
                f"DBLP did not return BibTeX for {user['name']} (HTTP {response.status}). "
                "Complete the browser verification and rerun."
            )
        bibpath = folder / f"{user['name']}.bib"
        bibpath.write_text(bib, encoding="utf-8")
        print(f"Downloaded bib file for {user['name']}")
    finally:
        response.dispose()


def concat_bib_files(bib_files, folder: str | Path = SCRIPT_DIR):

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
    with (Path(__file__).parent / "members.json").open() as f:
        users = json.load(f)

    with TemporaryDirectory(
        prefix="socc-publications-"
    ) as tempdir, sync_playwright() as playwright:
        context = playwright.chromium.launch_persistent_context(
            str(Path(__file__).parent / ".browser-profile"), headless=False
        )
        try:
            page = context.new_page()
            page.goto("https://dblp.org/", wait_until="domcontentloaded")
            print(
                "Waiting for DBLP. Complete any verification in the browser (up to 2 minutes)."
            )
            page.wait_for_function(
                "document.title.toLowerCase().startsWith('dblp:')", timeout=120_000
            )
            for u in users:
                download_bib(u, context, tempdir)
                sleep(2)  # Wait 2 seconds to avoid being blocked by DBLP
        finally:
            context.close()

        bibfiles = [Path(tempdir) / f"{u['name']}.bib" for u in users]
        all_bib = concat_bib_files(bibfiles)
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
