ARG TARGETARCH
FROM docker.io/library/node:18-alpine as web-builder

USER node

ARG BUILDSCRIPT
WORKDIR /opt/app-root

COPY --chown=node web/package.json web/package.json
COPY --chown=node web/package-lock.json web/package-lock.json
WORKDIR /opt/app-root/web
RUN CYPRESS_INSTALL_BINARY=0 npm --legacy-peer-deps ci

WORKDIR /opt/app-root
COPY --chown=node web web
COPY mocks mocks

WORKDIR /opt/app-root/web
RUN npm run format-all
RUN npm run build$BUILDSCRIPT

FROM docker.io/library/golang:1.22 as go-builder

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

FROM --platform=linux/$TARGETARCH registry.access.redhat.com/ubi9/ubi-minimal:9.4

COPY --from=web-builder /opt/app-root/web/dist ./web/dist
COPY --from=go-builder /opt/app-root/plugin-backend ./

ENTRYPOINT ["./plugin-backend"]
