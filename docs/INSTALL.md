# Installation

## Prerequisites
### Server
 * Node.js
 * Yarn
 * SQLite3

### Client
 * Python 3.7+
 * PyGObject

On Ubuntu/Debian:
```shell
sudo apt install python3-gi python3-gi-cairo gir1.2-gtk-3.0
```

More information about running Python GTK3 applications can be found in the [PyGObject documentation](https://pygobject.readthedocs.io/).

## Building and running

### Installing dependencies
```shell
yarn install
```

### Building
```shell
yarn build
```

### Upgrading
To upgrade or downgrade your Pixaref database, run the following command after building:

```shell
node server/dist/data/migrate.js PATH_TO_DATABASE FROM_VERSION TO_VERSION
```

For example, to upgrade the database at the default location from v0.0.1 to v0.0.2:

```shell
node server/dist/data/migrate.js server/dist/data/pixaref.db 0.0.1 0.0.2
```