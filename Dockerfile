# syntax=docker/dockerfile:1
FROM node:19-alpine3.15 as build
WORKDIR /app
ARG WEB_BRANCH=
RUN set -eux; \
    apk update && apk add git && \
    git clone -b ${WEB_BRANCH:-devel} https://github.com/rnascunha/agro_web && \
    cd agro_web && \
    npm install && \
    npm update && \
    npm run build
CMD [ "/bin/ash" ]

FROM httpd:2.4.54-alpine
COPY --from=build /app/agro_web/dist/* /usr/local/apache2/htdocs/