# Eko

- [Eko](#eko)
  - [Overview](#overview)
    - [Arrange logs](#arrange-logs)
    - [Storage layers](#storage-layers)
    - [Show up logs](#show-up-logs)
  - [Develop](#develop)
    - [PNPM](#pnpm)
    - [Docker](#docker)
  - [Run](#run)
  - [Example](#example)
  - [Questions](#questions)

Eko is an example service to arrange containers' logs. Nothing new and nothing fancy, go ahead.

## Overview

> While there is no binary right now, features are still written like it actually present.

### Arrange logs

```sh
eko log arrange "name=lorem"
```

The first and only one argument is the filter string, like the one docker forces people to use. [You can take a deeper look in the official docs](https://docs.docker.com/engine/reference/commandline/ps/#filter).

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

### Docker

> You need to have docker one way or the other.

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

## Questions

Q: Is it possible to use this logging service inside a container (I don't want to run on host)?

A: It is, you just need to prepare a dockerfile and mount host's docker.

---

Q: Is it possible to access remote docker on other machine?

A: Right now nope, but it is easy to implement, coz docker accepts -H option with an address and port to a docker deamon.

---

Q: Does this logging service observers container while running or only one time at the startup?

A: It does observer each X amount of seconds. But it's not configurable now.

---

Q: Can I ran multiple such logging services that listen the same containers with the same storages?

A: Nope, right now it would probably fail. At least with the FS storage, some of the services would fail to write to the same file.
