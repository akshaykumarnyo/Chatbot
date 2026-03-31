.PHONY: help up down build logs dev-backend dev-frontend db-shell redis-shell clean

help:
	@echo ""
	@echo "  make up              Start all services (Docker)"
	@echo "  make down            Stop all services"
	@echo "  make build           Rebuild all images"
	@echo "  make logs            Tail all service logs"
	@echo "  make logs-backend    Tail backend logs"
	@echo "  make dev-backend     Run backend locally (needs venv)"
	@echo "  make dev-frontend    Run frontend locally (needs npm)"
	@echo "  make db-shell        Open psql shell"
	@echo "  make redis-shell     Open redis-cli shell"
	@echo "  make clean           Remove volumes + containers"
	@echo ""

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose up --build -d

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

db-shell:
	docker-compose exec postgres psql -U chatbot -d chatbot_db

redis-shell:
	docker-compose exec redis redis-cli

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f
