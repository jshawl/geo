.PHONY: build build-dev worker test

build:
	docker build --tag app .

test:
	docker compose run --rm test

worker:
	docker compose run --rm worker
