FROM base as packages
WORKDIR /app/demo
FROM base as builder
WORKDIR /app/demo
COPY --from=packages /app/demo/ .
COPY . .
FROM base as production
ENV PORT 3001

WORKDIR /app/demo
COPY --from=builder /app/demo ./

COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ARG COMMIT_SHA
ENV COMMIT_SHA ${COMMIT_SHA}

EXPOSE 3001
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]