# 🧠 Chatbot: Persistencia e Historial

## 🚀 Nuevas Características

### 1. Persistencia de Sesión
El historial del chat ahora se guarda automáticamente en `localStorage`.
- **Beneficio:** Si el usuario actualiza la página o navega fuera y vuelve, **la conversación se mantiene intacta**.
- **Clave:** `adis_chat_mensajes`.
- **Manejo de fechas:** Se restaura correctamente el objeto `Date` desde el JSON almacenado.

### 2. Botón "Limpiar Conversación"
Se añadió un botón de papelera en la esquina superior derecha del chat.
- **Funcionalidad:**
    - Pide confirmación.
    - Borra el historial almacenado.
    - Reinicia el chat al mensaje de bienvenida y botones iniciales.
- **Diseño:** Sutil, solo visible al hover con color rojo de advertencia.

## 🛠️ Detalles Técnicos
- **Hooks:** Se implementó `useEffect` para la carga inicial (sólo en cliente para evitar hydration mismatch) y para guardar cambios posteriores en el array `mensajes`.
- **Componentes:** Se modificó `ChatbotInteractivo.tsx` integrando `FaTrash` de `react-icons/fa`.

## ✅ Estado Actual
El chatbot ahora es:
1. **Persistente** (no pierde datos).
2. **Navegable** (abre sidebar sin refesc).
3. **Inteligente** (NLU mejorado).
4. **Híbrido** (Texto + Botones).
