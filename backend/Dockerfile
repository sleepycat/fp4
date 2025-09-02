FROM denoland/deno:alpine-2.4.5
ARG DB_PATH
# run as nonroot user
USER deno
WORKDIR /app
COPY --chown=deno:deno . .
ENTRYPOINT ["/bin/deno"]
CMD ["run", "--allow-read=/app/data/seizures.db", "--allow-write=/app/data/seizures.db", "--allow-env", "--allow-net", "--unstable-temporal", "main.ts" ]
