FROM node:12.18 AS build_stage

WORKDIR /usr/build/

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:12.13

WORKDIR /usr/app/

COPY --from=build_stage /usr/build/dist /usr/app/dist
COPY --from=build_stage /usr/build/package*.json /usr/app/

COPY ./server .

RUN npm install --production

CMD [ "node", "server/index.js"]

ENV PORT 3000
ENV NODE_ENV production

EXPOSE 3000