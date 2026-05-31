# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-01

### Added

- Open-source foundation: Apache 2.0 license, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY
- GitHub CI for contracts, agents, and frontend
- Modular `agents/pact/` package with FastAPI routers
- Shared deployment manifest loader (`packages/config`)
- Architecture and API documentation under `docs/`
- Open-core Pro tier scaffold with feature gating
- Root Makefile for install, test, and dev workflows
- Per-crate contract READMEs

### Changed

- Root README rewritten for open-source contributors
- User feedback table moved to `docs/community/user-feedback.md`
- Contract addresses unified via deployment manifest

## [Unreleased]

### Testnet (pre-OSS)

- Five Soroban contracts deployed on Stellar Testnet
- AI agent negotiation, matchmaking, and oracle settlement runtime
- Next.js frontend with wallet integration and admin ops pages

[0.1.0]: https://github.com/pact-protocol/pact-protocol-stellar/releases/tag/v0.1.0
