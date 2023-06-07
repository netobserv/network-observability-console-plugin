# We do not use --platform feature to auto fill this ARG because of incompatibility between podman and docker
ARG BUILDSCRIPT=
ARG TARGETPLATFORM=linux/amd64
ARG BUILDPLATFORM=linux/amd64
FROM --platform=$BUILDPLATFORM docker.io/library/node:16-alpine as web-builder
USER node

ARG BUILDSCRIPT
ARG TARGETPLATFORM
ARG TARGETARCH=amd64
WORKDIR /opt/app-root

COPY --chown=node Makefile Makefile
COPY --chown=node web/package.json web/package.json
COPY --chown=node web/package-lock.json web/package-lock.json
RUN cd web && npm ci

COPY --chown=node web web
COPY mocks mocks
RUN cd web && npm run format-all
RUN cd web && npm run build$BUILDSCRIPT

FROM --platform=$BUILDPLATFORM docker.io/library/golang:1.19 as go-builder

ARG TARGETPLATFORM
ARG TARGETARCH=amd64
WORKDIR /opt/app-root

COPY .git .git
COPY go.mod go.mod
COPY go.sum go.sum
COPY vendor/ vendor/
COPY Makefile Makefile
COPY .mk/ .mk/
COPY cmd/ cmd/
COPY pkg/ pkg/

RUN CGO_ENABLED=0 GOARCH=$TARGETARCH make build-backend

FROM  --platform=$TARGETPLATFORM registry.access.redhat.com/ubi9/ubi-minimal:9.2

COPY --from=web-builder /opt/app-root/web/dist ./web/dist
COPY --from=go-builder /opt/app-root/plugin-backend ./

ENTRYPOINT ["./plugin-backend"]
