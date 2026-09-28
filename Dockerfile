# --- Build stage -------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Browsers are only needed for local e2e runs, never in the image.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Node 22 still bundles npm 10, whose `npm ci` validator rejects this lockfile
# even though it is consistent (npm 11 installs it exactly, matching the lock).
# Pin the npm line to the version that authors/maintains the lock so installs
# stay reproducible and `npm ci` can remain fail-fast.
ARG NPM_VERSION=11.6.2
RUN npm install -g npm@${NPM_VERSION} && npm --version

# Install dependencies first so this layer stays cached across source edits.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Production build (angular.json -> @angular-devkit/build-angular:application).
COPY . .
RUN npm run build

# --- Runtime stage -----------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# The application builder emits the browser bundle under dist/prisma-front/browser.
COPY --from=build /app/dist/prisma-front/browser /usr/share/nginx/html

# Drop the stock welcome-page site. The HTTP config is rendered through the
# official nginx entrypoint template mechanism. Restrict envsubst to DOMAIN so
# nginx runtime variables ($uri, $host, $scheme, ...) are never substituted.
ENV NGINX_ENVSUBST_FILTER=^DOMAIN$
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
