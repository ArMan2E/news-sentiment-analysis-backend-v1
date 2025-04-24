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
COPY package.json package-lock.json ./

# install ALL deps (dev + prod) so linux‑x64‑napi*.node is fetched
RUN npm ci          # deterministic & faster

# Bun install only if you have Bun‑specific deps
RUN bun install   # uncomment if you really need it

# --- copy sources & build ------------------------------------------
COPY . .
RUN bun run build   # ensure this writes to dist/

######################## 2️⃣  RUNTIME (STAGE) ########################
FROM oven/bun:1.2.10 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# ---- OPTION A : copy full node_modules (simple, ~180 MB image) -----
COPY --from=builder /workspace/dist         ./dist
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/package.json .

# ---- OPTION B : copy only the native binary (smaller image) -------
# Uncomment this block and delete OPTION A’s node_modules copy if
# you prefer a ~110 MB image.
#
COPY --from=builder \
     /workspace/node_modules/@fluvio/client/dist/linux/*.node \
     /app/native/
ENV NODE_PATH="/app/native:${NODE_PATH}"

# -------------------------------------------------------------------
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod 755 /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 9090


# #official and updated bun image 
# FROM node:20-slim AS base

# # FLuvio tools
# RUN apt-get update && \
# 	apt-get install -y curl unzip tzdata && \
# 	rm -rf /var/lib/apt/lists/*

# RUN curl -fsS https://hub.infinyon.cloud/install/install.sh?ctx=dc | bash

# RUN echo 'export PATH="$HOME/.fluvio/bin:$HOME/.fvm/bin:$PATH"' >> ~/.bashrc && \
# echo 'source "${HOME}/.fvm/env"' >> ~/.bashrc

# # source .bashrc for env loading
# RUN /bin/bash -c "source ~/.bashrc"

# # set path to run commands outside of an interactive shell
# RUN chmod +x /root/.fluvio/bin/* /root/.fvm/bin/*
# ENV PATH="$PATH:/root/.fluvio/bin:/root/.fvm/bin"


# #set working dir all relative path will be based on this
# WORKDIR /usr/app
# 	#install dependencies into temp dir
# # cache them and speed up build
# #--frozen-lockfile -> install as it is
# FROM base AS install
# RUN mkdir -p /temp/dev
# COPY package.json tsconfig.json bun.lock /temp/dev/
# RUN cd /temp/dev && bun install --frozen-lockfile

# #install with --production  (exclude devDependencies)
# RUN mkdir -p /temp/prod
# COPY package.json bun.lock /temp/prod/
# RUN cd /temp/prod && bun install --frozen-lockfile --production

# #copy node_modules from temp dir
# # then copy all (non-ignored Dockerignore) proj files into the img
# FROM oven/bun:1.2.10 AS prerelease
# COPY --from=install /temp/dev/node_modules node_modules
# COPY . .

# #bun env
# ENV NODE_ENV=production
# RUN bun run build --target=bun --outdir=dist index.ts

# #Only production node_modules are used
# FROM prerelease AS release
# COPY --from=install /temp/prod/node_modules node_modules
# # COPY --from=prerelease /usr/src/app/src ./src
# COPY --from=prerelease /usr/src/app/dist/index.js .
# COPY --from=prerelease /usr/src/app/package.json .

# # already provided non root user by bun
# COPY ./entrypoint.sh ./
# RUN chmod 777 ./entrypoint.sh

# EXPOSE 9090/tcp
# ENTRYPOINT [ "./entrypoint.sh" ]