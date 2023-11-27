FROM node:21-alpine3.17 AS build
WORKDIR /src
COPY ./package.json ./package-lock.json ./
RUN npm i
COPY ./ ./
RUN npm run bundle

FROM node:21-alpine3.17 AS production
WORKDIR /production
COPY --from=build ./src/bundle/index.js ./index.js
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT [ "node", "./index.js" ]
