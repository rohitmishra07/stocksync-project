# StockSync — Inventory & Order Management for Small Retailers

<p align="center">
  <strong>Unified stock tracking across physical stores, Shopify, and Amazon.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-blue" />
  <img src="https://img.shields.io/badge/Django-5.1-green" />
  <img src="https://img.shields.io/badge/React-18-61DAFB" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-orange" />
</p>

---

## The Problem

Small retailers selling across multiple channels constantly oversell, lose track of stock, and manually update inventory in 3+ places. They can't afford enterprise tools like NetSuite, and Shopify's built-in tools break the moment you add Amazon or a physical store.

## The Solution

**One dashboard. Real-time stock sync. Smart alerts. Purchase orders. Barcode scanning. Sales analytics.**

---

## Features

- **Multi-location inventory** — Track stock across warehouses and stores with real-time sync
- **Product management** — SKUs, variants, categories, and automated barcode generation
- **Demand Forecasting** — 90-day sales analysis with intelligent reorder suggestions 🧠
- **Supplier Portal & POs** — Full Purchase Order lifecycle with tokenized supplier acknowledgement 📦
- **Product Bundles & Kits** — Sell sets of products with recursive stock deduction 🎁
- **Order Management** — Multi-channel fulfillment, tracking, and cancellation logic
- **Mobile PWA Scanner** — Installable mobile app for on-the-go barcode scanning and stock adjusts 📷
- **AI Anomaly Detection** — Automated screening for pricing errors, overstock, and deep discounts ⚠️
- **India GST-Ready** — Automatic IGST/CGST/SGST splitting and tax-ready CSV reports 🇮🇳
- **Low Stock & WhatsApp Alerts** — Multi-layered notifications via Email and WhatsApp 📱
- **CSV Import/Export** — Bulk catalog management via optimized CSV wizard
- **Multi-tenant SaaS** — Full tenant isolation with role-based access controls
- **Stripe Billing** — Built-in subscription tiers and plan enforcement 💳

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.1, Django REST Framework |
| Frontend | React 18, TypeScript, Tailwind CSS |
| Database | PostgreSQL 16 |
| Task Queue | Celery + Redis |
| API Docs | drf-spectacular (Swagger/ReDoc) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose

### Setup (one command)

```bash
git clone https://github.com/YOUR_USERNAME/stocksync.git
cd stocksync
make setup
```

This will:
1. Build all Docker containers (Django, React, Postgres, Redis, Celery)
2. Run database migrations and setup tenant schemas
3. Seed demo data (15 products, 25 orders, 3 bundles, 2 POs)
4. Start the development servers

### Post-Setup Intelligence
To trigger the AI-driven forecasting and anomaly detection for the first time, run:
```bash
docker compose exec backend python manage.py shell -c "from apps.analytics.tasks import run_nightly_intelligence; run_nightly_intelligence()"
```

### Mobile Scanner (PWA)
Access the mobile scanner at `http://localhost:5173/scanner`. To install as a PWA, open the URL in Chrome (Android) or Safari (iOS) and select "Add to Home Screen".

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1/ |
| API Docs (Swagger) | http://localhost:8000/api/docs/ |
| API Docs (ReDoc) | http://localhost:8000/api/redoc/ |
| Django Admin | http://localhost:8000/admin/ |

**Demo login:** `demo@stocksync.dev` / `demo1234`

---

## API Overview

```
Auth:      POST /api/v1/auth/register/  login/  refresh/  me/
Products:  GET|POST /api/v1/products/  {id}/  export/  import_csv/  bundles/
Inventory: GET /api/v1/inventory/stock/  adjust/  transfer/  movements/  low-stock/
Orders:    GET|POST /api/v1/orders/  {id}/  {id}/fulfill/  purchase-orders/
Analytics: GET /api/v1/analytics/dashboard/  forecast/  margins/  gst-report/  anomalies/
Alerts:    GET /api/v1/alerts/  count/  settings/  dismiss-all/
```

Full interactive docs at `/api/docs/`.

---

## Development

```bash
# Run tests
make test

# Run tests with coverage
make test-cov

# Open Django shell
make shell

# View logs
make logs

# Reset everything
make down && make setup
```

---

## Project Structure

```
stocksync/
├── backend/
│   ├── apps/
│   │   ├── accounts/    # Tenant, User, Auth
│   │   ├── products/    # Product, Variant, Category
│   │   ├── inventory/   # StockLevel, Movements, Locations
│   │   ├── orders/      # Order, OrderItem, Fulfillment
│   │   ├── alerts/      # Notifications, Low Stock Alerts
│   │   ├── analytics/   # Dashboard KPIs, Sales Reports
│   │   └── common/      # Base models, utils, middleware
│   ├── config/          # Django settings, URLs, Celery
│   └── requirements/    # base, dev, prod dependencies
├── frontend/
│   └── src/
│       ├── api/         # Axios client, endpoint wrappers
│       ├── components/  # Reusable UI components
│       ├── pages/       # Route-level page components
│       ├── hooks/       # React Query hooks
│       └── types/       # TypeScript interfaces
├── docker-compose.yml
├── Makefile
└── .github/workflows/   # CI pipeline
```

---

## Roadmap

- [x] Phase 1: Core inventory + products + auth
- [x] Phase 2: Orders + fulfillment
- [x] Phase 3: Shopify & Amazon sync ✅
- [x] Phase 4: Advanced analytics + forecasting ✅
- [x] Phase 5: Mobile barcode scanner ✅
- [x] Phase 6: Stripe billing + SaaS launch ✅

---

## License

AGPL-3.0 — Free to use, modify, and self-host. If you host it as a service, you must open-source your changes.

---

**Built with Django + React. Star ⭐ if you find this useful!**
