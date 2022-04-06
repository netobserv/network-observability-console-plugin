FROM registry.access.redhat.com/ubi8/nodejs-14:1-63 as web-builder

WORKDIR /opt/app-root

RUN npm install npm@8.2.0 -g
RUN mkdir web && chown $USER: web
COPY Makefile Makefile
COPY web web

RUN NPM_INSTALL=ci make build-frontend

FROM registry.access.redhat.com/ubi8/go-toolset:1.16.7-5 as go-builder

WORKDIR /tmp

# TEMPORARY STEPS UNTIL ubi8 releases a go1.17 image
RUN wget -q https://go.dev/dl/go1.17.7.linux-amd64.tar.gz && tar -xzf go1.17.7.linux-amd64.tar.gz
ENV GOROOT /tmp/go
ENV PATH $GOROOT/bin:$PATH
# END OF LINES TO REMOVE

WORKDIR /opt/app-root

COPY .git .git
COPY go.mod go.mod
COPY go.sum go.sum
COPY vendor/ vendor/
COPY Makefile Makefile
COPY cmd/ cmd/
COPY pkg/ pkg/

RUN make build-backend

FROM registry.access.redhat.com/ubi8/ubi-minimal:8.5-240

COPY --from=web-builder /opt/app-root/web/dist ./web/dist
COPY --from=go-builder /opt/app-root/plugin-backend ./

ENTRYPOINT ["./plugin-backend"]
