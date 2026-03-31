FROM postgres:16-alpine

# Install build deps for any extensions
RUN apk add --no-cache bash

# Copy init scripts – executed in alphabetical order on first run
COPY init/ /docker-entrypoint-initdb.d/

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}

EXPOSE 5432
