FROM node:10.12.0-slim AS node

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

COPY .babelrc \
    .stylelintrc \
    gulpfile.babel.js \
    ./
COPY libero-config/ libero-config/
COPY --from=npm /app/node_modules/ node_modules/
COPY test/ test/
COPY source/ source/

RUN npx gulp assemble



#
# Stage: Composer install
#
FROM composer:1.7.3 as composer

COPY core/ core/
COPY config/ config/
COPY composer.json \
    composer.lock \
    ./

RUN mkdir public source && \
    composer --no-interaction install --ignore-platform-reqs --classmap-authoritative --no-autoloader --no-suggest --prefer-dist

COPY source/php/ source/php/

RUN composer --no-interaction dump-autoload --classmap-authoritative


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
COPY --from=composer /app/public/ public/
COPY --from=composer /app/vendor/ vendor/
COPY --from=gulp /app/source/ source/

RUN core/console --generate



#
# Stage: Serve pattern library
#
FROM nginx:1.15.7-alpine AS ui

COPY --from=build /app/public/ /usr/share/nginx/html/
HEALTHCHECK --interval=5s CMD nc -z localhost 80
