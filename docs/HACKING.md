# Development

## Building `@pixaref/core`
Execute the following commands to build `@pixaref/core`:

```shell
cd core
yarn build
```

## Building and running `@pixaref/server`
Execute the following commands to build and run `@pixaref/server`:

```shell
cd server
yarn build
yarn serve
```

Building the server will also automatically build `@pixaref/core`.

## Running `@pixaref/web` in development mode
Execute the following commands to run `@pixaref/web` in Angular development mode.

```shell
cd web
npx -p @angular/cli ng serve
```