FROM node:10.15.3-slim AS node

#
# Stage: NPM install
#
FROM node AS npm

WORKDIR /app

COPY package.json \
    package-lock.json \
    ./

RUN npm install



#
# Stage: Compile assets using Gulp
#
FROM node AS gulp

WORKDIR /app

RUN apt-get update && apt-get install --yes --no-install-recommends \
        python3-pip \
    && pip3 --no-cache-dir install \
        brotli \
        fonttools \
    && rm -rf /var/lib/apt/lists/*
COPY .babelrc \
    .browserslistrc \
    .eslintrc.js \
    .stylelintrc \
    gulpfile.babel.js \
    jest.config.js \
    webpack.config.babel.js \
    ./
COPY --from=npm /app/node_modules/ node_modules/
COPY test/ test/
COPY source/ source/

RUN npx gulp build



#
# Stage: Composer install
#
FROM composer:1.7.3 AS composer

COPY core/ core/
COPY config/ config/
COPY composer.json \
    composer.lock \
    ./

RUN composer --no-interaction install --ignore-platform-reqs --classmap-authoritative --no-suggest --prefer-dist



#
# Stage: Generate pattern library
#
FROM php:7.2.12-cli-alpine AS build

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS && \
    pecl install inotify && \
    docker-php-ext-enable inotify && \
    rm -rf /tmp/pear/ && \
    apk del .build-deps

WORKDIR /app

COPY core/ core/
COPY config/ config/
COPY --from=composer /app/vendor/ vendor/
COPY --from=gulp /app/build/source/ build/source/

RUN core/console --generate



#
# Stage: Serve pattern library
#
FROM nginx:1.15.7-alpine AS ui

COPY --from=build /app/build/public/ /usr/share/nginx/html/
HEALTHCHECK --interval=5s CMD nc -z localhost 80
ARG revision
LABEL org.opencontainers.image.revision=${revision}
