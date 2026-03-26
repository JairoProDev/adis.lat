# AI Runbook

## Endpoints
- Chat unificado: `/api/ai/chat`
- Métricas: `/api/ai/metrics`
- Evaluación: `/api/ai/evaluate`
- Drafts publicación: `/api/ai/publish-draft`

## Incidentes comunes

### 1) `OPENAI_API_KEY` ausente
- Síntoma: fallback heurístico, menor calidad semántica.
- Acción: configurar variable de entorno y reiniciar.

### 2) Presupuesto agotado
- Síntoma: respuesta con warning de budget guard.
- Acción: elevar `AI_DAILY_BUDGET_USD` o optimizar prompts/modelos.

### 3) Alta latencia
- Revisar `/api/ai/metrics`.
- Confirmar estado RPC `match_adisos_hybrid`.
- Reducir `maxResults` temporalmente.

### 4) Cero resultados frecuentes
- Ejecutar `/api/ai/evaluate`.
- Revisar cobertura de embeddings y job de generación.
- Validar re-ranker/fallback keyword.

## Checklist de release IA
- Verificar budget guard.
- Verificar rate limiting.
- Verificar dashboard admin.
- Correr evaluación base.
- Probar publicación asistida con draft y commit.
