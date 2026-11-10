#!/bin/bash
# Snapshot 01-edu grader images into snapshots/graders-<date>.tar (repo root) in case upstream hides or changes them.
set -u
cd "$(dirname "$0")/../.." || exit 1
date=$(date +%Y-%m-%d)
refs=()
for name in test-go module-go imperative-piscine-go module-js module-rust; do
    ref=ghcr.io/01-edu/$name
    if ! docker pull "$ref"; then
        echo "WARN: pull failed for $ref, keeping local copy if any" >&2
    fi
    if docker image inspect "$ref" >/dev/null 2>&1; then
        docker tag "$ref" "solid-tester/$name:$date"
        refs+=("$ref" "solid-tester/$name:$date")
    else
        echo "WARN: $ref missing" >&2
    fi
done
[ ${#refs[@]} -eq 0 ] && { echo "nothing to save" >&2; exit 1; }
mkdir -p snapshots
docker save -o "snapshots/graders-$date.tar" "${refs[@]}" || exit 1
echo "Saved snapshots/graders-$date.tar"
echo "Restore with: docker load -i snapshots/graders-$date.tar"
echo
echo "To mirror to a PRIVATE registry (only module-rust is MIT-licensed; keep the mirror private):"
echo "  docker tag ghcr.io/01-edu/<name> ghcr.io/<you>/<name> && docker push ghcr.io/<you>/<name>"
echo "Then point the app at it with GRADER_IMAGE_<NAME>=ghcr.io/<you>/<name> (e.g. GRADER_IMAGE_TEST_GO)."
