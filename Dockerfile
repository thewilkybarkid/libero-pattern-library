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

COPY .stylelintignore \
    .stylelintrc \
    gulpfile.js \
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
    composer --no-interaction install --ignore-platform-reqs --classmap-authoritative --no-suggest --prefer-dist



#
# Stage: Generate pattern library
#
FROM php:7.2.12-cli-alpine AS build

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
