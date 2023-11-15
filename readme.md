# Eko

- [Eko](#eko)
  - [Overview](#overview)
    - [Arrange logs](#arrange-logs)
    - [Storage layers](#storage-layers)
      - [Purge logs](#purge-logs)
    - [Preview logs](#preview-logs)
  - [Develop](#develop)
    - [PNPM](#pnpm)
  - [Run](#run)
  - [Example](#example)
    - [Logging Container](#logging-container)

Eko is an example service to arrange containers' logs. Nothing new and nothing fancy, go ahead.

## Overview

> While there is no binary right now, features are still written like it actually present.

### Arrange logs

```sh
eko arrange "name=lorem"
```

The first and only one argument is the filter string like the one docker forces people to use. You can have a deeper look in the official docs.

```
eko arrange -s "fs::./my-logs" "id=31sasfw234"
```

You can use `-s` option to config the storage layer, for now there is only one `FS`. The `FS` config is very simple so that the whole left part after `::` is treated as path where to store the logs.

### Storage layers

#### Purge logs

### Preview logs

## Develop

### PNPM

While it is quite possible to use npm to run this project I encourage to use pnpm, even if you don't have one.

```sh
npm install -g pnpm
```

## Run

```
pnpm start
```

## Example

Run that docker compose to have a set of container to arrange logs from.

```sh
docker compose -p eko -f example/docker-compose.yaml up --force-recreate --always-recreate-deps --build
```

```sh
pnpm start arrange "name=lorem"
```

See the logs in the `./logs` folder.

### Logging Container

TO BE CONTINUED
