## 0. Фаза MVP: фронтенд по макету из Figma

**Стратегия:** собрать рабочий MVP с фронтендом по дизайну из **Figma**. Макет: [Eco UI (Untitled Copy)](https://www.figma.com/design/moChaqh8shWNCiTzTCVhBA/Untitled--Copy-?node-id=0-1). В макете: бренд **ViabCheck**, слоган «Figure out how to finance insulating your building without losing money», визард из 4 шагов (степпер 1–2–3–4), шаг 1 — адрес (Postcode, Street, Number, City), шаг 2 — «define retrofits needed» (Address, Building Details, Apartment Details, Kaltmiete), шаг 3 — «retrofit suggestion» (калькулятор мер). Весь UI (подписи, сообщения), код и комментарии — на английском.

- **Фаза 0 (MVP):** FastAPI — единственный источник логики; все сценарии реализованы в API (поиск здания, калькулятор, рекомендации, регистрация). **Фронтенд** — реализация экранов по макету Figma (компоненты, отступы, типографика — через Figma MCP при разработке); тонкий клиент к FastAPI: формы и отображение ответов API, без дублирования бизнес-логики. Размещение: например `frontend/` в репозитории.
- **Контракт API:** описать или зафиксировать форматы запросов/ответов (в плане или OpenAPI); фронт подключается к тем же эндпоинтам без изменений бэкенда.
- **Figma:** при вёрстке использовать [макет](https://www.figma.com/design/moChaqh8shWNCiTzTCVhBA/Untitled--Copy-?node-id=0-1) и при необходимости Figma MCP для точного соответствия дизайну (компоненты, отступы, типографика).

---
