.PHONY: build dev test fetcher
IMAGE=nimlang/nim:2.2.6-alpine-slim

dev-fetcher:
	@docker run --rm -it \
		-v $(PWD):/app \
		--env-file .env \
		app:dev \
		nim r -d:ssl --hints:off src/fetcher.nim

test:
	docker run --rm -v $(PWD):/app app:dev nim r -d:ssl --hints:off tests/test_all.nim

build-dev:
	docker build -f Dockerfile.dev -t app:dev .

build:
	docker build -t app .

fetcher:
	docker run --rm -it --env-file=.env -v $(PWD)/db:/app/db app /app/fetcher