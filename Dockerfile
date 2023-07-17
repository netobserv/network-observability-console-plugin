# We do not use --platform feature to auto fill this ARG because of incompatibility between podman and docker
ARG BUILDSCRIPT=
ARG LDFLAGS=
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
WORKDIR /opt/app-root/web
RUN npm ci

WORKDIR /opt/app-root
COPY --chown=node web web
COPY mocks mocks

WORKDIR /opt/app-root/web
RUN npm run format-all
RUN npm run build$BUILDSCRIPT

FROM --platform=$BUILDPLATFORM docker.io/library/golang:1.20 as go-builder

ARG TARGETPLATFORM
ARG TARGETARCH=amd64
ARG LDFLAGS
WORKDIR /opt/app-root

COPY go.mod go.mod
COPY go.sum go.sum
COPY vendor/ vendor/
COPY .mk/ .mk/
COPY cmd/ cmd/
COPY pkg/ pkg/

RUN CGO_ENABLED=0 GOARCH=$TARGETARCH go build -ldflags "$LDFLAGS" -mod vendor -o plugin-backend cmd/plugin-backend.go

FROM  --platform=$TARGETPLATFORM registry.access.redhat.com/ubi9/ubi-minimal:9.2

COPY --from=web-builder /opt/app-root/web/dist ./web/dist
COPY --from=go-builder /opt/app-root/plugin-backend ./

ENTRYPOINT ["./plugin-backend"]
