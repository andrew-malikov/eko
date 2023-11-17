# Eko

- [Eko](#eko)
  - [Overview](#overview)
    - [Arrange logs](#arrange-logs)
    - [Storage layers](#storage-layers)
    - [Show up logs](#show-up-logs)
  - [Develop](#develop)
    - [Docker](#docker)
    - [Install deps](#install-deps)
  - [Run](#run)
  - [Binary](#binary)
  - [Example](#example)
  - [Questions](#questions)

Eko is an example service to arrange containers' logs. Nothing new and nothing fancy, go ahead.

## Overview

### Arrange logs

```sh
eko log arrange "name=lorem"
```

The first and only one argument is the filter string, like the one docker forces people to use. [You can take a deeper look in the official docs](https://docs.docker.com/engine/reference/commandline/ps/#filter).

```sh
eko log arrange -s "fs::./my-logs" "id=31sasfw234"
```

You can use `-s` option to config the storage layer, for now there is only one `FS`. The `FS` config is very simple so that the whole right part after `::` is treated as path where to store the logs.

Additionally, you can set `-d` option to connect to a remote docker host like:

```sh
eko log arrange -d "remote::123.123.23.1:3241" "name=lorem"
```

The default option is access the local docker socket if for some reason yours isn't `/var/run/docker.sock` be sure to change it `-d "local::/my/run/docker.sock`.

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

### Docker

> You need to have docker one way or the other, either on local or remotely on a machine with open port to access docker socket.

### Install deps

```sh
npm i
```

## Run

Build the project:

```sh
npm run build 
```

and then run:

```sh
npm run start
```

## Binary

You can build a binary:

```sh
npm run binary
```

You can find the artifact `./binary/eko`.

## Example

> You can either use npm to build and run eko or have binary instead.

Build eko:

```sh
npm run build
```

Run that docker compose to have a set of container to arrange logs from:

```sh
docker compose -p eko -f example/docker-compose.yaml up --force-recreate --always-recreate-deps --build
```

and then run eko:

```sh
npm run start log arrange "name=lorem"
```

See the logs in the `./logs` folder.

Additionally, you can show up the logs via eko. Firstly, you need to get the container id you want to show up via

```sh
npm run start log list
```

and finally, bring the logs:

```sh
npm run start log show <container-id>
```

## Questions

Q: Does this logging service observers container while running or only one time at the startup?

A: It does observe each X amount of seconds. But it's not configurable now.

---

Q: Can I run multiple such logging services that listen the same containers with the same storage?

A: Nope, right now it would probably fail. At least with the FS storage, some of the services would fail to write to the same file.
