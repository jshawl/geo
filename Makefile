.PHONY: dev test
IMAGE=nimlang/nim:2.2.6-alpine-slim

dev-fetcher:
	@docker run --rm -it \
		-v $(PWD):/app \
		-w /app \
		--env-file .env \
		$(IMAGE) \
		nim r -d:ssl --hints:off src/fetcher.nim

test:
	docker build -f Dockerfile.dev -t main:dev .
	docker run --rm main:dev nim r --hints:off tests/test_all.nim

build:
	docker build -t main .

fetcher:
	docker run --rm -it --env-file=.env -v $(PWD)/db:/app/db main /app/fetcher