#!/data/user/0/com.hermesagent.android/files/usr/bin/python3
"""Install pure-Python wheels without pip.

pip is unusable in this environment: it shells out to
``/data/data/com.termux/files/usr/bin/python3.14`` (the retired Termux prefix)
and fails on every command, including ``pip download``. dpkg's maintainer scripts
hit the same hardcoded path.

Every dependency this project needs except the optional ``cryptography`` is pure
Python, so unpacking the wheels into site-packages by hand is both sufficient
and the only thing that works here.
"""

from __future__ import annotations

import io
import json
import os
import sys
import urllib.request
import zipfile

SITE = "/data/user/0/com.hermesagent.android/files/usr/lib/python3.14/site-packages"


def latest_version_from_pypi(project: str) -> str:
    url = f"https://pypi.org/pypi/{project}/json"
    with urllib.request.urlopen(url, timeout=60) as response:
        data = json.load(response)
    return data["info"]["version"]


def wheel_url(project: str, version: str) -> str | None:
    """Return the py3-none-any wheel URL, or None if the project has none."""
    url = f"https://pypi.org/pypi/{project}/{version}/json"
    with urllib.request.urlopen(url, timeout=60) as response:
        data = json.load(response)
    for entry in data["urls"]:
        name = entry["filename"]
        # any-cpython / abi3 wheels are fine too; a compiled .so is not.
        if name.endswith("-py3-none-any.whl") or name.endswith("-py2.py3-none-any.whl"):
            return entry["url"]
    return None


def install(project: str) -> str:
    try:
        version = latest_version_from_pypi(project)
    except Exception as exc:  # noqa: BLE001
        return f"FAIL  {project}: metadata lookup failed: {exc}"

    try:
        url = wheel_url(project, version)
    except Exception as exc:  # noqa: BLE001
        return f"FAIL  {project}: wheel lookup failed: {exc}"

    if url is None:
        return f"SKIP  {project} {version}: no pure-Python wheel"

    try:
        with urllib.request.urlopen(url, timeout=120) as response:
            payload = response.read()
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            archive.extractall(SITE)
    except Exception as exc:  # noqa: BLE001
        return f"FAIL  {project} {version}: download/extract failed: {exc}"

    return f"OK    {project} {version}"


def main() -> int:
    os.makedirs(SITE, exist_ok=True)
    projects = sys.argv[1:] or [
        "httpx",
        "httpcore",
        "h11",
        "idna",
        "certifi",
        "sniffio",
        "anyio",
        "fastapi",
        "uvicorn",
        "starlette",
        "pydantic",
        "pydantic-core",
        "annotated-types",
        "typing-extensions",
        "typing-inspection",
        "click",
        "ecdsa",
        "six",
    ]
    results = [install(project) for project in projects]
    for line in results:
        print(line)
    return 0 if not any(line.startswith("FAIL") for line in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())