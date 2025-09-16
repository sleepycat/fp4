FROM alpine

RUN apk add --update nodejs npm
WORKDIR /app/ui
COPY --chown=nonroot:nonroot . .
RUN npm install --ci
CMD ["npm", "run", "dev"]

