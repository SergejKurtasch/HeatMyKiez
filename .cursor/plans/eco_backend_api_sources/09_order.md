## 7. Порядок реализации (рекомендуемый)

1. **Форматы CSV и слой Store:** описать структуру data/users.csv, data/requests.csv, data/recommendations.csv. Реализовать Store-интерфейсы и CSV-реализации: загрузка buildings и retrofit_measures в память при старте, расчёт address_slug; чтение/запись users, requests, recommendations в CSV (с блокировкой при записи при необходимости).
2. **FastAPI:** GET /api/building/:address, GET /api/buildings/search (через BuildingStore).
3. POST /api/users (с полями профиля), PATCH /api/users/:id (warmmiete, kaltmiete, apartment_area_m2, profile_updated_at) + логика «соседи» (логи в консоль через UserStore).
4. **Калькулятор:** GET /api/building/:address/calculator — BuildingStore + MeasureStore, расчёт стоимости и экономии на отоплении.
5. POST /api/ai-recommendations: подбор применимых мер по данным здания, промпт ИИ (3 DIY + 3 общедомовые), сохранение через RecommendationStore (payload с measure_id).
6. Эндпоинты для requests (создание/чтение через RequestStore).
7. **Фаза 0 — MVP фронтенд по Figma:** реализация экранов по [макету Figma](https://www.figma.com/design/moChaqh8shWNCiTzTCVhBA/Untitled--Copy-?node-id=0-1) (frontend/): ViabCheck-брендинг, визард 4 шагов (шаг 1 — Postcode/Street/Number/City; шаг 2 — define retrofits needed; шаг 3 — retrofit suggestion/калькулятор; шаг 4 — по макету), подключение ко всем эндпоинтам FastAPI; зафиксировать контракт API (OpenAPI). При вёрстке использовать Figma MCP для соответствия дизайну.
---
