FROM registry.access.redhat.com/ubi8/nodejs-16:1-72 as web-builder

WORKDIR /opt/app-root

COPY --chown=default Makefile Makefile
COPY --chown=default web/package.json web/package.json
COPY --chown=default web/package-lock.json web/package-lock.json
RUN NPM_INSTALL=ci make install-frontend

COPY --chown=default web web
COPY mocks mocks
RUN make fmt-frontend just-build-frontend

FROM registry.access.redhat.com/ubi8/go-toolset:1.18 as go-builder

WORKDIR /opt/app-root

COPY .git .git
COPY go.mod go.mod
COPY go.sum go.sum
COPY vendor/ vendor/
COPY Makefile Makefile
COPY cmd/ cmd/
COPY pkg/ pkg/

RUN make build-backend

FROM registry.access.redhat.com/ubi8/ubi-minimal:8.6

COPY --from=web-builder /opt/app-root/web/dist ./web/dist
COPY --from=go-builder /opt/app-root/plugin-backend ./

ENTRYPOINT ["./plugin-backend"]
