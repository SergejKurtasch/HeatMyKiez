## 2. Backend (FastAPI)

Эндпоинты используют слой Store (CSV и память). Контракт API неизменен.

- **GET /api/building/:address** — `address` = slug (например `10317-landsberger-allee-36`). Поиск через BuildingStore по `address_slug`. Данные зданий из [data/buildings.csv](data/buildings.csv) (в памяти). При отсутствии — 404.
- **GET /api/buildings/search** — автодополнение: query (часть адреса/улицы/индекса), limit. Поиск через BuildingStore. Возврат списка `{ id, building_id, address_slug, display_address, latitude, longitude }`.
- **Каскадный выбор адреса (индекс → улицы → номера домов):** данные только из [data/buildings.csv](data/buildings.csv). **GET /api/buildings/streets?postal_code=…** — список уникальных улиц для данного индекса (BuildingStore.get_streets_by_postal_code). **GET /api/buildings?postal_code=…&street=…** — список зданий (номера домов) для пары индекс+улица (BuildingStore.list_by_postal_code_and_street); ответ: массив `{ id, building_id, address_slug, display_address, latitude, longitude }`. Фронт: сначала ввод индекса → запрос улиц → выбор улицы → запрос домов → выбор дома → получение building_id/address_slug.
- **POST /api/ai-recommendations** — тело: `building_id` или данные здания. Загрузка здания через BuildingStore, подбор применимых мер через MeasureStore (та же логика, что в калькуляторе). В промпт: данные здания + список применимых мер (measure_id, measure_name, category, cost, expected_savings_pct). ИИ выбирает 3 DIY (100€/200€/300€) и 3 капитальных меры **только из этого списка**; для общедомовых — пометка «для всего здания с привлечением арендодателя». Ответ сохранять через RecommendationStore (payload JSON), возврат клиенту.
- **POST /api/users** — регистрация: `name`, `email`, `building_id`. Опционально: `warmmiete`, `kaltmiete`, `apartment_area_m2` (при обновлении — `profile_updated_at`). Создание через UserStore. После вставки: через UserStore подсчитать пользователей по `building_id`; если count > 1 — логировать «письмо соседям» (без реальной отправки).
- **PATCH /api/users/:id** (или **PUT**) — обновление профиля (warmmiete, kaltmiete, apartment_area_m2); при изменении этих полей обновлять `profile_updated_at` через UserStore.
- Эндпоинты для заявок: **POST /api/requests** (создание/обновление заявки по user_id/building_id), **GET /api/requests** (список для пользователя или по зданию) — через RequestStore.
- **Калькулятор (см. раздел ниже):** GET /api/building/:address/calculator или GET /api/calculator?address_slug=… — возврат здания (BuildingStore) + применимые меры (MeasureStore) с расчётом стоимости и экономии на отоплении.

Секреты (OpenAI API key и др.) — из `.env`.

---
