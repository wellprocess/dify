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