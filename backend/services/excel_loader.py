"""
Load and cache Excel data from data/mock_data_combo.xlsx.
Uses same sheet and column names as plan (buildings, financials, energy_consumption, retrofits, parameters, contractors).
"""
from pathlib import Path

import pandas as pd

# In-memory cache
_data = {}


def get_data_path() -> Path:
    base = Path(__file__).resolve().parent.parent.parent
    return base / "data" / "mock_data_combo.xlsx"


def load_excel_data() -> None:
    path = get_data_path()
    if not path.exists():
        raise FileNotFoundError(f"Excel file not found: {path}")
    try:
        with pd.ExcelFile(path, engine="openpyxl") as xl:
            _data["buildings"] = pd.read_excel(xl, sheet_name="buildings", nrows=12000)
            _data["financials"] = pd.read_excel(xl, sheet_name="financials", nrows=12000)
            _data["energy_consumption"] = pd.read_excel(xl, sheet_name="energy_consumption", nrows=20000)
            _data["retrofits"] = pd.read_excel(xl, sheet_name="retrofits")
            _data["parameters"] = pd.read_excel(xl, sheet_name="parameters")
            _data["contractors"] = pd.read_excel(xl, sheet_name="contractors")
    except Exception as e:
        raise RuntimeError(f"Failed to load Excel: {e}") from e


def get_buildings():
    if "buildings" not in _data:
        load_excel_data()
    return _data["buildings"]


def get_financials():
    if "financials" not in _data:
        load_excel_data()
    return _data["financials"]


def get_energy_consumption():
    if "energy_consumption" not in _data:
        load_excel_data()
    return _data["energy_consumption"]


def get_retrofits():
    if "retrofits" not in _data:
        load_excel_data()
    return _data["retrofits"]


def get_parameters():
    if "parameters" not in _data:
        load_excel_data()
    return _data["parameters"]


def get_contractors():
    if "contractors" not in _data:
        load_excel_data()
    return _data["contractors"]
