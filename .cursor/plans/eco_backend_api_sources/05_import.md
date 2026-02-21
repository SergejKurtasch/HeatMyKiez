## 3. Загрузка данных при старте

Отдельный скрипт импорта не нужен. [data/buildings.csv](data/buildings.csv) и [data/retrofit_measures.csv](data/retrofit_measures.csv) загружаются при старте приложения в память; `address_slug` строится по [unified_building_schema.py](cursor_scripts/unified_building_schema.py) (`build_address_key`, нормализация: нижний регистр, пробелы → дефис, умлауты → ue/ae/oe).

---
