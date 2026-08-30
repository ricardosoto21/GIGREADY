# GigReady — Plan comercial y salida a mercado

**Versión:** 1.0  
**Fecha:** 17 de julio de 2026  
**Horizonte:** primeros 12 meses  
**Mercado inicial:** DJs que usan Windows + Rekordbox

## 1. Decisión ejecutiva

GigReady debe salir al mercado como una herramienta de **preparación y control previo al show**, no como un organizador genérico de música ni como otro analizador de BPM y tonalidad.

La promesa comercial recomendada es:

> GigReady revisa tu música antes de tocar, detecta riesgos, sugiere puntos de mezcla y prepara una exportación para Rekordbox sin modificar tus originales.

La salida recomendada tiene dos productos, pero no deben construirse al mismo tiempo:

1. **GigReady Desktop:** producto principal inicial, Windows, procesamiento local, pago único y escaneos ilimitados.
2. **GigReady Cloud:** segunda etapa, suscripción, cuenta web y procesamiento mediante navegador compatible o un pequeño agente local. El audio permanece local y se sincronizan resultados, historial y configuración.

La prioridad comercial no es construir una aplicación web completa. Es conseguir primero entre 30 y 50 usuarios beta activos, comprobar ahorro de tiempo, completar la importación real en Rekordbox y lograr las primeras 20 ventas sin depender de grandes descuentos.

## 2. Diagnóstico del producto actual

### Fortalezas vendibles hoy

- Escaneo local de carpetas, pendrives y discos externos.
- Validación técnica con FFprobe.
- Identificación de problemas críticos, advertencias y duplicados.
- Perfiles de energía por género.
- Sugerencia, escucha, ajuste y aprobación de memory cues.
- Creación de carpeta limpia sin mover los originales.
- Conversión a MP3, WAV y AIFF.
- Exportación M3U/M3U8 y Rekordbox XML con cues aprobados y estrellas.
- Historial y registros locales.
- Enfoque no destructivo y local-first.

### Estado técnico verificado

El 17 de julio de 2026 se ejecutaron correctamente:

- Typecheck de TypeScript.
- Lint sin advertencias.
- 13 archivos de pruebas.
- 82 pruebas aprobadas.

Esto demuestra una buena base de ingeniería, pero no reemplaza el QA humano con bibliotecas y equipos reales.

### Bloqueos antes de una venta pública

1. QA manual completo en Windows 10 y Windows 11.
2. Prueba con Rekordbox real de XML, estrellas y memory cues.
3. Prueba con carpetas reales de 1.000 o más pistas.
4. Firma de código o distribución mediante Microsoft Store.
5. Licenciamiento y activación comercial.
6. Política de privacidad, reembolso, soporte y términos comerciales.
7. Telemetría mínima y voluntaria para conocer activación, errores y conversión.
8. Sitio bilingüe español/inglés con capturas y demo reales.
9. Evidencia cuantitativa de ahorro de tiempo y utilidad de cues.

Una aplicación Windows sin firma enfrenta una fricción comercial seria: Microsoft explica que una aplicación no firmada puede mostrar “Windows protegió tu PC”, y que ciertas políticas pueden impedir continuar. La Microsoft Store evita esa advertencia; para distribución directa, Microsoft recomienda Artifact Signing y una identidad de editor consistente.

## 3. Estudio competitivo

Precios observados al 17 de julio de 2026. Pueden variar por país, impuestos o promociones.

| Producto | Modelo y precio observado | Promesa principal | Implicación para GigReady |
|---|---:|---|---|
| GreenGo Pro | US$24,95 pago único | Importar, analizar BPM/key, etiquetar y convertir en Windows | Competidor de precio bajo. GigReady no debe competir por descargas o BPM; debe vender preflight, riesgo, cues revisables y exportación segura. |
| Mixed In Key | Aproximadamente US$58 pago único | Tonalidad, BPM, energía y cue points | Es el ancla de confianza en análisis musical. GigReady puede situarse cerca de este precio cuando demuestre precisión y ahorro. |
| beaTunes | €34,95 pago único | Analizar, inspeccionar y organizar bibliotecas | Confirma que las utilidades desktop se compran como herramienta especializada. |
| OneTagger | Gratis y open source | Metadata, etiquetas, energía y renombrado | Obliga a que “ordenar metadata” no sea la propuesta principal de pago. |
| MIXO Gold | US$7/mes | Sincronización cloud, conversión entre apps y herramientas de biblioteca | Referencia inferior para una suscripción individual con nube. |
| rekordbox | Core US$12/mes; Creative US$18/mes en pago mensual | Ecosistema completo de preparación y performance | Es tanto plataforma de destino como sustituto parcial. GigReady debe complementar, no intentar reemplazar Rekordbox. |
| Lexicon | Conversión gratuita; Essential y Ultimate con pago recurrente o lifetime | Gestión profunda y conversión entre aplicaciones DJ | Competidor amplio. GigReady gana si ofrece un trabajo específico más simple: revisar una carpeta y dejarla lista. |

### Lectura del mercado

- Existe disposición a pagar por utilidades desktop de aproximadamente US$25–58.
- Existe disposición a pagar desde US$7/mes por sincronización y flujos cloud.
- También existe fatiga de suscripciones en comunidades DJ. Cobrar una suscripción solo para alquilar el mismo escáner local sería una propuesta débil.
- Las herramientas gratuitas cubren metadata, renombrado y parte del análisis. El precio de GigReady debe justificarse con reducción de riesgo, compatibilidad, tiempo recuperado y un flujo completo.
- Un nuevo competidor de bajo precio puede copiar una lista de funciones. Es más difícil copiar una reputación de confiabilidad, datasets de validación, casos reales y una comunidad de usuarios.

### Espacio defendible

GigReady debe apropiarse de la categoría:

**Pre-performance music preflight para DJs.**

El equivalente mental es un checklist técnico automatizado antes de despegar:

1. Selecciona música.
2. GigReady revisa.
3. El DJ decide.
4. GigReady prepara la salida.
5. Rekordbox importa.

## 4. Cliente ideal

### Segmento de entrada

**DJ profesional o semiprofesional de eventos, open format o residencia, que usa Windows y Rekordbox, incorpora música todas las semanas y trabaja con entre 500 y 10.000 pistas.**

Características:

- Tiene una consecuencia real si una pista falla en cabina.
- Prepara música con frecuencia, no una sola vez al año.
- Usa carpetas, discos o pendrives locales.
- Dedica tiempo a revisar cues, duplicados, formatos y nombres.
- Puede pagar US$49–69 si recupera una o dos horas.

### Orden de segmentos

1. DJs móviles, bodas, corporativos y open format.
2. DJs residentes y de club que incorporan música semanalmente.
3. Escuelas y academias de DJ.
4. Equipos de eventos que estandarizan bibliotecas.
5. Productores que actúan en vivo.

### Segmentos que no deben dominar el lanzamiento

- DJs exclusivamente macOS: el producto actual no los puede servir.
- Usuarios exclusivamente Serato, Traktor, Engine DJ o VirtualDJ.
- Principiantes con bibliotecas pequeñas y baja urgencia.
- Usuarios que solo buscan descargar música o detectar BPM/key.

### Geografía e idioma

- Empezar la beta en español permite soporte cercano y entrevistas rápidas.
- El mercado comercial debe ser bilingüe desde la versión 1.0: español e inglés.
- No invertir en publicidad internacional mientras la aplicación, el onboarding y el soporte no estén disponibles en inglés.

## 5. Posicionamiento y mensajes

### Declaración de posicionamiento

Para DJs que preparan música local para Rekordbox y no quieren descubrir problemas en cabina, GigReady es un asistente de revisión previa al show que detecta riesgos, duplicados y problemas de compatibilidad, sugiere memory cues y prepara una exportación revisable. A diferencia de los taggers o analizadores genéricos, GigReady combina control técnico, preparación musical y un flujo no destructivo orientado al momento de tocar.

### Mensaje principal

**Revisa tu música antes de tocar.**

Subtítulo recomendado:

**Detecta archivos problemáticos, duplicados y riesgos; revisa memory cues y exporta a Rekordbox sin modificar tus originales.**

### Tres beneficios que deben repetirse

1. **Evita sorpresas:** encuentra problemas antes de la cabina.
2. **Recupera tiempo:** automatiza la primera revisión de cada carpeta.
3. **Mantén el control:** GigReady sugiere; el DJ aprueba.

### Lo que no se debe prometer

- Cero fallos garantizados.
- Cues perfectos o completamente automáticos.
- Compatibilidad con equipos o aplicaciones no probadas.
- Reparación de una base de datos o pendrive ya corrupto.
- Reemplazo de Rekordbox.

## 6. Arquitectura de oferta y precios

### 6.1 GigReady Desktop

#### Beta privada

- **Precio:** gratis.
- **Duración:** cuatro a seis semanas.
- **Cupo:** 30–50 testers seleccionados.
- **Compromiso:** completar protocolo, permitir medición de tiempo y entregar feedback.

No cobrar durante una beta en la que siguen pendientes la firma, QA real y validación de Rekordbox.

#### Founders Edition

- **Precio recomendado:** US$39 pago único.
- **Cupo:** primeras 100 licencias o 30 días, lo que ocurra antes.
- **Incluye:** GigReady Desktop 1.x, actualizaciones de 1.x y precio preferente para la próxima versión mayor.
- **No usar:** “lifetime de todas las versiones”.

La Founders Edition valida voluntad de pago sin comprometer el mantenimiento de por vida.

#### Precio público de versión 1

- **Precio de lista:** US$69 pago único.
- **Oferta de lanzamiento:** US$49 durante 14 días.
- **Prueba:** 7 días, sin tarjeta, hasta 500 pistas y una exportación Rekordbox XML completa.
- **Garantía:** devolución de 30 días.
- **Licencia:** dos dispositivos del mismo usuario.
- **Actualizaciones:** todas las actualizaciones 1.x. La versión 2 puede ser un upgrade pagado con 40% de descuento.

#### Evolución de precio

- Mantener US$69 mientras sea Windows + Rekordbox.
- Probar US$79–89 después de incorporar inglés, macOS o una segunda plataforma DJ y contar con evidencia fuerte.
- No bajar de US$39 fuera de una campaña limitada. Un precio demasiado bajo reduce margen para soporte y transmite menor confianza.

### 6.2 GigReady Cloud

#### Recomendación de producto

No subir bibliotecas completas al servidor como comportamiento predeterminado. El procesamiento debe ser local y la nube debe guardar metadata, resultados, configuraciones, reportes e historial. Si una función avanzada requiere servidor, debe explicarse y solicitar permiso.

La web moderna puede acceder a carpetas locales con permiso del usuario, pero el soporte completo de File System Access está concentrado en navegadores Chromium y no puede replicarse completamente en navegadores incompatibles. Además, los permisos, el rendimiento de audio y las exportaciones son más delicados que en desktop.

Arquitectura recomendada:

- Aplicación web para cuenta, historial, configuración, reportes y colaboración.
- Agente local ligero o GigReady Desktop para escanear y exportar.
- Sincronización de resultados, no de audio, por defecto.
- “Quick Check” en navegador para pequeñas muestras y adquisición de nuevos usuarios.

#### Unidad de consumo

No limitar por cantidad de “escaneos”. Un escaneo puede contener 10 o 20.000 pistas. La unidad correcta es **pistas procesadas**.

Usar límite mensual con un tope de ráfaga diario. Los DJs preparan por lotes antes de un show; un límite diario pequeño puede bloquearlos en el peor momento y provocar cancelaciones.

#### Precios iniciales propuestos

| Plan | Precio | Límite | Funciones principales |
|---|---:|---:|---|
| Quick Check | Gratis | 25 pistas/día | Resultado básico, detección de riesgos y captura de email; sin exportación masiva. |
| Solo | US$8/mes o US$72/año | 3.000 pistas/mes; ráfaga de 1.000/día | Análisis completo, exportaciones, historial de 90 días y un dispositivo activo. |
| Pro | US$15/mes o US$120/año | 15.000 pistas/mes; ráfaga de 5.000/día | Historial ilimitado, tres dispositivos, perfiles guardados, procesamiento prioritario y soporte preferente. |
| Team | No lanzar al inicio | Definir con clientes | Asientos, bibliotecas compartidas, auditoría, permisos y reportes de equipo. |

Estos precios son hipótesis. Deben validarse con entrevistas y dos pruebas de precio antes de escribir todo el producto web.

#### Relación Desktop + Cloud

- Quien compra Desktop conserva escaneos locales ilimitados.
- Dar 3 meses de Cloud Solo al comprador de Desktop para impulsar adopción.
- No quitar funciones desktop ya compradas para forzar una suscripción.
- Ofrecer upgrade a bundle: Desktop + Cloud Pro anual por US$159 durante lanzamiento.

## 7. Investigación primaria obligatoria

El estudio competitivo de escritorio no demuestra por sí solo que el mercado comprará. Antes del lanzamiento hay que ejecutar:

### 20 entrevistas de problema

- 8 DJs móviles/open format.
- 6 DJs residentes o de club.
- 4 instructores de academias.
- 2 responsables de equipos/eventos.

No mostrar el producto durante los primeros 15 minutos. Investigar el proceso actual, tiempo, fallos, alternativas y coste emocional.

### 30–50 pruebas beta

Medir antes y después:

- Cantidad de pistas.
- Minutos de preparación manual estimados.
- Minutos usando GigReady.
- Problemas relevantes detectados.
- Porcentaje de cues aprobados sin mover.
- Porcentaje aprobados después de editar.
- Éxito de importación en Rekordbox.
- Intención de uso semanal o mensual.
- Precio que considera barato, razonable, caro y demasiado caro.

### Criterios de salida de beta

No lanzar públicamente hasta cumplir:

- 30 testers reclutados y al menos 20 activados.
- 15 importaciones reales en Rekordbox completadas.
- Al menos 90% de sesiones sin error crítico de aplicación.
- Al menos 80% de éxito en el flujo XML entre quienes lo intentan.
- Mediana de utilidad de cues de 4/5 o 70% de cues aprobados/ajustados como aprovechables.
- Ahorro mediano de al menos 30 minutos por cada 100 pistas o 40% del proceso actual.
- Diez usuarios dispuestos a pagar US$49 o más.
- Cero defectos conocidos con riesgo de modificar o perder originales.

## 8. Embudo comercial

### Flujo principal

1. Contenido o recomendación plantea un dolor real.
2. Landing muestra la aplicación y un caso de antes/después.
3. Usuario descarga prueba sin tarjeta.
4. Onboarding lo lleva a escanear 20–100 pistas.
5. Resultado muestra problemas, tiempo estimado ahorrado y siguiente acción.
6. Usuario revisa un cue y completa una exportación.
7. Email resume el resultado y muestra la oferta.
8. Compra en checkout simple.
9. Activación automática y guía de primera importación.
10. Solicitud de reseña o referido después de una exportación exitosa.

### Eventos del producto que deben medirse

- Visita a landing.
- Clic en descargar.
- Instalación iniciada y completada.
- Primera apertura.
- Primera carpeta seleccionada.
- Primer escaneo iniciado/completado.
- 20, 100 y 500 pistas procesadas.
- Primer problema relevante revisado.
- Primer cue escuchado/editado/aprobado.
- Primera exportación creada.
- Importación a Rekordbox confirmada.
- Vista de precio.
- Compra, reembolso y solicitud de soporte.

No enviar nombres de archivos, metadata ni audio sin consentimiento explícito.

### Objetivos iniciales por cada 1.000 visitantes cualificados

| Etapa | Objetivo inicial |
|---|---:|
| Visita → descarga | 10–15% |
| Descarga → primer escaneo completo | 50–60% |
| Primer escaneo → primera exportación | 35–45% |
| Prueba activada → compra | 15–25% |
| Reembolso | Menos de 5% |

Estos son objetivos operativos, no predicciones. Deben reemplazarse por datos reales tras las primeras 300 descargas.

## 9. Canales de adquisición

### Prioridad 1 — Demostración en video

Formatos:

- “Revisé 500 tracks antes de un gig: esto encontró GigReady”.
- “Cómo detectar archivos problemáticos antes de Rekordbox”.
- “De carpeta nueva a XML con memory cues”.
- “Antes y después: tiempo de preparación medido”.

Un video largo de 6–10 minutos puede producir:

- Tres clips verticales.
- Un carrusel con hallazgos.
- Un artículo SEO.
- Un email.
- Capturas para la landing.

### Prioridad 2 — Creadores y afiliados

- Empezar con 10–20 microcreadores de DJ con audiencia específica, no celebridades.
- Dar acceso completo y permitir críticas reales.
- Comisión sugerida: 25% en Desktop y 20% de Cloud durante 12 meses.
- Entregar una biblioteca de prueba y un guion de demo, sin exigir un texto promocional.
- Medir ventas por creador, no vistas.

### Prioridad 3 — SEO de alta intención

Contenido recomendado en español e inglés:

- Cómo revisar archivos de audio antes de importarlos a Rekordbox.
- Cómo detectar duplicados sin romper una biblioteca DJ.
- Cómo preparar memory cues más rápido.
- Cómo crear e importar Rekordbox XML.
- Checklist para preparar un USB antes de un show.
- MP3, WAV o AIFF para CDJ: compatibilidad y riesgos.

Cada artículo debe resolver el problema aunque el lector no compre, y cerrar con una prueba concreta de GigReady.

### Prioridad 4 — Academias y equipos

- Licencia de instructor gratuita.
- Pack de cinco licencias con 25% de descuento.
- Checklist co-marcado para estudiantes.
- Taller de 30 minutos: “biblioteca segura antes de tocar”.
- Caso de estudio con tiempo ahorrado por una clase completa.

### Prioridad 5 — Comunidades

Participar en grupos de Rekordbox, Discord, Reddit y Facebook con educación y diagnósticos. No publicar enlaces repetitivos ni fingir recomendaciones orgánicas. Usar casos verificables, revelar que se es el creador y respetar las reglas de autopromoción.

### Publicidad pagada

No usar campañas amplias durante la beta. Después de validar conversión:

- Retargeting a visitantes y viewers de video.
- Búsqueda de alta intención.
- Prueba pequeña por idioma y caso de uso.
- Detener si el coste de adquisición supera 30% del ingreso neto de la primera compra, salvo que exista evidencia de recurrencia o referidos.

## 10. Sitio y activos de venta

### Landing mínima

1. Hero con producto real, beneficio y CTA único.
2. Video de 45–60 segundos.
3. Problema: archivos, duplicados, cues y tiempo manual.
4. Flujo en tres pasos: seleccionar, revisar, exportar.
5. Capturas reales de Dashboard, Problemas, Cues y Exportación.
6. Caso de uso medido.
7. Seguridad: local-first y originales intactos.
8. Compatibilidad exacta y limitaciones visibles.
9. Precio, prueba y garantía.
10. Preguntas frecuentes.

### Prueba social mínima antes de publicidad

- Cinco testimonios con nombre, tipo de DJ y resultado específico.
- Dos casos de estudio con tiempo antes/después.
- Una demo independiente de un creador.
- Número de pistas escaneadas solo si se puede medir de forma legítima.

### Lead magnet recomendado

**Checklist gratuito: “12 verificaciones antes de exportar tu USB de Rekordbox”.**

Debe terminar en una invitación a ejecutar un Quick Check, no en una venta agresiva.

## 11. Plan de lanzamiento de 12 semanas

### Semanas 1–2 — Preparación comercial

- Definir producto, precio y términos de la licencia 1.x.
- Configurar firma y decidir Microsoft Store vs descarga directa.
- Implementar activación y recuperación de licencia.
- Preparar privacidad, reembolso y soporte.
- Traducir interfaz y onboarding al inglés.
- Instrumentar eventos mínimos respetando privacidad.
- Crear landing de lista de espera y agenda de entrevistas.

### Semanas 3–6 — Beta cerrada

- Reclutar 30–50 DJs.
- Hacer onboarding manual de los primeros diez.
- Ejecutar protocolo con bibliotecas de 20, 100, 500 y 1.000 pistas.
- Medir tiempo, utilidad de cues y éxito de XML.
- Corregir todos los defectos críticos.
- Grabar cinco sesiones con permiso para detectar fricción.

### Semana 7 — Prueba de precio

- Presentar US$39, US$49 y US$69 a grupos equivalentes o usar preguntas de sensibilidad de precio.
- Pedir una compra o depósito reembolsable; no usar solo “¿pagarías?”.
- Elegir el precio con mejor ingreso por visitante y reembolso aceptable.

### Semana 8 — Founders Edition

- Abrir 100 licencias a US$39.
- Publicar limitaciones de forma transparente.
- Incluir canal privado de feedback y actualizaciones 1.x.
- Conseguir las primeras 20 compras y diez testimonios.

### Semanas 9–10 — Preparación pública

- Terminar demo, capturas, FAQ y casos.
- Coordinar 5–10 creadores para una misma semana.
- Preparar siete emails y 15 piezas sociales.
- Verificar checkout, licencias, recuperación, reembolsos y soporte.
- Ensayar instalación en equipos limpios.

### Semana 11 — Lanzamiento

- Abrir precio de lanzamiento US$49 por 14 días.
- Publicar demo principal y casos reales.
- Activar afiliados.
- Hacer una sesión en vivo de preparación de biblioteca.
- Responder soporte el mismo día.

### Semana 12 — Optimización

- Analizar activación, exportación, compra y reembolso.
- Entrevistar compradores, no compradores y abandonos.
- Corregir el mayor punto de caída.
- Decidir si mantener US$49 temporalmente o pasar a US$69.

## 12. Roadmap comercial de 12 meses

### Trimestre 1

- Lanzar Desktop v1 validado.
- Alcanzar 100 clientes de pago.
- Conseguir 10 testimonios y 3 casos medidos.
- Establecer soporte, checkout y activación confiables.

### Trimestre 2

- Expandir contenido en inglés.
- Añadir referidos dentro de la aplicación.
- Abrir programa de academias y afiliados.
- Validar macOS con al menos 30 interesados dispuestos a dejar depósito.

### Trimestre 3

- Priorizar macOS o una segunda integración DJ según solicitudes pagadas.
- Prototipar Quick Check web.
- Validar qué resultados desean sincronizar los usuarios.
- Ejecutar preventa de Cloud únicamente si 20 o más usuarios aceptan pagar.

### Trimestre 4

- Lanzar Cloud Solo si cumple activación y coste.
- Añadir reportes compartibles y perfiles sincronizados.
- Evaluar Team con academias y empresas de eventos.
- Subir el precio Desktop si la cobertura de plataformas y la evidencia lo justifican.

## 13. Métricas de dirección

### North Star inicial

**Bibliotecas preparadas con exportación confirmada en Rekordbox.**

No usar “pistas escaneadas” como única métrica: procesar archivos sin completar una decisión o exportación no demuestra valor.

### Panel semanal

- Visitantes cualificados.
- Descargas.
- Primeros escaneos completados.
- Exportaciones completadas.
- Importaciones confirmadas.
- Compras y precio medio.
- Reembolsos.
- Tiempo hasta primer valor.
- Tickets de soporte por 100 usuarios.
- Cues aprobados, editados y descartados.
- Minutos ahorrados declarados.
- Referidos generados.

### Economía unitaria

Con precio Desktop de US$69 y una comisión/fee total aproximada de 8–12%, el margen antes de soporte sigue siendo alto. Fijar como primera regla:

- CAC objetivo Desktop: menos de US$20.
- CAC máximo temporal: US$30 cuando exista evidencia de referidos o venta de Cloud.
- Reembolso: menos de 5%.
- Soporte: menos de 20 minutos promedio por nuevo comprador después del primer mes.

## 14. Operación comercial

### Checkout y licencias

Lemon Squeezy es una primera opción coherente porque combina:

- Pagos únicos y suscripciones.
- Gestión de claves de licencia.
- Merchant of Record para IVA/impuestos sobre ventas.
- Afiliados, cupones, recuperación y portal de clientes.

Su precio público base observado es 5% + US$0,50, con cargos adicionales en ciertos pagos internacionales, PayPal y suscripciones. Confirmar que la cuenta y los payouts están disponibles para la entidad del vendedor antes de integrarlo.

Paddle es una alternativa Merchant of Record orientada a software/SaaS. Comparar aprobación, pagos en Chile, soporte de licencias, experiencia de checkout y coste efectivo antes de decidir.

### Soporte

- Email con respuesta objetivo menor a 24 horas hábiles.
- Base de conocimiento con instalación, XML, rutas y seguridad.
- Plantilla que solicita versión, Windows, Rekordbox, log y paso exacto.
- Canal prioritario solo para Pro/Team cuando exista volumen.

### Confianza y privacidad

- Política clara: qué queda local y qué se sincroniza.
- Telemetría opt-in durante beta y configurable en versión pública.
- Nunca recolectar nombres de pistas ni rutas sin permiso.
- Publicar checksums de instaladores.
- Firmar cada release con la misma identidad.
- Comunicar limitaciones conocidas en changelog.

## 15. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cues poco útiles | Destruye la promesa de ahorro | Dataset anotado por género, medición de aprobación y comunicación como sugerencias. |
| Fricción de instalación | Reduce drásticamente la prueba | Firma, Store, instalador limpio, video y soporte. |
| Dependencia de Rekordbox XML | Cambios externos pueden romper flujos | QA por versión, guía actualizada y adaptadores para otras plataformas. |
| Solo Windows | Excluye una parte relevante del mercado profesional | Validar y priorizar macOS antes de una web completa. |
| Competidor barato | Comprime precio | Casos reales, seguridad, soporte, preflight y confianza. |
| Suscripción percibida como abuso | Churn y mala reputación | Desktop conserva valor; Cloud cobra por nube, sincronización y colaboración. |
| Upload de audio a web | Coste, lentitud y privacidad | Procesamiento local y sincronización de resultados. |
| Promesas legales o de compatibilidad | Reembolsos y pérdida de confianza | Claims medidos, matriz de compatibilidad y términos revisados. |

## 16. Decisiones que no deben posponerse

1. Elegir el nombre legal del vendedor y la identidad que firmará el software.
2. Definir si v1.x incluye actualizaciones perpetuas de esa versión mayor.
3. Establecer qué información puede enviar la telemetría.
4. Elegir Microsoft Store, descarga directa firmada o ambas.
5. Elegir Merchant of Record y confirmar payouts.
6. Seleccionar 30–50 testers con bibliotecas representativas.
7. Definir idioma de soporte y horario de respuesta.
8. Nombrar a una persona responsable de métricas y entrevistas cada semana.

## 17. Próxima acción recomendada

Durante los próximos siete días:

1. Reclutar diez DJs para entrevistas y cinco para una primera beta guiada.
2. Resolver firma/identidad del editor.
3. Montar una landing de lista de espera con la propuesta recomendada.
4. Medir una preparación real de 100 pistas sin y con GigReady.
5. Probar el flujo XML en al menos dos versiones reales de Rekordbox.
6. Configurar checkout en modo prueba y emitir una licencia de extremo a extremo.

No comenzar el desarrollo completo de GigReady Cloud hasta tener evidencia de uso repetido y compras de Desktop.

## Fuentes consultadas

- [Planes y precios de rekordbox](https://rekordbox.com/en/plan/)
- [MIXO pricing](https://www.mixo.dj/pricing)
- [Lexicon pricing](https://www.lexicondj.com/es/pricing)
- [Lexicon: nueva estructura y opciones lifetime](https://www.lexicondj.com/blog/lexicon-1-9-0-free-conversion-and-new-pricing)
- [Mixed In Key shop](https://mixedinkey.com/shop/)
- [GreenGo Pro: producto y precio](https://greengomusic.com/)
- [OneTagger: producto open source](https://onetagger.github.io/index.html)
- [beaTunes download y trial](https://www.beatunes.com/en/beatunes-download.html)
- [File System Access API — Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [File System API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
- [Microsoft SmartScreen para desarrolladores](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- [Lemon Squeezy pricing](https://www.lemonsqueezy.com/pricing)
- [Lemon Squeezy: impuestos y Merchant of Record](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat)
- [Paddle Merchant of Record](https://mor.paddle.com/)

