#!/usr/bin/env bash

set -eux

echo "Starting backend..."
./plugin-backend --loglevel info --config ./config/config.yaml &
backend=$!

echo "Running tests..."
cd web
npm run cypress:run
cypress=$?

kill $backend
wait $backend

exit $cypress
