# AI Governance: Buscadis

## Objetivos
- Unificar experiencia de chat y búsqueda inteligente.
- Controlar costo/latencia/calidad con métricas objetivas.
- Operar IA con fallback seguro.

## KPIs
- `search_success_rate`
- `zero_result_rate`
- `publish_assist_completion_rate`
- `ai_error_rate`
- `tool_failure_rate`
- `ai_cost_usd_per_session`

## SLOs iniciales
- p95 latencia chat <= 2500 ms en búsquedas.
- error rate <= 2%.
- cero caídas completas ante falla de proveedor IA (degradación a heurístico).

## Contratos de herramientas
- `search_marketplace_tool`: query, category?, location? -> resultados.
- `publish_assistant_tool`: texto/imagen -> draft editable.
- `vision_tool`: imageUrl -> atributos + borrador.
- `recommendation_tool`: session/user -> sugerencias.

## Presupuesto y límites
- `AI_DAILY_BUDGET_USD` controla gasto diario.
- Rate limit por IP en `/api/ai/chat`.
- Budget guard corta funciones premium y activa fallback.

## Observabilidad
- Eventos vía `trackAIEvent`.
- Dashboard: `/admin/ai`.
- API métricas: `/api/ai/metrics`.

## Evaluación
- Dataset inicial en `lib/ai/evaluation.ts`.
- Endpoint de sanity: `/api/ai/evaluate`.
- Experimentación A/B con header `x-ai-variant`.
