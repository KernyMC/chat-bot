# Mi Contador de Bolsillo
## Interact2Hack 2026 · Reto IA DeUna · USFQ

---

## Lo que DeUna ya tiene y no está usando

DeUna tiene **620,000 comercios afiliados** y **más de 6 millones de usuarios**. Cada cobro que registra ese comerciante — la hora, el monto, quién pagó — es un dato que ningún banco en Ecuador tiene de forma tan granular, en tiempo real, y sin que el tendero tenga que hacer nada.

El problema no es que falten datos. El problema es que esos datos hoy no le hablan al comerciante. El tendero abre DeUna, cobra $12.50, y cierra la app. No sabe si hoy vendió más o menos que el martes pasado. No sabe que tiene 3 clientes que llevan 45 días sin volver. No sabe que ya lleva 16 meses de historial digital — 4 meses más de lo que Banco Pichincha exige para aprobar un crédito hasta $20,000 sin ir a una agencia.

**Mi Contador de Bolsillo convierte ese historial silencioso en conversaciones que generan acción.**

---

## El problema de negocio real para DeUna

### 1. El comerciante usa DeUna como si fuera solo un código QR

La adopción de herramientas digitales en microcomercio ecuatoriano es *supply-driven*: el comerciante adoptó DeUna porque alguien se lo ofreció, no porque entienda el valor de sus datos. La literacidad financiera digital no mejora automáticamente los resultados del negocio — lo confirma la literatura académica sobre adopción de fintech en mercados emergentes [1][2].

**Consecuencia directa para DeUna:** el comerciante que no siente que DeUna le aporta nada más allá del cobro, migra a la primera app que le ofrezca el mismo servicio con menos fricción. PayPhone ya tiene Tap to Phone. Kushki está expandiendo. La amenaza de churn es real.

### 2. El churn de comercios sale muy caro

En plataformas de pagos digitales en Latinoamérica, retener un comercio existente cuesta entre **5x y 25x menos** que adquirir uno nuevo [3]. Una mejora del 5% en retención se traduce en un aumento de entre **25% y 95% en rentabilidad** [4].

Si DeUna tiene 620,000 comercios y asume una tasa de churn de solo el 8% anual, eso son **~50,000 comercios perdidos cada año**. Si recuperar o retener a uno solo de ellos cuesta $50 menos que adquirir uno nuevo, el impacto potencial supera los **$2.5M anuales** solo en costo evitado de adquisición.

Un comerciante que recibe alertas accionables de su propio negocio desde DeUna tiene un incentivo real para quedarse. Sus 16 meses de historial son un activo que pierde si se va a otra plataforma.

### 3. El crédito es el producto de mayor margen — y DeUna tiene la llave

Banco Pichincha otorga más del **50% de los microcréditos del sector bancario en Ecuador** [5] y tiene el primer microcrédito **100% digital de la región** (Premio Qorus/Accenture): sin agencia, en minutos desde el celular [6].

El problema histórico del microcrédito en Ecuador es de información asimétrica: el banco no puede evaluar al tendero informal porque no hay datos de flujo de caja formales. **DeUna tiene esos datos.** El tendero que lleva 16 meses cobrando por DeUna supera el umbral mínimo de 12 meses que Banco Pichincha exige para su Crédito para Negocio y Emprendedores (hasta $20,000, 100% digital). Tiene más información bancaria útil que muchos negocios que llegan con carpetas de papel.

La propia DeUna lo declaró oficialmente: *"La conexión con esta forma de pago permite a las personas construir un historial crediticio, facilitando el acceso a crédito y otros productos financieros."* [7]

**Mi Contador de Bolsillo detecta cuándo un comerciante supera los 12 meses de historial activo y lo notifica. El comerciante toca un link. Banco Pichincha aprueba en minutos desde el celular. DeUna recibe el reconocimiento como el canal que lo hizo posible — y el comerciante no se va a ningún lado.**

---

## La propuesta de valor en números

### Para el comerciante

| Métrica | Tienda Don Aurelio | Fonda Don Jorge | Salón Belleza Total |
|---|---|---|---|
| Ingresos anuales (datos reales) | $49,822 | $25,773 | $55,580 |
| Crédito accesible (Banco Pichincha) | hasta $20,000 | hasta $20,000 | hasta $20,000 |
| Uplift estimado con cobro por tarjeta | +$623/mes | +$322/mes | +$1,019/mes |
| Meses de historial en DeUna | 16 (mín. exigido: 12) | 16 (mín. exigido: 12) | 16 (mín. exigido: 12) |

El uplift de tarjeta es conservador (15–22% sobre el promedio mensual real). En Ecuador, **el 74% de los pagos digitales se hacen con tarjeta y solo el 6% con billeteras** [8]. El comerciante que hoy solo acepta QR está fuera de mercado para 7 de cada 10 compradores digitales.

### Para DeUna

| Palanca | Mecanismo | Impacto potencial |
|---|---|---|
| Retención de comercios | El comerciante que recibe insights de sus datos no migra — pierde su historial | Reducción de churn; ahorro de 5-25x en readquisición |
| Crédito habilitado | DeUna como canal de calificación → Banco Pichincha origina → comerciante queda en el ecosistema | Comisión por originación + stickiness del comercio post-crédito |
| Volumen de transacciones | Cobro con tarjeta (DeUna Negocios) → más TPV → más comisión de intercambio | Cada % de uplift en TPV impacta directo en fee revenue |
| Data lock-in competitivo | 16 meses de historial = barrera de salida real. El tendero no migra porque pierde sus insights | Ventaja estructural sobre PayPhone, Kushki y entrantes |

---

## Por qué esto funciona donde otros chatbots financieros fallaron

Las barreras documentadas a la adopción de herramientas financieras digitales en microcomercio son tres [1][2][9]:

1. **Miedo a la visibilidad fiscal** — el cuaderno de papel es opaco. Una app que registra todo "los asusta".
2. **Desconfianza en plataformas externas** — ¿por qué darle mis datos a alguien que no conozco?
3. **Baja literacidad financiera** — los dashboards, métricas y porcentajes no significan nada.

**Mi Contador de Bolsillo evita las tres:**

- No le pedimos al tendero que registre nada. DeUna ya captura los datos con cada cobro.
- No es una plataforma externa — es DeUna, que ya usa y en la que ya confía.
- No le mostramos dashboards. Le mandamos un mensaje cuando algo importa: *"Oe veci, este sábado llevas $11.50 — normalmente cierras en $95. ¿Revisamos qué pasó?"*

La investigación sobre nudges proactivos en plataformas financieras muestra reducciones de tasas de default superiores al **50%** cuando los usuarios reciben alertas contextuales en lugar de información pasiva [10]. El efecto es mayor precisamente en usuarios de baja literacidad financiera: no necesitan entender, solo reaccionar.

El precedente más directo es **PayPal Working Capital**: PayPal usó el historial de transacciones de sus comercios para predecir riesgo crediticio y ofrecer capital de trabajo sin aval. Los comercios PayPal que accedieron a crédito aumentaron su volumen de ventas en promedio un 22% [11]. DeUna tiene la misma ventaja de datos — aún sin usarla.

---

## Lo que construimos

Un agente conversacional que corre sobre los datos que DeUna **ya tiene** de cualquier comerciante desde su primer cobro. Sin catálogo. Sin configuración. Sin que el tendero haga nada diferente.

**Lo que puede responder en menos de 5 segundos:**
- ¿Cuánto vendí esta semana vs la semana pasada?
- ¿Qué clientes no han vuelto en el último mes?
- ¿Cuándo es mi hora pico los viernes?
- ¿Cuánto le pago al proveedor de Pilsener al mes?
- ¿Puedo acceder a un crédito con mi historial?

**Lo que hace sin que el comerciante pregunte:**
- Detecta caídas de venta inusuales y alerta en tiempo real
- Identifica cuándo el comerciante ya califica para crédito digital de Banco Pichincha
- Informa sobre DeUna Negocios (cobro con tarjeta desde el celular) con el potencial de ingreso personalizado por negocio

**Lo que no hace:**
- No inventa datos. Solo responde con lo que DeUna ya capturó.
- No requiere que el tendero cambie su comportamiento.
- No reemplaza a DeUna — la convierte en herramienta de gestión, no solo de cobro.

---

## El ángulo estratégico para el pitch

> "DeUna ya es el datáfono del tendero ecuatoriano. La pregunta es si va a seguir siendo solo eso, o si va a convertirse en el asesor de negocio que ningún tendero puede pagar pero todos necesitan."

La ventana de oportunidad es estrecha: PayPhone tiene Tap to Phone, Kushki está escalando, y el ISD del 5% es el único moat fiscal temporal que protege a las plataformas nacionales. El comercio informal ecuatoriano va a digitalizarse con o sin DeUna — la pregunta es quién captura ese valor.

Un comerciante con 16 meses de historial en DeUna, acceso a crédito a través de Banco Pichincha, y alertas semanales de su negocio, **no se va a ningún lado**. Eso es retención estructural, no loyalty points.

---

## Respaldo de investigación

1. Aker, J.C. & Mbiti, I.M. (2010). Mobile phones and economic development in Africa. *Journal of Economic Perspectives* — adopción digital sin mejora de resultados financieros en mercados emergentes.
2. Murendo, C. et al. (2018). Mobile money adoption and usage in Uganda — barreras conductuales en adopción fintech informal.
3. Bain & Company. (2020). *The Economics of Loyalty* — costo de adquisición vs retención en plataformas de pagos LatAm.
4. Reichheld, F. (2001). Prescription for cutting costs. *Harvard Business Review* — retención 5% → rentabilidad +25-95%.
5. Banco Pichincha, Informe de Gestión 2024 — >50% de microcréditos del sector bancario Ecuador.
6. Banco Pichincha Blog (2024). Microcrédito digital: premio Qorus/Accenture a la innovación — primer microcrédito 100% digital de la región.
7. El Universo (2025). PeiGo y DeUna, las fintech de pagos digitales ganan terreno en bancarización — declaración oficial DeUna sobre historial crediticio.
8. BCE / Cámara de Comercio de Quito (2024). Estadísticas de medios de pago electrónicos Ecuador — wallets 6%, tarjetas 74% del e-commerce.
9. Babatz, G. (2013). Sustained effort, not technology, is key to digitizing payments in Mexico — barreras conductuales en microcomercio informal.
10. Karlan, D. et al. (2016). Getting to the top of mind: How reminders increase saving. *Management Science* — nudges proactivos reducen default >50%.
11. PayPal Working Capital, Internal Case Study (2014) — comercios con acceso a capital de trabajo aumentaron TPV promedio 22%.

---

*Equipo USFQ · Interact2Hack 2026 · Reto IA DeUna*
