FROM denoland/deno:ubuntu-2.5.6
# run as a nonroot user
USER deno
WORKDIR /app/ui
COPY --chown=deno:deno . .
ENTRYPOINT ["/bin/deno"]
