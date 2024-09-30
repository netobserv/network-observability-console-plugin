#!/usr/bin/env bash

echo "Updating container file"

: "${CONTAINER_FILE:=./Dockerfile}"
: "${COMMIT:=$(git rev-list --abbrev-commit --tags --max-count=1)}"

cat <<EOF >>"${CONTAINER_FILE}"
LABEL com.redhat.component="network-observability-console-plugin-container"
LABEL name="network-observability-console-plugin"
LABEL io.k8s.display-name="Network Observability Console Plugin"
LABEL io.k8s.description="Network Observability Console Plugin"
LABEL summary="Network Observability Console Plugin"
LABEL maintainer="support@redhat.com"
LABEL io.openshift.tags="network-observability-console-plugin"
LABEL upstream-vcs-ref="${COMMIT}"
LABEL upstream-vcs-type="git"
LABEL description="Based on Openshift Console dynamic plugin, this plugin implement the console elements for Network Observability."
EOF

sed -i 's/\(FROM.*\)docker.io\/library\/golang:1.22\(.*\)/\1brew.registry.redhat.io\/rh-osbs\/openshift-golang-builder:v1.22.5-202407301806.g4c8b32d.el9\2/g' ./Dockerfile
sed -i 's/\(FROM.*\)docker.io\/library\/node:18-alpine\(.*\)/\1registry.access.redhat.com\/ubi9\/nodejs-18:1-108.1716477799\2/g' ./Dockerfile

sed -i 's/USER node//g' ./Dockerfile
sed -i 's/--chown=node/--chown=default/g' ./Dockerfile
