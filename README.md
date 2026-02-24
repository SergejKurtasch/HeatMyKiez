# HeatMyKiez

This project was built as part of participation in **Code Green: Climate Tech Hackathon** organized by ESMT Berlin.

Building retrofit payback calculator: 4-step wizard with address lookup, building form, window replacement options, break-even calculation, and contractor list. Data from `data/mock_data_combo.xlsx`; UI follows the Figma design.

## Stack

- **Backend:** Python 3, FastAPI, pandas, openpyxl
- **Frontend:** React (Vite), TypeScript

## Setup

### Backend

```bash
cd /path/to/heatmykiez
pip install -r requirements.txt
export PYTHONPATH=.
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Excel file must be at `data/mock_data_combo.xlsx`. It is loaded at startup.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/addresses`, `/buildings`, `/calculator`, `/contractors` to the backend (port 8000).

## Flow

1. **Step 1 – Address:** Enter postcode, then choose street and number from cascading lists (only values present in the Excel buildings sheet). City is fixed to Berlin. Click **Add** to load the building.
2. **Step 1 (form):** Building and cost fields are prefilled from Excel; all are editable. Facade sqm is user input; a suggested value is shown as a light gray hint. Click **Next**.
3. **Step 2 – Options:** Summary of the building and one or two window upgrade options (Single → Double/Triple, Double → Triple). Select an option and click **Calculate Break Even**.
4. **Step 3 – Results:** Payback in “X years, Y months”, costs, rent increase, tenant savings. Click **Find Contractor**.
5. **Step 4 – Contractors:** List of contractors whose specialization contains “window” (from the contractors sheet).

## API (field names match Excel/plan)

- `GET /addresses/streets?postcode=...` – streets for postcode
- `GET /addresses/numbers?postcode=...&street=...` – house numbers for postcode + street
- `GET /buildings/search?postcode=...&address=...` – one building (address = street + " " + number)
- `GET /buildings/{building_id}` – building + prefill (RentPerUnit, facade_sqm_suggestion, etc.)
- `POST /calculator` – body: `building_id`, `sub_type_of_retrofit`, optional `overrides`; returns payback and cost fields
- `GET /contractors?specialization=window` – contractors for window retrofit

## Design

Colors and layout follow the Figma file (HeatMyKiez); tokens are in `frontend/src/index.css` and `frontend/src/components/WizardLayout.css`.

## Team

- [Cynthia Dalmady](https://www.linkedin.com/in/cynthia-dalmady/)
- [Maciej Kodzis](https://www.linkedin.com/in/maciej-kodzis-9985837a/)
- [Nicolas Ibach](https://www.linkedin.com/in/nicolasibach/)
- [Sergej Kurtasch](https://www.linkedin.com/in/sergej-kurtasch/)
