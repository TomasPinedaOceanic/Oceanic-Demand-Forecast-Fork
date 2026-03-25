# Oceanic Demand Forecast

A fullstack demand forecasting and inventory management platform for retail. Users upload historical sales and inventory data; the system trains per-SKU Prophet models and returns 90-day demand predictions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts |
| Backend | FastAPI, Python 3.10+, SQLAlchemy, PostgreSQL |
| ML Pipeline | Prophet, scikit-learn, pandas, numpy |
| Auth | Session-based (sessionStorage), demo mode |

---

## Project Structure

```
Oceanic-Demand-Forecast/
├── backend/
│   ├── api/
│   │   ├── main.py            # FastAPI app — all endpoints
│   │   └── validation.py      # DataFrame validation and cleaning
│   ├── database/
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── database.py        # Engine, session, table init
│   │   └── base.py            # Declarative base
│   ├── demand_forecast/
│   │   ├── prophet_demand_forecast.py   # Full ML pipeline
│   │   ├── reference_sales.csv          # Reference dataset (35 SKUs)
│   │   └── ml_plots/                    # Generated evaluation plots
│   ├── inventory/
│   │   ├── inventory_analysis.py
│   │   └── reference_inventory.csv
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/               # Next.js App Router pages
│       │   ├── dashboard/
│       │   ├── predictions/
│       │   ├── inventory/
│       │   ├── data-ingestion/
│       │   └── login/
│       ├── components/        # Reusable React components
│       │   ├── ui/            # shadcn/ui component library
│       │   ├── charts/
│       │   └── tables/
│       ├── lib/
│       │   ├── api.ts         # Typed Axios API client
│       │   └── auth-context.tsx
│       └── data/              # Static reference data
└── README.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally

---

## Running Locally

### 1. Clone the repository

```bash
git clone <repo-url>
cd Oceanic-Demand-Forecast
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/oceanic
```

Initialize the database (creates all tables):

```bash
python -m database.database
```

Start the API server:

```bash
uvicorn api.main:app --reload
```

API available at `http://localhost:8000` — interactive docs at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend/src
npm install
npm run dev
```

App available at `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-sales` | Upload sales CSV/XLSX — triggers Prophet pipeline in background |
| `POST` | `/upload-inventory` | Upload inventory snapshot CSV/XLSX |
| `GET` | `/api/predictions` | Get forecast results, filterable by `item_id`, `date_from`, `date_to` |
| `GET` | `/api/predictions/status` | Get current pipeline status (`uploaded → processing → ready/failed`) |
| `GET` | `/api/sales` | Get historical sales, filterable by SKU, store, category, date range |
| `GET` | `/api/sales/range` | Get min/max date available in sales data |
| `GET` | `/api/inventory` | Get current stock levels per SKU |

### Sales file expected columns

| Column | Required | Type |
|---|---|---|
| `date` | Yes | Date |
| `item_id` | Yes | String |
| `units_sold` | Yes | Integer |
| `sell_price` | Yes | Float |
| `store_id` | No | String |
| `cat_id` | No | String |
| `dept_id` | No | String |
| `holiday_promotion` | No | Integer |
| `event_name_1` | No | String |

### Inventory file expected columns

| Column | Required | Type |
|---|---|---|
| `date` | Yes | Date |
| `item_id` | Yes | String |
| `store_id` | Yes | String |
| `inventory_on_hand` | Yes | Integer |
| `lead_time_days` | Yes | Integer |
| `unit_cost` | Yes | Float |
| `inventory_available` | No | Integer |
| `reorder_quantity` | No | Integer |

---


**Expected runtime:** 5–10 minutes depending on number of SKUs and dataset size.

---
