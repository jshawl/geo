.PHONY: build build-dev fetcher fetcher-dev test

build:
	docker build --tag app .

test:
	docker compose --file docker-compose.dev.yml run --rm test nimble test

worker:
	docker compose run --rm worker

worker-dev:
	docker compose --file docker-compose.dev.yml run --rm worker
