FROM denoland/deno:alpine-2.4.5
# run as nonroot user
USER deno
WORKDIR /app
COPY . .
ENTRYPOINT ["/bin/deno"]
CMD ["run", "--allow-write=./seizures.db", "--allow-read=./seizures.db",  "--allow-env", "--allow-net", "--unstable-temporal", "main.ts" ]
