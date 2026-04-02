.PHONY: up down build test seed migrate shell

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Rebuild containers
build:
	docker compose build

# Run database migrations
migrate:
	docker compose exec backend python manage.py migrate

# Create superuser
superuser:
	docker compose exec backend python manage.py createsuperuser

# Seed demo data
seed:
	docker compose exec backend python manage.py seed_demo

# Run backend tests
test:
	docker compose exec backend pytest

# Run tests with coverage
test-cov:
	docker compose exec backend pytest --cov=apps --cov-report=html

# Open Django shell
shell:
	docker compose exec backend python manage.py shell

# View logs
logs:
	docker compose logs -f

# Full setup (first time)
setup: build up migrate seed
	@echo "✅ StockSync is ready!"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo "API Docs: http://localhost:8000/api/docs/"
	@echo "Admin: http://localhost:8000/admin/"
	@echo "Login: demo@stocksync.dev / demo1234"

# Full production deployment
deploy:
	docker compose -f docker-compose.prod.yml up --build -d
	@echo "🚀 StockSync Production is deploying..."
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost/api/v1/"
	@echo "Admin: http://localhost/admin/"
	@echo "Logs: docker compose -f docker-compose.prod.yml logs -f"
