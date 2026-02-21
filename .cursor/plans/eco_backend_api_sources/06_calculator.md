## 4. Калькулятор мер реновации

**Цель:** по адресу взять данные о доме из Store ([data/buildings.csv](data/buildings.csv) в памяти), подобрать применимые меры из [data/retrofit_measures.csv](data/retrofit_measures.csv), рассчитать стоимость мер и снижение расходов на отопление.

**Логика:**

1. **Вход:** адрес здания (slug или building_id). Получение записи здания через BuildingStore (поля: construction_year, roof_type, insulation_walls/roof/basement, window_type, heating_system, total_area_m2, energy_consumption_kwh_m2, num_units и т.д.).
2. **Подбор мер:** по MeasureStore отфильтровать применимые меры: учёт `prerequisites` (roof_type, состояние утепления); исключать уже выполненные (например insulation_roof = Full — не предлагать «Roof insulation 24cm»).
3. **Расчёт по каждой мере:** стоимость (typical_cost_eur_m2 × площадь здания или apartment_area_m2 пользователя); экономия на отоплении — от energy_consumption_kwh_m2 и expected_savings_pct, при площади квартиры — экономия в €/год.
4. **Выход API:** здание + список применимых мер с полями: measure_id, measure_name, category, estimated_cost (€), estimated_savings_pct, estimated_savings_eur_per_year (если можно), subsidy_info (KfW/Bafa), **requires_whole_building_landlord** (boolean).
5. **Меры для всего здания:** категории Envelope (фасад, крыша, окна), Heating (котельная, теплонасос на здание), District heating — по умолчанию **requires_whole_building_landlord** = true; остальные (DIY, смарт-термостат, плёнка на окна и т.п.) — false, если не задано иное. На фронте: «Эту работу целесообразно проводить для всего здания с привлечением арендодателя».

### Источник формул: data/mock_data_combo.xlsx, вкладка Calculator

Логика расчётов калькулятора воспроизводит формулы с вкладки **Calculator** файла [data/mock_data_combo.xlsx](data/mock_data_combo.xlsx). Данные для расчёта берутся из **data/*.csv** (не из xlsx); из xlsx используются только формулы.

- **Вход калькулятора:** `building_id` (в таблице — B1) — ключ для выборки данных здания.
- **Связи данных:**
  - **buildings** (в таблице колонки 9, 10, 12, 13, 14, 17, 18, 19): num_units, total_area_m2, roof_type, facade_material, window_type, insulation_walls, insulation_roof, insulation_basement. Источник в проекте: [data/buildings.csv](data/buildings.csv) и BuildingStore.
  - **energy_consumption:** годовое потребление тепла по зданию — в таблице AVERAGE по 12 месяцам (колонка F) для данного building_id. В проекте: при наличии [data/energy_consumption.csv](data/energy_consumption.csv) — аналогичный расчёт; иначе energy_consumption_kwh_m2 × total_area_m2 и при необходимости цена тепла для перевода в €.
  - **retrofits:** для каждой меры — название (B), стоимость/коэффициент (E), доля экономии (H). В проекте: [data/retrofit_measures.csv](data/retrofit_measures.csv) — measure_name, typical_cost_eur_m2, expected_savings_pct.
  - **financials:** в таблице одно значение (L2) — цена тепла или базовые затраты на отопление. В проекте — константа или конфиг (например в .env или конфиге калькулятора).

Условие применимости меры (например «если window_type = Single-pane — показывать замену окон») согласовано с условными формулами в таблице (напр. IF(B4="Single-pane", retrofits!B15) и с полем `prerequisites` в retrofit_measures.

### Формулы расчёта (по листу Calculator) — актуальные ячейки из data/mock_data_combo.xlsx

| Результат | Ячейка | Формула в таблице | Реализация в API |
|-----------|--------|-------------------|-------------------|
| Building ID | B1 | ввод | address_slug / building_id |
| Площадь здания | B2 | `=VLOOKUP(B1,buildings!A2:Y9983,10,FALSE)` | BuildingStore: total_area_m2 |
| Число квартир | B3 | `=VLOOKUP(B1,buildings!A2:Y9983,9,FALSE)` | BuildingStore: num_units |
| Window | B4 | `=VLOOKUP(B1,buildings!A2:Y9983,14,FALSE)` | window_type |
| Roof Type | B5 | `=VLOOKUP(B1,buildings!A2:Y9983,12,FALSE)` | roof_type |
| Insulation | B6 | `=VLOOKUP(B1,buildings!A2:Y9983,18,FALSE)` | insulation_walls |
| Facade | B7 | `=VLOOKUP(B1,buildings!A2:Y9983,13,FALSE)` | facade_material |
| Insulation | B8 | `=VLOOKUP(B1,buildings!A2:Y9983,17,FALSE)` | insulation_roof |
| Basement Insulation | B9 | `=VLOOKUP(B1,buildings!A2:Y9983,19,FALSE)` | insulation_basement |
| Energy Costs (average) | B10 | массив/AVERAGE по энергозатратам за год | yearly_kwh × heat_price → yearly_eur |
| Коэффициент стоимости | E6 | 0.14 (Window to floor sqm ratio) | cost_factor (конфиг) |
| Субсидия, доля | D7/D8 | 0.6 | SUBSIDY_RATE |
| **По каждой мере (пример: строка 14):** | | | |
| Условие показа меры | B14 | `=IF(B4="Single-pane",retrofits!B15)` | _is_applicable (window_type, insulation_* и т.д.) |
| Стоимость меры, € | C14 | `=retrofits!E15*B2*E6` | typical_cost_eur_m2 × total_area_m2 × factor |
| Cost after subsidy (субсидия), € | D14 | `=C14*0.6` | cost × SUBSIDY_RATE → subsidy_eur |
| Экономия, €/год | E14 | `=B10*retrofits!H15` | yearly_eur × (expected_savings_pct/100) |
| Years for return | F14 | `=D14/E14` | в таблице: subsidy/savings; в API: payback = cost/savings_eur (классическая окупаемость) |

Дополнительно в таблице (строки 16–21): avg monthly rent/unit (C17=`financials!L2*B2/B3`), savings/month/unit (D17), 8% increase (C19), tenant savings (D19), yearly extra income (C20), years for return по аренде (C21). При необходимости можно вынести в отдельный endpoint или конфиг.

### Конфиг/константы

Для воспроизведения формул из таблицы нужны константы или конфиг (хранить в конфиге приложения или .env, не хардкодить в коде):

- коэффициент стоимости (аналог E6 в таблице, там 0.14);
- доля субсидии (0.6);
- цена тепла или базовые затраты на отопление (аналог financials!L2).

### Выход API (поля расчёта по мерам)

Здание + список применимых мер. Для каждой меры возвращать поля, соответствующие расчётам из таблицы:

- **estimated_cost** (€) — стоимость меры по формуле выше.
- **subsidy_eur** и/или **subsidy_pct** — субсидия (60% в таблице; в API можно возвращать и сумму, и процент).
- **estimated_savings_eur_per_year** — экономия на отоплении в €/год.
- **payback_years** (опционально) — окупаемость в годах (cost / annual_benefit).
- **requires_whole_building_landlord** — без изменений.
- Остальные: measure_id, measure_name, category, estimated_savings_pct, subsidy_info (KfW/Bafa).

**API:** GET /api/building/:address/calculator (или GET /api/calculator?address_slug=…) — данные здания и массив расчётов по мерам с полем `requires_whole_building_landlord`. Опционально: user_id или apartment_area_m2 — для персонального расчёта доли по квартире.

**Фронт:** экран калькулятора: выбор/ввод адреса → загрузка здания и мер из API; раздельно показывать меры DIY/квартирные и меры «для всего здания — нужна договорённость с арендодателем». При залогиненном пользователе подставлять площадь квартиры из профиля.

---
