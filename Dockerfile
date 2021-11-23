FROM registry.access.redhat.com/ubi8/nodejs-14:1-51

WORKDIR /opt/app-root/src

COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN npm run build

ENTRYPOINT ["./http-server.sh"]
