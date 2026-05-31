.PHONY: install test build dev contracts-test agents-test frontend-test

install:
	cd contracts && cargo fetch
	cd agents && pip install -r requirements.txt
	cd frontend && npm install

test: contracts-test agents-test frontend-test

build:
	cd contracts && stellar contract build
	cd frontend && npm run build

contracts-test:
	cd contracts && cargo test

agents-test:
	cd agents && pytest tests/ -v

frontend-test:
	cd frontend && npm run lint && npm run build

dev:
	@echo "Starting agents on :8000 and frontend on :3000..."
	@(cd agents && python main.py) & \
	(cd frontend && npm run dev)

deploy-testnet:
	bash scripts/testnet/deploy_all.sh
