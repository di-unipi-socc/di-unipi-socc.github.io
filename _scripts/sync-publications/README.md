# Synchronise publications

Requires Python 3.11+, uv, Node/npm and a graphical desktop.

From the repository root, run both the DBLP sync and JSON generation with:

```sh
make publications
```

From this directory:

```sh
uv sync
uv run playwright install chromium
uv run main.py
cd ../..
npm run publications
```

Edit `members.json` to choose authors and their DBLP PIDs. The script opens
Chromium and waits up to two minutes for DBLP verification. Complete any
interactive verification in that window. The browser profile is stored locally
in `.browser-profile/` (ignored by Git); do not share it.

Once verification finishes, the script downloads each author's BibTeX, waiting
two seconds between requests, into a temporary directory managed by Python's
`tempfile.TemporaryDirectory`. Individual files are automatically removed on exit,
including on errors. The merged file is saved as `bibliography.bib` directly in
this directory. The final npm
command updates `assets/publications.json` for the website.

If DBLP still blocks a download, the script stops before merging and preserves
the existing `bibliography.bib`.
Browser automation does not guarantee that DBLP will accept a request.

The script also installs `bibtex-tidy` globally using npm.
