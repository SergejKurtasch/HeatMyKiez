"""
Parse buildings.address into street and number for cascading dropdowns.
Address format in Excel: e.g. "Zehlendorfer Str. 43", "Landsberger Allee 36".
"""
import re
from typing import List, Tuple

import pandas as pd


def parse_address(address: str) -> Tuple[str, str]:
    """
    Split address into (street, number).
    Assumes last token(s) that look like a house number are the number; rest is street.
    """
    if not address or not isinstance(address, str):
        return ("", "")
    s = address.strip()
    if not s:
        return ("", "")
    # Match trailing house number (digits, optional letter: 43, 43a, 36)
    m = re.match(r"^(.+?)\s+(\d+\s*[a-zA-Z]?)\s*$", s)
    if m:
        street = m.group(1).strip()
        number = m.group(2).strip()
        return (street, number)
    return (s, "")


def get_unique_streets_for_postcode(df_buildings, postal_code: str) -> List[str]:
    """Return sorted list of unique street names for given postal_code."""
    col_postal = "postal_code"
    col_addr = "address"
    if col_postal not in df_buildings.columns or col_addr not in df_buildings.columns:
        return []
    subset = df_buildings[df_buildings[col_postal].astype(str).str.strip() == str(postal_code).strip()]
    streets = set()
    for _, row in subset.iterrows():
        addr = row.get(col_addr)
        if pd.isna(addr):
            continue
        street, _ = parse_address(str(addr))
        if street:
            streets.add(street)
    return sorted(streets)


def get_unique_numbers_for_street(
    df_buildings, postal_code: str, street: str
) -> List[str]:
    """Return sorted list of unique house numbers for given postal_code and street."""
    col_postal = "postal_code"
    col_addr = "address"
    if col_postal not in df_buildings.columns or col_addr not in df_buildings.columns:
        return []
    subset = df_buildings[df_buildings[col_postal].astype(str).str.strip() == str(postal_code).strip()]
    numbers = set()
    for _, row in subset.iterrows():
        addr = row.get(col_addr)
        if pd.isna(addr):
            continue
        s, num = parse_address(str(addr))
        if s.strip() == street.strip() and num:
            numbers.add(num)
    def _num_key(x):
        m = re.match(r"\d+", str(x))
        return (int(m.group()) if m else 0, str(x))
    return sorted(numbers, key=_num_key)
