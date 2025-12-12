FROM denoland/deno:latest AS builder
WORKDIR /app
COPY --chown=deno:deno . .
RUN deno compile -A --include=./schema.graphql --output api main.ts

# https://github.com/GoogleContainerTools/distroless
FROM gcr.io/distroless/cc
WORKDIR /home/nonroot
# And now the app:
COPY --from=builder --chown=nonroot:nobody /app/api .
COPY --from=builder --chown=nonroot:nobody /app/schema.graphql .
COPY --from=builder --chown=nonroot:nobody /app/data/seizures.db data/seizures.db

# Run as a non-root user
USER nonroot
CMD ["./api"]
