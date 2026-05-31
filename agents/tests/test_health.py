"""Smoke tests for the Pact agent runtime."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

REPO_ROOT = ROOT.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from pact.api.main import create_app


@pytest.fixture
def client():
    from pact.db import init_db

    init_db()
    with TestClient(create_app()) as c:
        yield c


def test_healthz(client):
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "version" in res.json()


def test_scheduler_config(client):
    res = client.get("/scheduler/config")
    assert res.status_code == 200


def test_agents_search(client):
    res = client.get("/agents/search?limit=5")
    assert res.status_code == 200
    assert "agents" in res.json()
