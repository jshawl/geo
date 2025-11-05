.PHONY: build build-dev fetcher fetcher-dev test 

# Development
fetcher-dev:
	docker run --rm --interactive --tty \
		--volume $(PWD):/app \
		--env-file .env \
		app:dev nimble run fetcher

build-dev:
	docker build --tag app:dev --target builder . 

test:
	docker run --rm \
		--volume $(PWD):/app \
		app:dev nimble test

# Production
build:
	docker build --tag app .

fetcher:
	docker run --rm --interactive --tty \
		--volume $(PWD)/db:/app/db \
		--env-file .env \
		app /app/fetcher
