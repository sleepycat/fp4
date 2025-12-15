FROM denoland/deno:latest AS deno
WORKDIR /app
COPY --chown=deno:deno . .
RUN deno task build

FROM alpine

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
COPY --from=deno --chown=nonroot:nonroot /app/dist .

EXPOSE 3000
# Run as a non-root user
USER nonroot
CMD ["caddy", "file-server", "--listen", ":3000",  "--root", "/home/nonroot/"]

