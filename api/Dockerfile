FROM denoland/deno:alpine-2.4.5
ARG DB_PATH
# run as a nonroot user
USER deno
WORKDIR /app/api
COPY --chown=deno:deno . .
ENTRYPOINT ["/bin/deno"]
CMD ["run", "--allow-read=/app/api/data/seizures.db", "--allow-write=/app/api/data/seizures.db", "--allow-env", "--allow-net", "--unstable-temporal", "main.ts" ]
