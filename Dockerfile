FROM node:8.12.0-slim
WORKDIR /patterns-core

COPY package.json package-lock.json ./
RUN npm install

COPY . ./
RUN node_modules/.bin/gulp build
