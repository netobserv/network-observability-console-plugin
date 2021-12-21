FROM registry.access.redhat.com/ubi8/nodejs-14:1-51 as web-builder

WORKDIR /opt/app-root

RUN npm install npm@8.2.0 -g
RUN mkdir web && chown $USER: web
COPY web/package.json web/
COPY web/package-lock.json web/
COPY Makefile Makefile
RUN make install-frontend
COPY web web

RUN make build-frontend

FROM registry.access.redhat.com/ubi8/go-toolset:1.16.7-5 as go-builder
ARG VERSION=""

WORKDIR /opt/app-root
COPY go.mod go.mod
COPY go.sum go.sum
COPY vendor/ vendor/
COPY Makefile Makefile
COPY cmd/ cmd/
COPY pkg/ pkg/

RUN make build-backend

FROM registry.access.redhat.com/ubi8/ubi-minimal:8.5-204

COPY --from=web-builder /opt/app-root/web/dist ./web/dist
COPY --from=go-builder /opt/app-root/plugin-backend ./

ENTRYPOINT ["./plugin-backend"]
