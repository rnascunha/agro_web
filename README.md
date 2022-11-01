[![Build](https://github.com/rnascunha/agro_web/actions/workflows/main.yml/badge.svg)](https://github.com/rnascunha/agro_web/actions/workflows/main.yml)

# Agro Web

Interface of agro_project

## Build from source

### Dependencies

* git - clone repository;
* npm/node - install depedencies and build

### Building

```
# Clone repository
$ git clone https://github.com/rnascunha/agro_web
$ cd agro_web

# Install dependencies
$ npm install

# Update packages (this maybe be needed)
$ npm update

$ Build
# npm run build
```
This will output the page content to the `dist` directory. You can now copy this file to a web server.

If you are developing, instead of typing the last command (`npm run build`), you can type:
```
$ npm start
```
This will compile the code open a web server with the content. All changes at the code are updated on the go.

### Using Docker

You can use build a container that will do all the necessary steps to build the application and run the web server. To do this:
```bash
# Clone repository
$ git clone https://github.com/rnascunha/agro_web
$ cd agro_web

# Build container
$ docker build -t agro_web .
```
Now, to run the container at `some port`:
```
$ docker run --rm -p <some_port>:80 -t agro_web
```

Now you can open a browser use the application.