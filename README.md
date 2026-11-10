# 01 Solid Tester

A modern web-based tester for [reboot01](https://learn.reboot01.com) students, piscines and checkpoints.

## Requirements

- [Docker](https://docs.docker.com/get-docker/)

## How to Run

> This may take a moment on the first run while the image downloads.

```bash
docker run --name js-tester -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/YOUR_USERNAME/01jstester:latest
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

## Tests and graders

Submissions are graded by 01-edu's official grader Docker images (`ghcr.io/01-edu/*`), run with no network, a read-only filesystem, 512MB `/jail` + 256MB `/tmp` scratch space, resource limits, and as uid 1000. The first test per language downloads the image (~300-450MB).

- **Security:** mounting the Docker socket gives the app root on the host. Use it locally only and never expose it publicly.
- **Upstream changes:** if 01-edu hides or changes images, run `server/scripts/snapshot-images.sh` while they still exist (saves to `snapshots/`, restore with `docker load -i`).
- **Override:** set `GRADER_IMAGE_<NAME>` (e.g. `GRADER_IMAGE_TEST_GO=ghcr.io/you/test-go`) to use a mirrored image.

## Updating

When a new version is released, remove the old container and image, then run again:

```bash
docker stop js-tester
docker rm js-tester
docker rmi ghcr.io/Husain-khamis/01jstester:latest
```

Then re-run the original run command above.
