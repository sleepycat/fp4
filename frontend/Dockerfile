FROM alpine

RUN apk add --update nodejs npm
COPY . .
RUN npm install --ci
CMD ["npm", "run", "dev"]

