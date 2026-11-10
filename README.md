# 01 Solid Tester

# Project Incomplete (it's missing the compiler and test cases for all languages)

A modern web-based tester for [reboot01](https://learn.reboot01.com) students, piscines and checkpoints.

## Requirements

- [Docker](https://docs.docker.com/get-docker/)

## How to Run

> This may take a moment on the first run while the image downloads.

```bash
docker run --name js-tester -p 3000:3000 ghcr.io/YOUR_USERNAME/01jstester:latest
```

Then open your browser and go to `http://localhost:3000`

To stop it:

```bash
docker stop js-tester
```

To start it again later:

```bash
docker start js-tester
```

## Updating

When a new version is released, remove the old container and image, then run again:

```bash
docker stop js-tester
docker rm js-tester
docker rmi ghcr.io/Husain-khamis/01jstester:latest
```

Then re-run the original run command above.
