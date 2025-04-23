#official and updated bun image 
FROM oven/bun:1.2.10 AS base

# FLuvio tools
RUN apt-get update && \
	apt-get install -y curl unzip tzdata && \
	rm -rf /var/lib/apt/lists/*

RUN curl -fsS https://hub.infinyon.cloud/install/install.sh?ctx=dc | bash

RUN echo 'export PATH="$HOME/.fluvio/bin:$HOME/.fvm/bin:$PATH"' >> ~/.bashrc && \
echo 'source "${HOME}/.fvm/env"' >> ~/.bashrc

# source .bashrc for env loading
RUN /bin/bash -c "source ~/.bashrc"

# set path to run commands outside of an interactive shell
RUN chmod +x /root/.fluvio/bin/* /root/.fvm/bin/*


#set working dir all relative path will be based on this
WORKDIR /usr/src/app
	#install dependencies into temp dir
# cache them and speed up build
#--frozen-lockfile -> install as it is
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

#install with --production  (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

#copy node_modules from temp dir
# then copy all (non-ignored Dockerignore) proj files into the img
FROM base as prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

#bun env
ENV NODE_ENV=production
RUN bun run build

#Only production node_modules are used
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/index.ts .
COPY --from=prerelease /usr/src/app/package.json .

# already provided non root user by bun
USER bun
EXPOSE 9090/tcp
RUN chmod +x entrypoint.sh
ENTRYPOINT [ "./entrypoint.sh" ]