FROM node:14-alpine
#  add libraries needed to build canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    libpng \
    libpng-dev \
    jpeg-dev \
    pango-dev \
    cairo-dev \
    giflib-dev \
    ; 
RUN mkdir -p /home/node/app/node_modules && mkdir -p /home/node/app/logs
RUN npm install pm2 -g
RUN chown -R node:node /home/node/app
USER node
WORKDIR /home/node/app
COPY package*.json ./
RUN whoami
RUN ls -la
RUN npm install
COPY --chown=node:node . .
EXPOSE 3000
CMD [ "pm2-runtime","pm2-ais.json"]
