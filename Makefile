.PHONY: build serve tailwind

PORT ?= 4000

build:
	node _scripts/bib_to_json.js
	bundle exec jekyll build

tailwind:
	npx @tailwindcss/cli -i assets/css/tailwind.css -o assets/css/custom.css --watch

serve: build
	bundle exec jekyll serve \
		--host 0.0.0.0 \
		--port $(PORT) \
		--livereload \
