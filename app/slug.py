"""
Address slug normalization: postal_code + street + house_num.
Lowercase, spaces to dash, umlauts to ue/oe/ae.
"""

import re
from typing import Any


def _normalize_part(value: Any) -> str:
    """Normalize a string for slug: lowercase, spaces to dash, umlauts expanded."""
    if value is None or (isinstance(value, float) and (value != value)):  # NaN
        return ""
    s = str(value).strip().lower()
    # Replace umlauts
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = s.replace("ß", "ss")
    # Non-alphanumeric to single dash, collapse dashes
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def build_address_slug(postal_code: Any, street: Any, house_num: Any) -> str:
    """
    Build address slug from postal_code, street, house_num.
    Example: 10317, Landsberger Allee, 36 -> 10317-landsberger-allee-36
    """
    parts = [
        _normalize_part(postal_code) or "0",
        _normalize_part(street) or "unknown",
        _normalize_part(house_num) or "0",
    ]
    return "-".join(p for p in parts if p)
