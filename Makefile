SHELL := /bin/sh

ENV_DEV := .env.dev
ENV_TEST := .env.test

COMPOSE_DEV := docker compose --env-file $(ENV_DEV) -f docker-compose.yaml
COMPOSE_TEST := docker compose --env-file $(ENV_TEST) -f docker-compose.test.yaml

TARGET_ARGS := $(filter-out --,$(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS)))

TEST_LOG ?= /tmp/checkout-test-docker.log

.PHONY: up down test seed migrate-create migrate-dev migrate-deploy

up:
	@set -eu; \
	$(COMPOSE_DEV) up -d --wait $(if $(TARGET_ARGS),$(TARGET_ARGS),postgres db-migrations api web)

down:
	@set -eu; \
	$(COMPOSE_DEV) down $(TARGET_ARGS)

seed:
	@set -eu; \
	$(COMPOSE_DEV) up -d --wait postgres db-migrations; \
	$(COMPOSE_DEV) build api; \
	$(COMPOSE_DEV) run --rm api pnpm run seed

test:
	@set -e; \
	cleanup() { $(COMPOSE_TEST) down >> $(TEST_LOG) 2>&1; }; \
	trap cleanup EXIT; \
	$(COMPOSE_TEST) build --quiet db-migrations tests web-tests >> $(TEST_LOG) 2>&1; \
	$(COMPOSE_TEST) up -d --wait db-migrations >> $(TEST_LOG) 2>&1; \
	$(COMPOSE_TEST) --progress=quiet run --rm tests; \
	$(COMPOSE_TEST) --progress=quiet run --rm web-tests

migrate-create:
	@set -e; \
	cleanup() { $(COMPOSE_TEST) down; }; \
	trap cleanup EXIT; \
	$(COMPOSE_TEST) up -d --wait postgres; \
	$(COMPOSE_TEST) build db-migrations; \
	$(COMPOSE_TEST) run --rm db-migrations pnpm exec prisma migrate dev --create-only $(TARGET_ARGS)

migrate-dev:
	@set -e; \
	cleanup() { $(COMPOSE_TEST) down; }; \
	trap cleanup EXIT; \
	$(COMPOSE_TEST) up -d --wait postgres; \
	$(COMPOSE_TEST) build db-migrations; \
	$(COMPOSE_TEST) run --rm db-migrations pnpm exec prisma migrate dev

migrate-deploy:
	@set -e; \
	cleanup() { $(COMPOSE_TEST) down; }; \
	trap cleanup EXIT; \
	$(COMPOSE_TEST) up -d --wait postgres; \
	$(COMPOSE_TEST) build db-migrations; \
	$(COMPOSE_TEST) run --rm db-migrations pnpm exec prisma migrate deploy