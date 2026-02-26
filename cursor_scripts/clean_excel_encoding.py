"""
One-off script: fix German umlaut/eszett mojibake in data/mock_data_combo.xlsx
and overwrite the file. Run from project root: python cursor_scripts/clean_excel_encoding.py
"""
import sys
from pathlib import Path

import pandas as pd

# Project root (script lives in cursor_scripts/)
ROOT = Path(__file__).resolve().parent.parent
EXCEL_PATH = ROOT / "data" / "mock_data_combo.xlsx"

MOJIBAKE_TO_UTF8 = {
    "Ã¶": "ö",
    "Ã¤": "ä",
    "Ã¼": "ü",
    "ÃŸ": "ß",
    "Ã„": "Ä",
    "Ã–": "Ö",
    "Ãœ": "Ü",
}


def fix_str(val):
    if not isinstance(val, str) or pd.isna(val):
        return val
    s = val
    for bad, good in MOJIBAKE_TO_UTF8.items():
        s = s.replace(bad, good)
    return s


def fix_df(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].apply(lambda x: fix_str(x) if pd.notna(x) else x)
    return df


def main():
    if not EXCEL_PATH.exists():
        print(f"File not found: {EXCEL_PATH}", file=sys.stderr)
        sys.exit(1)
    print(f"Reading {EXCEL_PATH} ...")
    with pd.ExcelFile(EXCEL_PATH, engine="openpyxl") as xl:
        sheet_names = xl.sheet_names
        sheets = {name: pd.read_excel(xl, sheet_name=name) for name in sheet_names}
    for name, df in sheets.items():
        fix_df(df)
        print(f"  Fixed sheet: {name}")
    print(f"Writing {EXCEL_PATH} ...")
    with pd.ExcelWriter(EXCEL_PATH, engine="openpyxl") as writer:
        for name, df in sheets.items():
            df.to_excel(writer, sheet_name=name, index=False)
    print("Done.")


if __name__ == "__main__":
    main()
