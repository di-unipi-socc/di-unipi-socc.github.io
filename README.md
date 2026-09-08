# SOCC Research Group website

Jekyll website for the Service-Oriented, Cloud and Fog Computing Research Group at the University of Pisa.

## Local build

```sh
node _scripts/bib_to_json.js
bundle exec jekyll serve
```

Publications are sourced from `_scripts/sync-publications/bibs/bibliography.bib`; the build creates `assets/publications.json` automatically.
