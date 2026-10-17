FROM node:18-bullseye

RUN apt-get update && apt-get install -y git curl build-essential --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
