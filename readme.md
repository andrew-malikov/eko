# Eko

- [Eko](#eko)
  - [Overview](#overview)
    - [Arrange logs](#arrange-logs)
    - [Storage layers](#storage-layers)
    - [Show up logs](#show-up-logs)
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
eko log arrange "name=lorem"
```

The first and only one argument is the filter string, like the one docker forces people to use. You can take a deeper look in the official docs.

```sh
eko log arrange -s "fs::./my-logs" "id=31sasfw234"
```

You can use `-s` option to config the storage layer, for now there is only one `FS`. The `FS` config is very simple so that the whole left part after `::` is treated as path where to store the logs.

### Storage layers

Shows up a list of supported storage layers and additional metadata.

```sh
eko storage list
```

### Show up logs

Pipes the container logs onto stdout infinitely.

```sh
eko log show <container-id>
```

## Develop

### PNPM

While it is quite possible to use npm to run this project, pnpm is strongly encouraged, even if you don't have one.

```sh
npm install -g pnpm
```

## Run

```
pnpm start
```

## Example

Run that docker compose to have a set of container to arrange logs from:

```sh
docker compose -p eko -f example/docker-compose.yaml up --force-recreate --always-recreate-deps --build
```

and then run eko:

```sh
pnpm start log arrange "name=lorem"
```

See the logs in the `./logs` folder.

Additionally, you can show up the logs via eko. Firstly, you need to get the container id you want to show up via

```sh
pnpm start log list
```

and finally, bring the logs:

```sh
pnpm start log show <container-id>
```

### Logging Container

> It is possible but out of scope
