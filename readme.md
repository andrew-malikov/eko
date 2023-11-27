# Eko

- [Eko](#eko)
  - [Overview](#overview)
    - [Storage layers](#storage-layers)
    - [Docker socket format](#docker-socket-format)
    - [Arrange logs](#arrange-logs)
  - [Develop](#develop)
    - [Docker](#docker)
    - [Install deps](#install-deps)
    - [Environment variables](#environment-variables)
    - [Run with docker compose](#run-with-docker-compose)
  - [Bundle and run yourself](#bundle-and-run-yourself)
  - [Example](#example)
  - [Questions](#questions)

Eko is an example service to arrange containers' logs. Nothing new and nothing fancy, go ahead.

## Overview

The main focus is made on a few things

- arrange logs from a particular docker socket
- get a stream of those

### Storage layers

Eko supports multiple storage layers via ENV in format of "<storage-name>::<connection-string>".

For now, there are only two `fs` and `mongo`. The `fs` config is very simple so that the whole right part after `::` is treated as path where to store the logs. For `mongo` the right part is the connection string.

### Docker socket format

When eko subscribes to a docker socket it expects it to be like "remote::<address>" or "local::<path>".

### Arrange logs

The API to arrange logs from a docker socket support a mandatory filter, the one docker uses under the hood. [You can take a deeper look in the official docs](https://docs.docker.com/engine/reference/commandline/ps/#filter).

## Develop

### Docker

> You need to have docker one way or the other, either on local or remotely on a machine with open port to access docker socket.

### Install deps

```sh
npm i
```

### Environment variables

Copy the example env file and adjust vars you need:

```sh
cp .config/.env.example .env
```

### Run with docker compose

```sh
docker compose --env-file .env -f build/docker-compose.yml -p ekoserver up --build
```

## Bundle and run yourself

Bundle the server:

```sh
npm run bundle
```

Append the variables to current shell:

```sh
export $(cat .env | xargs)
```

Run the bundled server with node:

```sh
node bundle
```

## Example

> Outdated since replacing CLI with a server solution

> Other thing to consider is to use docker-compose with mongodb `docker compose -p mongo -f example/docker-compose.mongo.yaml up`
> You will need to provide `-s "mongo::mongodb://superadmin:neverguessit@localhost:27017/eko?authSource=admin"` when you call `./binary/eko log arrange` and other commands.
> By default eko is going to use `fs` storage with logs location under `./logs`.

Build eko binary:

```sh
npm i && npm run binary
```

Run that docker compose to have a set of container to arrange logs from:

```sh
docker compose -p eko -f example/docker-compose.yaml up --force-recreate --always-recreate-deps --build
```

and then run eko:

```sh
./binary/eko log arrange "name=lorem"
```

See the logs in the `./logs` folder.

Additionally, you can show up the logs via eko. Firstly, you need to get the container id you want to show up via

```sh
./binary/eko log list
```

and finally, bring the logs:

```sh
./binary/eko log show <container-id>
```

## Questions

Q: Does this logging service observe container while running or only one time at the startup?

A: It does observe each X amount of seconds. But it's not configurable now.

---

Q: Can I run multiple such logging services that listen the same containers with the same storage?

A: Nope, right now it would probably fail. At least with the FS storage, some of the services would fail to write to the same file.

---

Q: Does eko arrange logs with the last saved position?

A: Yep, it does.
