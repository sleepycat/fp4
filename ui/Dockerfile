FROM denoland/deno:latest AS buildenv
WORKDIR /app
COPY --chown=deno:deno . .
RUN deno task build

FROM alpine:latest

RUN apk add --no-cache \
	ca-certificates \
	libcap \
	mailcap \
  caddy

# Create a group and a user without a password
RUN addgroup -g 1000 nonroot && \
    adduser -u 1000 -S -G nonroot -D nonroot --disabled-password --gecos ""

WORKDIR /home/nonroot
# And now the app:
COPY --from=buildenv --chown=nonroot:nonroot /app/dist ./dist
COPY --from=buildenv --chown=nonroot:nonroot /app/Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000
# Run as a non-root user
USER nonroot
ENTRYPOINT ["caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile"]
