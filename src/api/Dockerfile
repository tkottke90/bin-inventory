FROM node:12.18 AS build_stage

WORKDIR /usr/build/

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:12.18-alpine

WORKDIR /usr/app/

COPY --from=build_stage /usr/build/dist /usr/app/dist
COPY --from=build_stage /usr/build/package*.json /usr/app/

RUN ls -halt

RUN npm install --production

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "dist/"]

EXPOSE 4000