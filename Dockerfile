FROM ubuntu:18.04
LABEL Warus Firebyte

ENV NODE_ENV=production

RUN \
  apt-get update -y && \
  apt-get install -y curl software-properties-common && \
  curl -sL https://deb.nodesource.com/setup_current.x | bash - && \
  apt-get install -y nodejs python build-essential && \
  npm install -g nodemon

RUN apt-get install -y ffmpeg

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .

CMD [ "nodemon", "server.mjs" ]

#docker tag node-docker:latest node-docker:v0.0.1