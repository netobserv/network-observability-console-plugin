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
EOF
