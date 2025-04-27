######################## 1️⃣  BUILDER (STAGE) ########################
FROM node:22-slim AS builder  

RUN apt-get update && \
	apt-get install -y curl unzip build-essential ca-certificates && \
	rm -rf /var/lib/apt/lists/*

# --- Bun ------------------------------------------------------------
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# --- Fluvio CLI (build‑time only) -----------------------------------
RUN curl -fsSL https://hub.infinyon.cloud/install/install.sh?ctx=dc | bash

RUN echo 'export PATH="$HOME/.fluvio/bin:$HOME/.fvm/bin:$PATH"' >> ~/.bashrc && \
echo 'source "${HOME}/.fvm/env"' >> ~/.bashrc

# source .bashrc for env loading
RUN /bin/bash -c "source ~/.bashrc"

# set path to run commands outside of an interactive shell
RUN chmod +x /root/.fluvio/bin/* /root/.fvm/bin/*
ENV PATH="$PATH:/root/.fluvio/bin:/root/.fvm/bin"

WORKDIR /workspace

# --- copy manifests first for cache ---------------------------------
COPY package.json  ./

# RUN npm ci          # deterministic & faster

RUN bun install --production 

# --- copy sources & build ------------------------------------------
COPY . .
RUN bun build index.ts --target=node --outdir=dist --no-minify --sourcemap --format=cjs

#  RUNTIME (STAGE)
FROM oven/bun:1.2.10 AS runtime
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /root/.fluvio /root/.fluvio
COPY --from=builder /root/.fvm	/root/.fvm

ENV PATH="/root/.fluvio/bin:/root/.fvm/bin:$PATH"
# ---- OPTION A : copy full node_modules (simple, ~180 MB image) -----
COPY --from=builder /workspace/dist/         . 
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/package.json .

COPY --from=builder \
     /workspace/node_modules/@fluvio/client/dist/linux/*.node \
     /app/linux/
ARG NODE_PATH
ENV NODE_PATH="/app/linux:${NODE_PATH}"

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod 755 /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 8080
