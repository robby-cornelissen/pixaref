# Usage

## Pixaref Server

### Running the server
Execute the following command to run the Pixaref server:

```shell
./pixaref-server
```

In addition, the Pixaref server makes use of the following environment variables:

 * `DATABASE_PATH`: path to the Pixaref SQLite database
 * `IMAGES_DIRECTORY`: directory to store Pixaref images and thumbnails

For example:

```shell
DATABASE_PATH=~/Pictures/Pixaref/pixaref.db \
IMAGES_DIRECTORY=~/Pictures/Pixaref/images \
./pixaref-server
```

If not specified, the database and images will be stored in the `server/dist/data` directory. 

Note that Pixaref takes full control of the image directory. Image or other files that are not managed by the database will automatically be removed by scheduled cleanup.

## Pixaref Client

### Running the GTK desktop client
Execute the following command to run the Pixaref desktop client:

```shell
./pixaref-client &
```

Or to detach it completely from the terminal:
```shell
./pixaref-client & disown
```