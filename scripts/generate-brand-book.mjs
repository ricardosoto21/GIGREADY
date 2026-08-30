import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const brandDir = path.join(rootDir, "docs", "brand-book");
const assetDir = path.join(brandDir, "assets");
const pdfDir = path.join(rootDir, "output", "pdf");
const shotDir = path.join(rootDir, "output", "playwright");

const documentMeta = {
  brand: "GigReady",
  subtitle: "Manual de Marca",
  version: "Versión 1.0",
  date: "26 de junio de 2026",
  institutionalSubtitle: "Sistema de identidad para un software de preparación musical profesional.",
  tagline: "Ready before the first beat.",
};

const palette = [
  {
    name: "Stage Black",
    hex: "#080A0E",
    role: "Base premium",
    use: "Fondos principales, portada, navegación dark, mockups y piezas de alto impacto.",
    psychology: "Comunica foco, precisión y control técnico sin caer en dramatismo.",
  },
  {
    name: "Ready White",
    hex: "#F7F8F6",
    role: "Luz editorial",
    use: "Fondos claros, documentación, áreas de lectura larga y superficies de producto.",
    psychology: "Aporta calma, legibilidad y una sensación de orden previa al show.",
  },
  {
    name: "Pulse Cyan",
    hex: "#47F4E6",
    role: "Acento propietario",
    use: "Acciones principales, estados activos, highlights de análisis y detalles del logotipo.",
    psychology: "Sugiere señal, tecnología limpia y energía medida.",
  },
  {
    name: "Wave Blue",
    hex: "#246BFD",
    role: "Información",
    use: "Datos, enlaces, gráficas secundarias, comparaciones y módulos técnicos.",
    psychology: "Refuerza confianza, claridad operativa y lectura de información compleja.",
  },
  {
    name: "Signal Green",
    hex: "#19C37D",
    role: "Preparado",
    use: "Estados correctos, archivos listos, confirmaciones y progreso completado.",
    psychology: "Representa avance, seguridad y decisión tomada.",
  },
  {
    name: "Cue Amber",
    hex: "#FFB84D",
    role: "Atención",
    use: "Advertencias, cues pendientes, revisión recomendada y contenido promocional cálido.",
    psychology: "Indica atención sin alarma, útil para decisiones antes de tocar.",
  },
  {
    name: "Peak Magenta",
    hex: "#FF4FD8",
    role: "Energía selectiva",
    use: "Momentos de alta energía, visualizaciones de drop y piezas sociales de campaña.",
    psychology: "Aporta carácter musical y tensión visual cuando la marca necesita más pulso.",
  },
  {
    name: "Risk Red",
    hex: "#E84A5F",
    role: "Error",
    use: "Errores críticos, archivos corruptos, acciones bloqueadas y alertas importantes.",
    psychology: "Señala riesgo real con suficiente contraste y sin exagerar el mensaje.",
  },
  {
    name: "Graphite 700",
    hex: "#2A2F36",
    role: "Neutral oscuro",
    use: "Texto sobre fondos claros, bordes dark y paneles de soporte.",
    psychology: "Sostiene una percepción técnica sobria y consistente.",
  },
  {
    name: "Mist 200",
    hex: "#D9DEE3",
    role: "Neutral claro",
    use: "Bordes, divisores, tablas, fondos de estado neutro y documentación.",
    psychology: "Permite separar información sin agregar ruido visual.",
  },
];

const pages = [
  {
    kind: "cover",
    title: "GigReady",
    lead: "Manual de Marca",
    text: [
      documentMeta.institutionalSubtitle,
      `${documentMeta.version} - ${documentMeta.date}`,
      documentMeta.tagline,
    ],
    visual: "cover",
  },
  {
    kind: "snapshot",
    section: "00",
    title: "Resumen ejecutivo",
    lead: "GigReady debe sentirse como un asistente silencioso de cabina: técnico, exacto y calmado.",
    blocks: [
      {
        heading: "Territorio",
        body: "Software local-first para DJs que revisa bibliotecas, detecta riesgos, sugiere memory cues y prepara exportaciones antes de abrir Rekordbox.",
      },
      {
        heading: "Idea central",
        body: "Preparación automática con criterio musical. La marca no promete magia: promete ahorrar tiempo, reducir incertidumbre y dejar al DJ listo antes del primer beat.",
      },
      {
        heading: "Estilo",
        body: "Premium, minimalista, tecnológico y futurista. Superficies limpias, alto contraste, acentos cian y visualizaciones inspiradas en señal, onda y energía.",
      },
      {
        heading: "Usuarios",
        body: "DJs móviles, residentes, open format, productores que actúan en vivo, equipos de eventos y creadores que preparan librerías grandes con poco margen de error.",
      },
    ],
    visual: "signal",
  },
  {
    kind: "toc",
    title: "Índice",
    lead: "Estructura de uso para diseño, producto, comunicación y crecimiento internacional.",
  },
  {
    kind: "chapter",
    section: "01",
    title: "Filosofía de marca",
    lead: "La identidad parte de una verdad simple: el momento más importante ocurre antes de la pista.",
    blocks: [
      {
        heading: "Principio rector",
        body: "GigReady existe para que la preparación técnica deje de competir con la preparación musical. El DJ mantiene el criterio; el software reduce el trabajo repetitivo.",
      },
      {
        heading: "Decisión estratégica",
        body: "La marca evita el lenguaje grandilocuente. Habla de confianza, revisión, compatibilidad y calma operativa porque esos son los beneficios que se sienten en cabina.",
      },
    ],
    visual: "chapter-01",
  },
  {
    kind: "content",
    section: "01.1",
    title: "Historia",
    lead: "GigReady nace de una fricción muy concreta: preparar música no debería consumir la energía del show.",
    blocks: [
      {
        heading: "Origen",
        body: "Cada DJ conoce el ritual: revisar carpetas, buscar duplicados, confirmar que los archivos carguen, marcar puntos de mezcla y volver a exportar. El proceso es necesario, pero suele ser manual, largo y fácil de postergar.",
      },
      {
        heading: "Respuesta",
        body: "GigReady transforma ese ritual en un flujo claro: selecciona una carpeta, analiza archivos, prioriza problemas, sugiere cues útiles y exporta reportes o XML compatible con Rekordbox.",
      },
      {
        heading: "Carácter",
        body: "La historia de la marca no es la de reemplazar al DJ. Es la de devolverle tiempo de escucha, criterio y descanso antes de presentarse.",
      },
    ],
    visual: "timeline",
  },
  {
    kind: "content",
    section: "01.2",
    title: "Propósito, misión y visión",
    lead: "Una identidad internacional necesita una dirección verbal simple, traducible y duradera.",
    blocks: [
      {
        heading: "Propósito",
        body: "Hacer que cada DJ llegue preparado con menos trabajo manual y más confianza en su música.",
      },
      {
        heading: "Misión",
        body: "Analizar colecciones de audio de forma local, clara y segura para detectar riesgos técnicos, sugerir puntos de mezcla y generar exportaciones listas para flujos profesionales.",
      },
      {
        heading: "Visión",
        body: "Convertirse en la capa de preparación musical más confiable para DJs y equipos de eventos en cualquier mercado, software y cabina.",
      },
    ],
    visual: "mission",
  },
  {
    kind: "matrix",
    section: "01.3",
    title: "Valores",
    lead: "Los valores deben orientar producto, comunicación y soporte sin convertirse en frases decorativas.",
    items: [
      ["Precisión calmada", "Mostrar datos claros, priorizar riesgos reales y evitar dramatizar advertencias menores."],
      ["Respeto por la música", "Tratar los cues como sugerencias revisables. La decisión final siempre pertenece al DJ."],
      ["Seguridad local", "Analizar sin modificar originales por defecto y explicar cada acción irreversible."],
      ["Tiempo recuperado", "Reducir tareas repetitivas para que la preparación se concentre en selección, narrativa y escucha."],
      ["Compatibilidad profesional", "Diseñar para flujos reales: Rekordbox, USBs, carpetas, reportes, historial y equipos diversos."],
      ["Claridad internacional", "Usar lenguaje directo, nombres comprensibles y una estética premium que no dependa de modas locales."],
    ],
    visual: "values",
  },
  {
    kind: "manifesto",
    section: "01.4",
    title: "Promesa y manifiesto",
    lead: "Promesa de marca: llegar listo antes del primer beat.",
    quote: "La preparación no debería sonar como ansiedad. Debería sentirse como control.",
    blocks: [
      {
        heading: "Promesa",
        body: "GigReady ahorra horas de revisión manual y entrega una lectura clara del estado de tu música antes de tocar.",
      },
      {
        heading: "Manifiesto",
        body: "Creemos en DJs que preparan con intención. Creemos en archivos que cargan cuando deben cargar, cues que ayudan sin imponerse y reportes que dicen lo necesario. La tecnología de GigReady trabaja en segundo plano para que la música vuelva al centro.",
      },
    ],
    visual: "manifesto",
  },
  {
    kind: "matrix",
    section: "01.5",
    title: "Personalidad y arquetipos",
    lead: "GigReady debe sonar experto sin ser frío, seguro sin ser rígido, técnico sin volverse inaccesible.",
    items: [
      ["Primario: El Sabio", "Diagnostica, ordena y convierte incertidumbre técnica en información accionable."],
      ["Secundario: El Cuidador", "Protege archivos originales, reduce riesgos y acompaña el flujo de preparación."],
      ["Tercero: El Creador", "Respeta el criterio musical y habilita decisiones expresivas mediante cues y mapas de energía."],
      ["Rasgos", "Sobrio, atento, preciso, moderno, confiable, reservado, internacional."],
      ["No es", "Ruidoso, agresivo, arrogante, juvenil forzado, críptico, excesivamente gamer."],
      ["Cómo se comporta", "Primero muestra el estado, luego recomienda la acción y finalmente permite exportar con control."],
    ],
    visual: "archetype",
  },
  {
    kind: "chapter",
    section: "02",
    title: "Posicionamiento",
    lead: "El lugar de GigReady no es producir música, mezclar por el DJ ni administrar streaming. Es preparar la biblioteca para tocar.",
    blocks: [
      {
        heading: "Categoría",
        body: "Pre-performance music preparation software.",
      },
      {
        heading: "Territorio competitivo",
        body: "Entre utilidades de metadata, herramientas de análisis de audio, reportes de librería y flujos de exportación para software DJ.",
      },
    ],
    visual: "chapter-02",
  },
  {
    kind: "content",
    section: "02.1",
    title: "Problema que resuelve",
    lead: "La preparación musical tiene muchas microtareas que suelen hacerse tarde, con presión y sin una vista completa.",
    blocks: [
      {
        heading: "Dolor funcional",
        body: "Archivos corruptos, bitrate bajo, rutas largas, nombres problemáticos, duplicados y metadata incompleta pueden aparecer cuando ya no hay tiempo para corregir.",
      },
      {
        heading: "Dolor emocional",
        body: "El DJ llega con dudas: si todo cargará, si el USB quedó limpio, si los cues ayudan o si una carpeta escondida contiene el problema.",
      },
      {
        heading: "Insight",
        body: "La tranquilidad antes del show no viene de tener más funciones. Viene de una lectura confiable, priorizada y fácil de actuar.",
      },
    ],
    visual: "problem",
  },
  {
    kind: "content",
    section: "02.2",
    title: "Propuesta de valor",
    lead: "GigReady revisa, prepara y exporta tu música antes de tocar.",
    blocks: [
      {
        heading: "Para DJs",
        body: "Convierte una carpeta de música en un set revisado, con problemas priorizados, cues sugeridos y exportaciones listas para el flujo de cabina.",
      },
      {
        heading: "Beneficio central",
        body: "Menos tiempo revisando archivos. Más confianza al importar, mezclar y presentarse.",
      },
      {
        heading: "Razón para creer",
        body: "Trabaja localmente, usa validación técnica real, mantiene historial de escaneos, no modifica originales por defecto y exporta formatos útiles como CSV, HTML, PDF, M3U y Rekordbox XML.",
      },
    ],
    visual: "value",
  },
  {
    kind: "matrix",
    section: "02.3",
    title: "Diferenciadores",
    lead: "La diferenciación combina criterio musical, seguridad local y compatibilidad con el trabajo real del DJ.",
    items: [
      ["Auditoría antes de importar", "Detecta problemas antes de que entren al flujo de Rekordbox o al USB final."],
      ["Memory Cue Assistant", "Sugiere puntos como Intro, Break, Drop y Mix Out con confianza y ajuste revisable."],
      ["Preparación no destructiva", "Modo solo lectura y carpeta limpia para proteger los archivos originales."],
      ["Exportación útil", "Reportes y XML orientados a decisiones, no a una lista técnica sin contexto."],
      ["Historial local", "Permite revisar sesiones pasadas y evitar trabajo repetido cuando la colección no cambió."],
      ["Diseño sobrio", "La interfaz debe sentirse como herramienta profesional, no como efecto visual de club."],
    ],
    visual: "differentiators",
  },
  {
    kind: "matrix",
    section: "02.4",
    title: "Beneficios",
    lead: "Los beneficios se comunican en dos capas: lo que hace el producto y lo que el usuario siente.",
    items: [
      ["Funcional: ahorro de tiempo", "Reduce revisión manual, búsqueda de duplicados y validación repetitiva."],
      ["Funcional: orden", "Agrupa incidencias, separa severidades y permite actuar por prioridad."],
      ["Funcional: compatibilidad", "Facilita exportaciones para flujos de Rekordbox y playlists estándar."],
      ["Emocional: tranquilidad", "Disminuye la incertidumbre antes de tocar."],
      ["Emocional: control", "El usuario entiende qué pasa y decide qué aprobar."],
      ["Emocional: preparación", "La colección se siente lista, no improvisada."],
    ],
    visual: "benefits",
  },
  {
    kind: "audience",
    section: "02.5",
    title: "Público objetivo",
    lead: "La marca debe hablar con DJs que valoran el tiempo, la confiabilidad y el control del flujo.",
    personas: [
      ["DJ móvil profesional", "Prepara eventos privados, bodas y corporativos. Necesita USBs confiables, carpetas limpias y cero sorpresas técnicas."],
      ["DJ residente o club", "Trabaja con música nueva cada semana. Valora cues rápidos, consistencia y revisión antes de cabina."],
      ["Open format y eventos", "Maneja librerías extensas, múltiples géneros y requests. Necesita orden, duplicados bajo control y reportes claros."],
      ["Equipo de producción", "Gestiona varias máquinas o DJs. Necesita documentación, estándares y una forma común de validar material."],
    ],
    visual: "audience",
  },
  {
    kind: "chapter",
    section: "03",
    title: "Identidad verbal",
    lead: "La voz de GigReady es clara, precisa y serena. Habla como una herramienta que ya hizo el trabajo difícil.",
    blocks: [
      {
        heading: "Regla base",
        body: "Decir qué ocurre, por qué importa y cuál es la siguiente acción. Sin exagerar, sin jerga innecesaria y sin prometer resultados infalibles.",
      },
      {
        heading: "Beneficio dominante",
        body: "Ahorro de tiempo, preparación automática, confianza antes del show y control sobre los archivos.",
      },
    ],
    visual: "chapter-03",
  },
  {
    kind: "content",
    section: "03.1",
    title: "Voz de marca",
    lead: "La voz se mantiene constante aunque el tono cambie por contexto.",
    blocks: [
      {
        heading: "Clara",
        body: "Prioriza frases cortas, verbos concretos y nombres de acciones que el DJ entiende: escanear, revisar, aprobar, exportar.",
      },
      {
        heading: "Profesional",
        body: "Evita bromas internas, dramatismo de error y lenguaje de hype. La marca acompaña una tarea seria.",
      },
      {
        heading: "Musical",
        body: "Usa términos como beat, energía, mezcla y cue cuando son útiles, nunca como decoración.",
      },
    ],
    visual: "voice",
  },
  {
    kind: "matrix",
    section: "03.2",
    title: "Tono por contexto",
    lead: "El tono se ajusta según el estado del usuario, no según la necesidad de sonar llamativo.",
    items: [
      ["Descubrimiento", "Seguro y aspiracional: preparar música puede ser más simple."],
      ["Onboarding", "Directo y guiado: selecciona carpeta, elige modo, revisa resultados."],
      ["Escaneo", "Informativo y paciente: muestra progreso, fase y archivo actual."],
      ["Advertencia", "Preciso y accionable: explica riesgo y recomendación."],
      ["Éxito", "Breve y confirmatorio: indica qué quedó listo y dónde encontrarlo."],
      ["Soporte", "Empático y técnico: pide datos útiles sin culpar al usuario."],
    ],
    visual: "tone",
  },
  {
    kind: "messaging",
    section: "03.3",
    title: "Mensajes clave",
    lead: "Estos mensajes pueden combinarse en sitio web, app, presentaciones y campañas.",
    messages: [
      "Revisa tu música antes de importarla.",
      "Detecta archivos problemáticos, duplicados y riesgos de compatibilidad.",
      "Sugiere memory cues para preparar mezclas con menos trabajo manual.",
      "Exporta reportes y XML compatible con Rekordbox.",
      "Trabaja localmente y no modifica originales sin confirmación.",
      "Llega al show con una biblioteca limpia, revisada y lista.",
    ],
    visual: "messages",
  },
  {
    kind: "content",
    section: "03.4",
    title: "Elevator pitch",
    lead: "Tres versiones para distintos niveles de detalle.",
    blocks: [
      {
        heading: "10 segundos",
        body: "GigReady revisa y prepara tu música antes de tocar, detectando problemas y sugiriendo memory cues para Rekordbox.",
      },
      {
        heading: "30 segundos",
        body: "GigReady es una app desktop para DJs que analiza carpetas de música antes de importarlas a Rekordbox. Detecta archivos corruptos, duplicados y riesgos técnicos, sugiere memory cues y genera reportes o XML para preparar sets con más confianza.",
      },
      {
        heading: "60 segundos",
        body: "GigReady convierte la preparación previa al show en un flujo claro. Escanea carpetas, pendrives o discos externos; valida audio y metadata; prioriza incidencias; sugiere cues según estructura y energía; permite aprobarlos y exporta formatos útiles para la cabina. Es local-first, no modifica originales por defecto y está pensado para DJs que quieren llegar listos sin revisar cada archivo a mano.",
      },
    ],
    visual: "pitch",
  },
  {
    kind: "matrix",
    section: "03.5",
    title: "Eslogan y lenguaje",
    lead: "El eslogan principal funciona en inglés por escalabilidad internacional; las alternativas cubren campañas en español.",
    items: [
      ["Principal", "Ready before the first beat."],
      ["Alternativa 1", "Listo antes del primer beat."],
      ["Alternativa 2", "Tu música revisada antes de tocar."],
      ["Alternativa 3", "Menos revisión. Más preparación."],
      ["Palabras recomendadas", "Preparar, revisar, confianza, cues, energía, biblioteca, exportar, local, seguro, compatible."],
      ["Palabras a evitar", "Disruptivo, revolucionario, magia, IA total, automático perfecto, infalible, reemplaza al DJ."],
    ],
    visual: "slogan",
  },
  {
    kind: "chapter",
    section: "04",
    title: "Sistema de logotipo",
    lead: "El logotipo combina nota, pulso y camino de preparación. Debe sentirse técnico y musical sin parecer una app genérica de audio.",
    blocks: [
      {
        heading: "Nombre del sistema",
        body: "Pulse Mark: un isotipo de línea continua que une una nota musical con una forma de onda ascendente.",
      },
      {
        heading: "Uso estratégico",
        body: "El símbolo identifica análisis musical y preparación. El wordmark aporta claridad internacional y alta lectura en escritorio, web y presentaciones.",
      },
    ],
    visual: "logo-large",
  },
  {
    kind: "logo",
    section: "04.1",
    title: "Concepto creativo",
    lead: "La marca se construye sobre tres señales visuales: beat, preparación y energía.",
    blocks: [
      ["Nota", "Origen musical y relación directa con bibliotecas de audio."],
      ["Pulso", "Análisis, forma de onda, mapa de energía y detección de secciones."],
      ["Check implícito", "La línea asciende y se estabiliza: una biblioteca pasa de incertidumbre a control."],
    ],
    visual: "logo-concept",
  },
  {
    kind: "logo",
    section: "04.2",
    title: "Construcción",
    lead: "La construcción usa una retícula modular para mantener proporción entre símbolo y palabra.",
    blocks: [
      ["Módulo X", "X equivale al grosor del trazo principal. El isotipo ocupa 12X de ancho por 12X de alto."],
      ["Trazo", "Extremos rectos con uniones controladas. El trazo debe conservar nitidez en tamaños pequeños."],
      ["Wordmark", "GigReady se escribe en una sola palabra, G y R en mayúscula. No separar como Gig Ready."],
    ],
    visual: "construction",
  },
  {
    kind: "logo",
    section: "04.3",
    title: "Versiones",
    lead: "El sistema debe cubrir producto, documentos, redes y tamaños compactos.",
    blocks: [
      ["Horizontal", "Versión principal para sitio web, firmas, presentaciones y encabezados."],
      ["Vertical", "Para portadas, avatar extendido y aplicaciones con centro visual."],
      ["Isotipo", "Para iconos, favicons, botones de app, sellos, stickers y estados compactos."],
      ["Imagotipo", "Símbolo más wordmark cuando se necesita reconocimiento completo."],
    ],
    visual: "logo-versions",
  },
  {
    kind: "logo",
    section: "04.4",
    title: "Monocromo y responsive",
    lead: "El sistema debe resistir impresión, pantallas de baja resolución y espacios reducidos.",
    blocks: [
      ["Monocromo dark", "Usar blanco sobre Stage Black o Graphite 700."],
      ["Monocromo claro", "Usar Stage Black sobre Ready White."],
      ["Responsive", "Full logo sobre 140 px. Wordmark reducido entre 96 y 139 px. Isotipo bajo 96 px."],
      ["Favicon", "Usar isotipo simplificado dentro de contenedor oscuro con acento Pulse Cyan."],
    ],
    visual: "responsive",
  },
  {
    kind: "logo",
    section: "04.5",
    title: "Área de protección y tamaño mínimo",
    lead: "El logo necesita aire para mantener una lectura premium.",
    blocks: [
      ["Protección", "Mantener al menos 1.5X alrededor del isotipo y 2X alrededor del imagotipo completo."],
      ["Tamaño mínimo digital", "Imagotipo horizontal: 120 px de ancho. Isotipo: 24 px."],
      ["Tamaño mínimo impreso", "Imagotipo horizontal: 35 mm de ancho. Isotipo: 8 mm."],
      ["Excepción", "En favicons y app icons se permite simplificar el trazo, pero no alterar el concepto."],
    ],
    visual: "clearspace",
  },
  {
    kind: "incorrect",
    section: "05",
    title: "Usos incorrectos",
    lead: "La consistencia del logotipo depende de evitar cambios que parezcan pequeños pero debilitan el reconocimiento.",
    items: [
      ["No deformar", "Mantener proporciones originales."],
      ["No rotar", "La línea de pulso debe conservar dirección estable."],
      ["No recolorear al azar", "Usar paleta aprobada y versiones monocromas."],
      ["No aplicar efectos", "Evitar sombras, brillos, biseles o texturas."],
      ["No perder contraste", "Usar fondos que garanticen legibilidad."],
      ["No alterar el isotipo", "No separar la nota del pulso ni cambiar grosores."],
    ],
    visual: "incorrect",
  },
  {
    kind: "colors",
    section: "06.1",
    title: "Paleta principal",
    lead: "La paleta principal construye el equilibrio entre herramienta profesional y energía musical.",
    colorNames: ["Stage Black", "Ready White", "Pulse Cyan", "Graphite 700"],
  },
  {
    kind: "colors",
    section: "06.2",
    title: "Paleta secundaria y apoyo",
    lead: "Los colores secundarios amplían el sistema para campañas, visualización de datos y momentos de energía.",
    colorNames: ["Wave Blue", "Signal Green", "Cue Amber", "Peak Magenta", "Mist 200"],
  },
  {
    kind: "colors",
    section: "06.3",
    title: "Colores para estados",
    lead: "Los estados deben distinguir severidad sin depender únicamente del color.",
    colorNames: ["Signal Green", "Cue Amber", "Risk Red", "Wave Blue"],
    stateNotes: [
      ["Éxito", "Signal Green con texto o icono de confirmación."],
      ["Alerta", "Cue Amber con mensaje claro y acción recomendada."],
      ["Error", "Risk Red solo para problemas que bloquean o requieren atención inmediata."],
      ["Información", "Wave Blue para contexto técnico, detalles y ayuda."],
    ],
  },
  {
    kind: "chapter",
    section: "07",
    title: "Tipografía",
    lead: "La tipografía debe recordar software profesional: densa cuando hace falta, aireada cuando comunica marca.",
    blocks: [
      {
        heading: "Dirección",
        body: "Usar familias grotesk limpias, alta legibilidad en interfaces y peso suficiente para tablas, paneles y documentación.",
      },
      {
        heading: "Criterio",
        body: "La marca no necesita tipografías decorativas. La diferencia se construye con proporción, ritmo, color y microcopy.",
      },
    ],
    visual: "type",
  },
  {
    kind: "type",
    section: "07.1",
    title: "Familias recomendadas",
    lead: "El sistema combina una sans principal con una mono para datos técnicos.",
    items: [
      ["Principal", "Inter, SF Pro o Segoe UI. Uso: producto, web, presentaciones, documentación."],
      ["Secundaria", "Manrope o Aptos. Uso: piezas comerciales y titulares cuando se necesita una voz más editorial."],
      ["Monoespaciada", "SFMono, IBM Plex Mono o Consolas. Uso: rutas, nombres de archivo, XML, logs y códigos."],
      ["Alternativas gratuitas", "Inter, Manrope, IBM Plex Sans, IBM Plex Mono y Source Sans 3."],
    ],
    visual: "type-samples",
  },
  {
    kind: "type",
    section: "07.2",
    title: "Jerarquía tipográfica",
    lead: "La jerarquía evita titulares gigantes dentro de herramientas densas y reserva escala alta para portada o campañas.",
    items: [
      ["H1 editorial", "48-64 px, peso 650, line-height 1.0-1.1."],
      ["H1 producto", "28-36 px, peso 650, line-height 1.15."],
      ["H2", "22-28 px, peso 620, line-height 1.2."],
      ["Texto de interfaz", "13-15 px, peso 400-500, line-height 1.45."],
      ["Tabla", "12-13 px, peso 400, line-height 1.35."],
      ["Metadata", "11-12 px, mono cuando el dato necesita precisión visual."],
    ],
    visual: "hierarchy",
  },
  {
    kind: "chapter",
    section: "08",
    title: "Sistema gráfico",
    lead: "El lenguaje gráfico se inspira en señal, mapa de energía, preparación por fases y precisión de interfaz.",
    blocks: [
      {
        heading: "Principio visual",
        body: "El sistema nunca compite con la música. Representa análisis y preparación mediante líneas, divisores, grids, curvas de energía y capas de información.",
      },
      {
        heading: "Regla de sobriedad",
        body: "Usar efectos solo cuando ayudan a leer estado, profundidad o foco. Evitar fondos ruidosos y decoración gratuita.",
      },
    ],
    visual: "chapter-08",
  },
  {
    kind: "matrix",
    section: "08.1",
    title: "Iconografía y patrones",
    lead: "Los iconos deben ser funcionales, consistentes y reconocibles a tamaños pequeños.",
    items: [
      ["Iconos", "Trazos lineales de 1.75 a 2 px, esquinas moderadas, relleno solo para estados activos."],
      ["Metáforas", "Carpeta, archivo, pulso, alerta, check, exportación, reloj, onda, tabla."],
      ["Patrones", "Líneas de tiempo, pequeñas marcas de beat, retículas de 8 px y ondas suaves."],
      ["Uso", "Fondos de portada, separadores de sección, estados vacíos y piezas promocionales."],
      ["Evitar", "Ilustraciones caricaturescas, pictogramas complejos y símbolos de música genéricos sin criterio."],
      ["Accesibilidad", "Todo icono crítico debe acompañarse con texto o etiqueta visible."],
    ],
    visual: "icons",
  },
  {
    kind: "matrix",
    section: "08.2",
    title: "Gradientes, líneas y sombras",
    lead: "El sistema puede ser futurista sin depender de efectos exagerados.",
    items: [
      ["Gradiente principal", "Stage Black a Graphite 700 con un filo Pulse Cyan. Usar en portadas y hero de campaña."],
      ["Gradiente de energía", "Pulse Cyan a Peak Magenta solo para mapas, drops y visualización musical."],
      ["Líneas", "Divisores finos, retículas discretas y rutas de señal. Grosor entre 1 y 2 px."],
      ["Sombras", "Mínimas. Preferir borde, contraste y elevación por capa de fondo."],
      ["Bordes", "Radio base 6 px en producto; 8 px máximo en tarjetas promocionales."],
      ["Espaciado", "Sistema de 8 px con densidad alta en interfaces y más aire en piezas editoriales."],
    ],
    visual: "graphic-rules",
  },
  {
    kind: "matrix",
    section: "08.3",
    title: "Ilustración, fotografía y mockups",
    lead: "La marca debe mostrar el producto y el contexto real del DJ con claridad.",
    items: [
      ["Ilustración", "Abstracta, basada en líneas de energía y diagramas de flujo. No usar personajes ni escenas decorativas."],
      ["Fotografía", "Cabina, laptop, controladores y preparación backstage. Luz real, encuadre limpio, producto visible cuando sea posible."],
      ["Mockups", "Capturas nítidas de dashboard, cue assistant, exportación y mapa de energía."],
      ["Fondo", "Usar superficies dark o neutras, sin exceso de humo, luces borrosas ni atmósfera que impida entender el producto."],
      ["Composición", "Producto primero, texto segundo, detalle de señal como refuerzo."],
      ["Prohibido", "Stock genérico de fiesta sin interfaz, DJs de espaldas como única prueba visual, pantallas irreales."],
    ],
    visual: "mockups",
  },
  {
    kind: "chapter",
    section: "09",
    title: "Interfaz de producto",
    lead: "La UI de GigReady debe sentirse como una herramienta de revisión: rápida de escanear, estable y clara.",
    blocks: [
      {
        heading: "Dirección UI",
        body: "Quiet software. No competir con el contenido: priorizar tablas, estados, progreso, decisiones y exportaciones.",
      },
      {
        heading: "Herencia actual",
        body: "El producto ya usa superficies claras, bordes finos, radios bajos y tipografía densa. La marca puede elevar esa base con acento cian, estados más claros y visualizaciones más propias.",
      },
    ],
    visual: "ui-dashboard",
  },
  {
    kind: "ui",
    section: "09.1",
    title: "Dashboard",
    lead: "El dashboard debe responder tres preguntas en segundos: qué se analizó, qué está en riesgo y qué puedo hacer ahora.",
    items: [
      ["Score", "Número grande, rango claro y explicación breve. No usar color como único indicador."],
      ["Resumen", "Tracks, críticos, advertencias, duplicados, cues sugeridos y cues aprobados."],
      ["Prioridad", "Los problemas críticos deben aparecer antes de sugerencias menores."],
      ["Acción", "Accesos directos a Problemas, Duplicados, Memory Cues, Exportar y Carpeta limpia."],
    ],
    visual: "dashboard-detail",
  },
  {
    kind: "ui",
    section: "09.2",
    title: "Pantallas de análisis y progreso",
    lead: "Durante operaciones largas, la marca debe transmitir movimiento controlado, no espera incierta.",
    items: [
      ["Indicador de fase", "Descubriendo, revisando, detectando duplicados, analizando estructura, finalizando."],
      ["Barra de progreso", "Track fino, relleno Pulse Cyan o Signal Green según estado."],
      ["Archivo actual", "Usar mono y truncado seguro. No bloquear el layout con rutas largas."],
      ["Cancelar", "Acción visible, secundaria y confirmada cuando el proceso pueda dejar resultados parciales."],
    ],
    visual: "progress",
  },
  {
    kind: "ui",
    section: "09.3",
    title: "Estados vacíos, tarjetas y botones",
    lead: "Los estados vacíos deben orientar la próxima acción sin convertir la pantalla en material educativo.",
    items: [
      ["Estado vacío", "Título breve, una frase de contexto y un botón principal."],
      ["Tarjetas", "Usar para métricas y elementos repetidos. Radio 6 px, borde fino, sin tarjetas anidadas."],
      ["Botón primario", "Una acción principal por vista. Fondo Stage Black o Pulse Cyan según contexto."],
      ["Botón secundario", "Borde y texto. Mantener jerarquía clara en exportaciones y modales."],
    ],
    visual: "components",
  },
  {
    kind: "ui",
    section: "09.4",
    title: "Modales, tablas, gráficos y mensajes",
    lead: "Los componentes densos deben soportar uso repetido sin cansar.",
    items: [
      ["Modales", "Usar para confirmaciones, edición de cues y acciones con consecuencia. Texto corto, botones claros."],
      ["Tablas", "Encabezados persistentes cuando sea posible, filas compactas, severidad visible y filtros prácticos."],
      ["Gráficos", "Mapas de energía con ejes limpios, cues etiquetados y contraste suficiente."],
      ["Mensajes", "Éxito confirma resultado. Error explica causa y siguiente acción. Advertencia prioriza recomendación."],
    ],
    visual: "data-ui",
  },
  {
    kind: "chapter",
    section: "10",
    title: "Aplicaciones de marca",
    lead: "La identidad debe funcionar en producto, web, redes, documentación y materiales comerciales sin cambiar de personalidad.",
    blocks: [
      {
        heading: "Regla",
        body: "Mostrar siempre qué hace GigReady. La interfaz, el flujo de preparación y los estados reales son activos de marca.",
      },
      {
        heading: "Sistema",
        body: "Usar logotipo, color de acento, retícula de señal, mockups y mensajes centrados en preparación antes del show.",
      },
    ],
    visual: "applications",
  },
  {
    kind: "applications",
    section: "10.1",
    title: "Sitio web y landing pages",
    lead: "La primera pantalla debe mostrar GigReady como producto real, no como promesa abstracta.",
    items: [
      ["Hero", "Nombre GigReady visible, tagline breve, mockup nítido de dashboard o análisis, CTA de descarga o lista de espera."],
      ["Prueba", "Mostrar problemas detectados, memory cues y exportación Rekordbox con capturas reales."],
      ["Estructura", "Problema, flujo, funciones, compatibilidad, seguridad local, testimonios o casos y descarga."],
      ["Estilo", "Fondos dark con franjas claras para contenido largo. Evitar hero genérico de DJ con humo."],
    ],
    visual: "web",
  },
  {
    kind: "applications",
    section: "10.2",
    title: "App desktop, GitHub y documentación técnica",
    lead: "El canal técnico debe mantener claridad y confianza.",
    items: [
      ["App desktop", "Icono dark, splash sobrio, sidebar limpia, estados claros y documentación accesible."],
      ["GitHub", "README con logo horizontal, descripción directa, capturas reales, instalación, seguridad y roadmap."],
      ["Documentación", "Usar títulos de tarea, ejemplos de exportación, tablas y advertencias bien diferenciadas."],
      ["Changelog", "Mensaje breve por versión, separado por correcciones, mejoras y limitaciones conocidas."],
    ],
    visual: "docs",
  },
  {
    kind: "applications",
    section: "10.3",
    title: "LinkedIn, YouTube y redes sociales",
    lead: "Las redes deben educar y demostrar, no solo anunciar.",
    items: [
      ["LinkedIn", "Casos de uso, aprendizajes de producto, preparación profesional, capturas sobrias."],
      ["YouTube", "Miniaturas con interfaz real, score visible y frase concreta como 'Revisa tu USB antes de tocar'."],
      ["Instagram/TikTok", "Clips cortos de antes/después: carpeta desordenada, análisis, cues, exportación."],
      ["Regla visual", "Un mockup claro, un mensaje, un acento de pulso. No saturar con múltiples claims."],
    ],
    visual: "social",
  },
  {
    kind: "applications",
    section: "10.4",
    title: "Presentaciones, papelería y merchandising",
    lead: "Las aplicaciones físicas deben ser sobrias, táctiles y reconocibles.",
    items: [
      ["Presentaciones", "Portadas dark, slides de datos claras, diagramas de flujo y capturas reales."],
      ["Papelería", "Tarjetas con isotipo, Ready White, Graphite y un filo Pulse Cyan."],
      ["Stickers", "Isotipo o frase 'Ready before the first beat' en formatos compactos."],
      ["Merchandising", "Negro, blanco y acento cian. Usar símbolo pequeño, no composiciones ruidosas."],
      ["Firma de correo", "Nombre, cargo, logo horizontal pequeño, sitio y tagline corto."],
    ],
    visual: "merch",
  },
  {
    kind: "chapter",
    section: "11",
    title: "Material promocional",
    lead: "La promoción debe vender la sensación real: abrir la app y saber qué está listo.",
    blocks: [
      {
        heading: "Idea creativa",
        body: "Antes del show, todo claro. La campaña muestra contraste entre revisión manual y flujo preparado.",
      },
      {
        heading: "Sistema visual",
        body: "Mockups, score, cues y líneas de energía. Mensajes breves con foco en tiempo, confianza y compatibilidad.",
      },
    ],
    visual: "promo",
  },
  {
    kind: "applications",
    section: "11.1",
    title: "Banners y afiches",
    lead: "Los banners deben poder leerse en segundos y dirigir a una acción.",
    items: [
      ["Banner web", "Headline de 6 a 9 palabras, mockup de producto y CTA claro."],
      ["Afiche", "Logo, tagline, visual de mapa de energía y beneficio: 'Tu biblioteca lista antes del show'."],
      ["Formatos", "16:9, 4:5, 1:1 y vertical 9:16, siempre con zona segura para texto."],
      ["Composición", "No más de dos pesos tipográficos, un acento cromático y alto contraste."],
    ],
    visual: "banners",
  },
  {
    kind: "applications",
    section: "11.2",
    title: "Anuncios y publicaciones sociales",
    lead: "Cada publicación debe enfocarse en una tarea: revisar, detectar, aprobar o exportar.",
    items: [
      ["Anuncio 1", "Problema: '¿Seguro que tu USB está listo?' Visual: score y advertencias."],
      ["Anuncio 2", "Beneficio: 'Memory cues sin revisar cada track a mano.' Visual: mapa de energía."],
      ["Anuncio 3", "Compatibilidad: 'Exporta XML para Rekordbox.' Visual: flujo exportar."],
      ["CTA", "Descargar, probar, ver demo o unirse a beta. No mezclar varios CTAs."],
    ],
    visual: "ads",
  },
  {
    kind: "applications",
    section: "11.3",
    title: "YouTube, Product Hunt y AppSumo",
    lead: "Las plataformas de descubrimiento necesitan señales claras de producto, beneficio y credibilidad.",
    items: [
      ["YouTube thumbnail", "Cara o cabina solo si aporta contexto; interfaz siempre visible y texto de máximo 5 palabras."],
      ["Product Hunt", "Galería con hero, flujo en 3 pasos, dashboard, cues, exportación y seguridad local."],
      ["AppSumo", "Destacar valor para usuarios intensivos: ahorro de tiempo, licencia desktop, exportaciones y roadmap."],
      ["Capturas", "Usar datos ficticios realistas y evitar información personal, rutas reales o nombres de archivos sensibles."],
    ],
    visual: "marketplaces",
  },
  {
    kind: "chapter",
    section: "12",
    title: "Accesibilidad",
    lead: "La accesibilidad de GigReady no es una capa adicional. Es parte de la promesa de confianza.",
    blocks: [
      {
        heading: "Objetivo",
        body: "Permitir que un DJ cansado, con poco tiempo o en una pantalla complicada pueda entender qué requiere atención.",
      },
      {
        heading: "Regla",
        body: "Todo estado crítico debe tener color, texto y forma. Ninguna decisión importante debe depender solo de un acento cromático.",
      },
    ],
    visual: "accessibility",
  },
  {
    kind: "accessibility",
    section: "12.1",
    title: "Contraste y legibilidad",
    lead: "El sistema apunta a WCAG AA como mínimo y AAA cuando el contexto es crítico o de lectura larga.",
    items: [
      ["Texto normal", "Contraste mínimo 4.5:1."],
      ["Texto grande", "Contraste mínimo 3:1."],
      ["Estados críticos", "Preferir 7:1 cuando sea posible."],
      ["Tamaño de interfaz", "13 px mínimo para datos secundarios; 15 px recomendado para contenido operativo."],
      ["Rutas y logs", "Usar mono, truncado medio y tooltip o expansión para lectura completa."],
    ],
    visual: "contrast",
  },
  {
    kind: "accessibility",
    section: "12.2",
    title: "Modo claro y modo oscuro",
    lead: "GigReady puede vivir en ambos modos, pero cada modo tiene una función.",
    items: [
      ["Modo claro", "Ideal para tablas, documentación, revisiones largas y trabajo diurno."],
      ["Modo oscuro", "Ideal para cabina, visualizaciones de energía y sesiones nocturnas."],
      ["Acentos", "Pulse Cyan necesita fondo suficiente. En modo claro debe usarse con Stage Black para texto importante."],
      ["Focus", "Anillo de foco visible de 2 px, preferentemente Wave Blue o Pulse Cyan según fondo."],
      ["Movimiento", "Animaciones de progreso breves y reducibles con prefers-reduced-motion."],
    ],
    visual: "light-dark",
  },
  {
    kind: "chapter",
    section: "13",
    title: "Sistema de diseño",
    lead: "El design system traduce la identidad a reglas que desarrolladores y diseñadores pueden aplicar sin reinterpretar todo.",
    blocks: [
      {
        heading: "Base",
        body: "Sistema de 8 px, radios bajos, componentes densos, estados explícitos y visualización de datos clara.",
      },
      {
        heading: "Promesa operacional",
        body: "Cada componente debe ayudar a decidir más rápido: revisar, aprobar, descartar, exportar o volver al dashboard.",
      },
    ],
    visual: "design-system",
  },
  {
    kind: "matrix",
    section: "13.1",
    title: "Grid, espaciado, radios y elevaciones",
    lead: "Las reglas estructurales sostienen la sensación premium más que cualquier efecto visual.",
    items: [
      ["Grid", "12 columnas para web, sidebar fija en desktop app, columnas de 280 px mínimo para cards."],
      ["Espaciado", "Escala 4, 8, 12, 16, 24, 32, 48, 64. Usar 8 como base real."],
      ["Radio", "4 px para badges y chips, 6 px para botones y cards, 8 px máximo para piezas editoriales."],
      ["Elevación", "Bordes y contraste primero. Sombras suaves solo para overlays o modales."],
      ["Densidad", "Alta en tablas y listas; media en dashboard; amplia en marketing y presentaciones."],
      ["Divisores", "Mist 200 en claro y Graphite 700 en oscuro, opacidad moderada."],
    ],
    visual: "grid",
  },
  {
    kind: "matrix",
    section: "13.2",
    title: "Componentes reutilizables",
    lead: "Los componentes deben tener estados completos desde el primer diseño.",
    items: [
      ["Botones", "Primary, secondary, ghost, danger, loading, disabled, icon-only."],
      ["Inputs", "Label, ayuda, error, disabled, loading y validación."],
      ["Tabs", "Vistas de análisis, historial, exportaciones y configuración."],
      ["Badges", "Critical, warning, info, ready, suggested, approved, discarded."],
      ["Cards", "Métrica, issue, export option, cue summary y empty state."],
      ["Tablas", "Filtros, orden, selección, fila expandible y estado vacío."],
    ],
    visual: "component-library",
  },
  {
    kind: "matrix",
    section: "13.3",
    title: "Estados hover, focus y disabled",
    lead: "Un software de preparación debe ser predecible en cada interacción.",
    items: [
      ["Hover", "Cambio sutil de fondo o borde. No desplazar layout ni cambiar tamaños."],
      ["Focus", "Visible siempre, incluso con mouse si el componente queda activo."],
      ["Pressed", "Reducir contraste o aplicar fondo activo; duración 120 ms."],
      ["Disabled", "Texto y borde atenuados, cursor adecuado y tooltip si la razón no es obvia."],
      ["Loading", "Spinner pequeño o barra; conservar ancho del botón para evitar saltos."],
      ["Error", "Mensaje cercano al control, recomendación concreta y severidad consistente."],
    ],
    visual: "states",
  },
  {
    kind: "chapter",
    section: "14",
    title: "Experiencia de marca",
    lead: "La marca se recuerda por cómo acompaña al usuario en momentos concretos, no solo por su logo.",
    blocks: [
      {
        heading: "Emoción deseada",
        body: "Antes: incertidumbre. Durante: claridad. Después: confianza silenciosa.",
      },
      {
        heading: "Principio",
        body: "Cada interacción debe confirmar que GigReady está reduciendo carga mental sin quitar control.",
      },
    ],
    visual: "experience",
  },
  {
    kind: "journey",
    section: "14.1",
    title: "Descubrimiento, compra e instalación",
    lead: "El primer contacto debe convertir una molestia conocida en una solución creíble.",
    steps: [
      ["Descubrimiento", "Siente alivio al ver una herramienta enfocada en preparación real, no en promesas abstractas."],
      ["Compra", "Debe entender licencia, compatibilidad, sistema operativo y qué exportaciones obtiene."],
      ["Instalación", "Proceso limpio, icono reconocible, permisos claros y apertura rápida."],
      ["Primer arranque", "La app debe pedir una carpeta y explicar el modo solo lectura con una frase breve."],
    ],
    visual: "journey-1",
  },
  {
    kind: "journey",
    section: "14.2",
    title: "Primer uso y uso diario",
    lead: "La primera sesión debe entregar valor antes de pedir configuración avanzada.",
    steps: [
      ["Primer escaneo", "Progreso visible, lenguaje calmado y resultado entendible al terminar."],
      ["Revisión", "Priorizar críticos y duplicados; no abrumar con metadata faltante."],
      ["Cues", "Mostrar sugerencias como punto de partida, con confianza y posibilidad de aprobar o descartar."],
      ["Exportación", "El usuario debe saber qué se generó, dónde quedó y cómo usarlo en Rekordbox."],
    ],
    visual: "journey-2",
  },
  {
    kind: "journey",
    section: "14.3",
    title: "Actualizaciones y soporte",
    lead: "La confianza crece cuando el producto comunica cambios con precisión.",
    steps: [
      ["Actualización", "Explicar mejoras en lenguaje de usuario: qué ahora se prepara mejor."],
      ["Error", "No culpar al archivo ni al usuario. Mostrar causa probable y alternativa."],
      ["Soporte", "Pedir versión, sistema, log y paso realizado. Mantener tono experto y cercano."],
      ["Seguimiento", "Confirmar resolución y sugerir una práctica preventiva cuando corresponda."],
    ],
    visual: "journey-3",
  },
  {
    kind: "chapter",
    section: "15",
    title: "Roadmap de evolución visual",
    lead: "La identidad debe evolucionar durante cinco años sin perder reconocimiento.",
    blocks: [
      {
        heading: "Regla de continuidad",
        body: "Conservar nombre, isotipo de pulso, contraste dark/light y acento Pulse Cyan. Evolucionar composición, motion y profundidad del sistema.",
      },
      {
        heading: "Riesgo a evitar",
        body: "Cambiar de estética con cada campaña. GigReady debe madurar, no disfrazarse de tendencia.",
      },
    ],
    visual: "roadmap-intro",
  },
  {
    kind: "roadmap",
    section: "15.1",
    title: "Cinco años de evolución",
    lead: "La evolución visual acompaña el crecimiento del producto y sus mercados.",
    steps: [
      ["Año 0", "Fundación", "Logo, paleta, verbal identity, UI tokens, brand book y capturas consistentes."],
      ["Año 1", "Producto", "Refinar iconografía, dark mode, mockups reales y biblioteca de componentes."],
      ["Año 2", "Motion", "Agregar microinteracciones, línea de pulso animada y visualizaciones de energía más propias."],
      ["Año 3", "Ecosistema", "Adaptar identidad a macOS, web account, documentación pública y partnerships."],
      ["Año 4", "Internacional", "Sistemas de localización, campañas por mercado y casos de uso por género musical."],
      ["Año 5", "Plataforma", "Extender símbolo a suite de herramientas sin perder el Pulse Mark como raíz."],
    ],
    visual: "roadmap",
  },
  {
    kind: "governance",
    section: "16",
    title: "Gobernanza de marca",
    lead: "La consistencia requiere reglas de revisión y activos controlados.",
    items: [
      ["Archivo maestro", "Mantener logo, paleta, tokens y plantillas en una carpeta de marca versionada."],
      ["Revisión", "Toda pieza externa debe revisar logo, contraste, tono, mockup real y mensaje principal."],
      ["Nombres", "GigReady siempre en una palabra. Memory Cues puede escribirse con mayúsculas iniciales en contexto de función."],
      ["Versionado", "Actualizar este manual cuando cambien UI tokens, logotipo, tagline o criterios de accesibilidad."],
      ["No negociable", "Nunca prometer precisión perfecta ni reemplazo del criterio musical del DJ."],
    ],
    visual: "governance",
  },
  {
    kind: "closing",
    section: "17",
    title: "Cierre",
    lead: "GigReady debe sentirse como llegar temprano a cabina: todo revisado, todo claro, nada de más.",
    quote: "Menos revisión manual. Más música preparada.",
    visual: "closing",
  },
];

function ensureDirs() {
  [brandDir, assetDir, pdfDir, shotDir].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToCmyk({ r, g, b }) {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const k = 1 - Math.max(rp, gp, bp);
  const c = (1 - rp - k) / (1 - k);
  const m = (1 - gp - k) / (1 - k);
  const y = (1 - bp - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return channel[0] * 0.2126 + channel[1] * 0.7152 + channel[2] * 0.0722;
}

function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

function enrichedPalette() {
  return palette.map((color) => {
    const rgb = hexToRgb(color.hex);
    const cmyk = rgbToCmyk(rgb);
    return {
      ...color,
      rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
      cmyk: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`,
      contrastOnBlack: contrastRatio(color.hex, "#080A0E"),
      contrastOnWhite: contrastRatio(color.hex, "#F7F8F6"),
    };
  });
}

const colors = enrichedPalette();

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getColor(name) {
  const color = colors.find((item) => item.name === name);
  if (!color) throw new Error(`Color not found: ${name}`);
  return color;
}

function pulseSymbolSvg({ dark = true, width = 220, height = 220 } = {}) {
  const bg = dark ? "#080A0E" : "#F7F8F6";
  const stroke = dark ? "#F7F8F6" : "#080A0E";
  const accent = "#47F4E6";
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="${width}" height="${height}" role="img" aria-label="GigReady Pulse Mark">
  <rect x="10" y="10" width="200" height="200" rx="38" fill="${bg}"/>
  <path d="M72 147c-18 0-32-12-32-28s14-28 32-28h18V50" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M90 50h34l25 25v32l-59-49" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M88 147l29-53 35 79 36-119 22 70h32" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M150 173l29-58 21 47 19-38" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter" opacity="0.95"/>
</svg>`;
}

function horizontalLogoSvg({ dark = true } = {}) {
  const text = dark ? "#F7F8F6" : "#080A0E";
  const sub = dark ? "#D9DEE3" : "#2A2F36";
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 220" role="img" aria-label="GigReady logo horizontal">
  ${pulseSymbolSvg({ dark, width: 220, height: 220 })}
  <text x="260" y="110" fill="${text}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="72" font-weight="700">GigReady</text>
  <text x="264" y="150" fill="${sub}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="22" font-weight="500">Ready before the first beat.</text>
</svg>`;
}

function writeAssets() {
  fs.writeFileSync(path.join(assetDir, "gigready-pulse-mark.svg"), pulseSymbolSvg(), "utf8");
  fs.writeFileSync(path.join(assetDir, "gigready-pulse-mark-light.svg"), pulseSymbolSvg({ dark: false }), "utf8");
  fs.writeFileSync(path.join(assetDir, "gigready-logo-horizontal.svg"), horizontalLogoSvg(), "utf8");
  fs.writeFileSync(path.join(assetDir, "gigready-logo-horizontal-light.svg"), horizontalLogoSvg({ dark: false }), "utf8");
  fs.writeFileSync(
    path.join(assetDir, "brand-tokens.json"),
    JSON.stringify(
      {
        name: "GigReady",
        version: documentMeta.version,
        generatedAt: documentMeta.date,
        colors: colors.map(({ name, hex, rgb, cmyk, role, use }) => ({ name, hex, rgb, cmyk, role, use })),
        typography: {
          primary: ["Inter", "SF Pro", "Segoe UI", "system-ui", "sans-serif"],
          secondary: ["Manrope", "Aptos", "Inter", "sans-serif"],
          mono: ["SFMono-Regular", "IBM Plex Mono", "Consolas", "monospace"],
        },
        spacing: [4, 8, 12, 16, 24, 32, 48, 64],
        radius: { badge: 4, component: 6, editorial: 8 },
      },
      null,
      2,
    ),
    "utf8",
  );
}

function css() {
  return `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #1b1f26; }
body {
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  color: #101318;
  letter-spacing: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page {
  width: 210mm;
  height: 297mm;
  page-break-after: always;
  break-after: page;
  position: relative;
  overflow: hidden;
  background: #F7F8F6;
  padding: 17mm 18mm 16mm;
  display: flex;
  flex-direction: column;
}
.page.dark { background: #080A0E; color: #F7F8F6; }
.page.dark p, .page.dark li, .page.dark .muted { color: #D9DEE3; }
.page::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(42,47,54,0.055) 1px, transparent 1px),
    linear-gradient(180deg, rgba(42,47,54,0.05) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}
.page.dark::before {
  background:
    linear-gradient(90deg, rgba(247,248,246,0.055) 1px, transparent 1px),
    linear-gradient(180deg, rgba(247,248,246,0.045) 1px, transparent 1px);
  background-size: 24px 24px;
}
.page > * { position: relative; z-index: 1; }
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 28px;
  margin-bottom: 12mm;
  color: #5E6874;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
.dark .topbar { color: #AEB7C2; }
.topbar .rule {
  height: 1px;
  flex: 1;
  background: currentColor;
  opacity: 0.35;
}
h1, h2, h3, p { margin: 0; letter-spacing: 0; }
h1 {
  font-size: 42px;
  line-height: 0.98;
  font-weight: 760;
  max-width: 16ch;
}
h2 {
  font-size: 30px;
  line-height: 1.05;
  font-weight: 720;
}
h3 {
  font-size: 13px;
  line-height: 1.25;
  font-weight: 720;
  margin-bottom: 7px;
}
p, li {
  font-size: 11.4px;
  line-height: 1.58;
  color: #3A414A;
}
.dark p, .dark li { color: #D6DCE3; }
.lead {
  font-size: 17px;
  line-height: 1.38;
  color: #2A2F36;
  max-width: 760px;
  margin-top: 12px;
}
.dark .lead { color: #F7F8F6; }
.section-id {
  font-size: 12px;
  font-weight: 800;
  color: #246BFD;
  margin-bottom: 10px;
}
.dark .section-id { color: #47F4E6; }
.content-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 16mm;
  align-items: start;
  margin-top: 13mm;
}
.block-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.block {
  border: 1px solid #D9DEE3;
  border-radius: 8px;
  padding: 12px 13px 13px;
  background: rgba(255,255,255,0.54);
}
.dark .block {
  border-color: rgba(217,222,227,0.22);
  background: rgba(247,248,246,0.045);
}
.block.full { grid-column: 1 / -1; }
.visual-panel {
  border: 1px solid rgba(42,47,54,0.16);
  border-radius: 8px;
  min-height: 210px;
  background: #FFFFFF;
  overflow: hidden;
  padding: 18px;
}
.dark .visual-panel {
  border-color: rgba(247,248,246,0.18);
  background: rgba(247,248,246,0.035);
}
.footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 7mm;
  color: #7D8792;
  font-size: 10px;
  font-weight: 600;
}
.dark .footer { color: #AEB7C2; }
.footer strong { color: inherit; }
.cover {
  padding: 20mm;
  background:
    radial-gradient(circle at 78% 22%, rgba(71,244,230,0.18), transparent 26%),
    linear-gradient(135deg, #080A0E 0%, #111820 52%, #080A0E 100%);
}
.cover::before {
  background:
    linear-gradient(90deg, rgba(71,244,230,0.09) 1px, transparent 1px),
    linear-gradient(180deg, rgba(247,248,246,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
}
.cover .brand-lockup {
  width: 185mm;
  margin: 8mm 0 0;
}
.cover h1 {
  font-size: 76px;
  color: #F7F8F6;
  max-width: none;
  margin-top: 18mm;
}
.cover .lead { color: #F7F8F6; font-size: 24px; max-width: 600px; }
.cover .meta-lines {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
  color: #D9DEE3;
  border-top: 1px solid rgba(247,248,246,0.2);
  padding-top: 14px;
}
.cover .meta-lines p { color: #D9DEE3; font-size: 12px; }
.snapshot-band {
  margin-top: 13mm;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.snapshot-card {
  min-height: 88px;
  border: 1px solid #D9DEE3;
  border-radius: 8px;
  padding: 12px;
  background: #FFFFFF;
}
.toc-list { margin-top: 16mm; display: grid; grid-template-columns: 1fr 1fr; gap: 9px 18px; }
.toc-row {
  display: grid;
  grid-template-columns: 32px 1fr 24px;
  gap: 9px;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid #D9DEE3;
}
.toc-row span:first-child { color: #246BFD; font-weight: 800; font-size: 11px; }
.toc-row span:nth-child(2) { font-size: 12px; font-weight: 680; }
.toc-row span:last-child { font-size: 10px; color: #7D8792; text-align: right; }
.matrix {
  margin-top: 10mm;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}
.matrix-item {
  border-left: 3px solid #47F4E6;
  padding: 9px 12px;
  background: #FFFFFF;
  border-radius: 0 8px 8px 0;
  min-height: 76px;
}
.matrix-item h3 { color: #080A0E; }
.quote {
  margin: 15mm 0 7mm;
  padding: 15mm;
  background: #080A0E;
  color: #F7F8F6;
  border-radius: 8px;
  font-size: 29px;
  line-height: 1.15;
  font-weight: 720;
}
.dark .quote {
  background: rgba(247,248,246,0.08);
  border: 1px solid rgba(247,248,246,0.16);
}
.color-grid {
  margin-top: 10mm;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.color-card {
  display: grid;
  grid-template-columns: 92px 1fr;
  min-height: 132px;
  border: 1px solid #D9DEE3;
  border-radius: 8px;
  overflow: hidden;
  background: #FFFFFF;
}
.swatch { min-height: 132px; }
.color-info { padding: 12px; }
.spec {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin: 8px 0;
  font-size: 9px;
  color: #5E6874;
  font-family: "SFMono-Regular", Consolas, monospace;
}
.state-notes {
  margin-top: 10mm;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.state-note { background: #FFFFFF; border: 1px solid #D9DEE3; border-radius: 8px; padding: 10px; }
.logo-board {
  margin-top: 11mm;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}
.logo-tile {
  border: 1px solid #D9DEE3;
  border-radius: 8px;
  min-height: 136px;
  padding: 14px;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.logo-tile.dark-tile { background: #080A0E; color: #F7F8F6; border-color: #2A2F36; }
.logo-tile small { color: #7D8792; font-size: 9px; font-weight: 700; margin-top: 8px; }
.bad-example {
  min-height: 106px;
  border: 1px solid #D9DEE3;
  border-radius: 8px;
  background: #FFFFFF;
  padding: 10px;
  display: grid;
  grid-template-columns: 74px 1fr;
  gap: 10px;
  align-items: center;
}
.bad-symbol { width: 74px; height: 74px; display: grid; place-items: center; overflow: hidden; }
.sample-ui {
  background: #F7F8F6;
  border: 1px solid #D9DEE3;
  border-radius: 8px;
  overflow: hidden;
  min-height: 250px;
  color: #080A0E;
}
.sample-ui p { color: #3A414A; }
.sample-ui .micro { color: #7D8792; }
.sample-ui .bar { height: 34px; background: #080A0E; display: flex; align-items: center; gap: 8px; padding: 0 12px; color: #F7F8F6; font-size: 10px; font-weight: 700; }
.sample-ui .body { display: grid; grid-template-columns: 120px 1fr; min-height: 216px; }
.sample-ui .side { background: #FFFFFF; border-right: 1px solid #D9DEE3; padding: 10px; }
.sample-ui .main { padding: 12px; }
.metric-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.metric { background: #FFFFFF; border: 1px solid #D9DEE3; border-radius: 6px; padding: 8px; min-height: 58px; }
.metric b { display: block; font-size: 20px; margin-bottom: 4px; }
.wave {
  height: 76px;
  border: 1px solid #D9DEE3;
  border-radius: 6px;
  background: linear-gradient(180deg, #FFFFFF, #F0F4F5);
  overflow: hidden;
}
.journey {
  margin-top: 13mm;
  display: grid;
  gap: 11px;
}
.journey-step {
  display: grid;
  grid-template-columns: 28px 150px 1fr;
  gap: 12px;
  align-items: start;
  padding: 11px 0;
  border-bottom: 1px solid #D9DEE3;
}
.journey-step .dot {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #47F4E6;
  color: #080A0E;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 800;
}
.roadmap {
  margin-top: 12mm;
  display: grid;
  gap: 8px;
}
.roadmap-row {
  display: grid;
  grid-template-columns: 70px 110px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #D9DEE3;
  border-radius: 8px;
  background: #FFFFFF;
}
.roadmap-row strong { color: #246BFD; font-size: 12px; }
.closing-mark {
  margin: auto;
  text-align: center;
}
.closing-mark svg { width: 170px; height: 170px; }
.closing-mark h1 { max-width: none; margin-top: 16px; }
.micro { font-size: 9.5px; color: #7D8792; line-height: 1.45; }
.dark .micro { color: #AEB7C2; }
ul.clean { margin: 0; padding-left: 16px; }
`;
}

function topbar(page, index) {
  if (page.kind === "cover") return "";
  return `
  <div class="topbar">
    <span>${esc(page.section || "GigReady")}</span>
    <span class="rule"></span>
    <span>${String(index + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}</span>
  </div>`;
}

function footer(page, index) {
  if (page.kind === "cover") return "";
  return `
  <div class="footer">
    <span><strong>GigReady</strong> Brand Book</span>
    <span>${esc(documentMeta.version)} - ${esc(documentMeta.date)}</span>
    <span>${String(index + 1).padStart(2, "0")}</span>
  </div>`;
}

function header(page) {
  return `
  <div>
    ${page.section ? `<div class="section-id">${esc(page.section)}</div>` : ""}
    <h1>${esc(page.title)}</h1>
    ${page.lead ? `<p class="lead">${esc(page.lead)}</p>` : ""}
  </div>`;
}

function renderBlocks(blocks = []) {
  return `<div class="block-grid">${blocks
    .map(
      (block, idx) => `
    <div class="block ${idx === blocks.length - 1 && blocks.length % 2 === 1 ? "full" : ""}">
      <h3>${esc(block.heading)}</h3>
      <p>${esc(block.body)}</p>
    </div>`,
    )
    .join("")}</div>`;
}

function renderMatrix(items = []) {
  return `<div class="matrix">${items
    .map(
      ([heading, body]) => `
    <div class="matrix-item">
      <h3>${esc(heading)}</h3>
      <p>${esc(body)}</p>
    </div>`,
    )
    .join("")}</div>`;
}

function renderVisual(name) {
  const symbol = pulseSymbolSvg({ width: 110, height: 110 });
  if (name === "cover") return horizontalLogoSvg();
  if (name === "logo-large") {
    return `<div class="logo-board">
      <div class="logo-tile dark-tile">${horizontalLogoSvg()}<small>Versión principal dark</small></div>
      <div class="logo-tile">${horizontalLogoSvg({ dark: false })}<small>Versión principal light</small></div>
    </div>`;
  }
  if (name === "logo-versions") {
    return `<div class="logo-board">
      <div class="logo-tile dark-tile">${horizontalLogoSvg()}<small>Horizontal</small></div>
      <div class="logo-tile">${pulseSymbolSvg({ dark: false, width: 120, height: 120 })}<small>Isotipo</small></div>
      <div class="logo-tile dark-tile" style="align-items:center">${pulseSymbolSvg({ width: 118, height: 118 })}<small>Vertical compacta</small></div>
      <div class="logo-tile"><div style="font-size:36px;font-weight:800;color:#080A0E">GigReady</div><small>Wordmark</small></div>
    </div>`;
  }
  if (name === "responsive") {
    return `<div class="logo-board">
      <div class="logo-tile dark-tile">${horizontalLogoSvg()}<small>Mayor a 140 px</small></div>
      <div class="logo-tile"><div style="font-size:40px;font-weight:800">GigReady</div><small>96 a 139 px</small></div>
      <div class="logo-tile dark-tile" style="align-items:center">${pulseSymbolSvg({ width: 86, height: 86 })}<small>Menor a 96 px</small></div>
      <div class="logo-tile"><div style="display:flex;gap:10px;align-items:center">${pulseSymbolSvg({ dark: false, width: 54, height: 54 })}<strong>App icon</strong></div><small>Favicon y app</small></div>
    </div>`;
  }
  if (name === "clearspace") {
    return `<div class="visual-panel">
      <div style="height:100%;display:grid;place-items:center">
        <div style="padding:28px;border:1px dashed #246BFD;background:#F7F8F6">
          <div style="width:210px;padding:22px;border:1px dashed #47F4E6;display:grid;place-items:center">
            ${pulseSymbolSvg({ dark: false, width: 124, height: 124 })}
          </div>
        </div>
        <p class="micro" style="margin-top:10px">Zona exterior: 2X. Zona interior de referencia: 1.5X.</p>
      </div>
    </div>`;
  }
  if (name === "construction") {
    return `<div class="visual-panel">
      <svg viewBox="0 0 520 280" width="100%" height="250" xmlns="http://www.w3.org/2000/svg">
        <rect width="520" height="280" fill="#F7F8F6"/>
        ${Array.from({ length: 27 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="280" stroke="#D9DEE3" stroke-width="1"/>`).join("")}
        ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="520" y2="${i * 20}" stroke="#D9DEE3" stroke-width="1"/>`).join("")}
        <g transform="translate(34 34) scale(0.82)">${pulseSymbolSvg({ dark: false, width: 220, height: 220 })}</g>
        <text x="250" y="130" fill="#080A0E" font-size="54" font-weight="760" font-family="Inter, Segoe UI">GigReady</text>
        <path d="M250 154h220" stroke="#47F4E6" stroke-width="5"/>
        <text x="250" y="185" fill="#5E6874" font-size="18" font-family="Inter, Segoe UI">12X symbol - 2X gap - wordmark</text>
      </svg>
    </div>`;
  }
  if (name === "incorrect") {
    const bads = [
      ["scaleX(1.35)", "Deformación"],
      ["rotate(-14deg)", "Rotación"],
      ["", "Color arbitrario"],
      ["", "Efectos"],
      ["", "Bajo contraste"],
      ["scaleY(0.72)", "Mala proporción"],
    ];
    return `<div class="matrix">${bads
      .map(([transform, label], i) => {
        const fill = i === 2 ? "#FF8A00" : i === 4 ? "#D9DEE3" : "#080A0E";
        const extra = i === 3 ? "filter: drop-shadow(8px 8px 0 #FF4FD8);" : "";
        const bg = i === 4 ? "#F7F8F6" : "#FFFFFF";
        return `<div class="bad-example" style="background:${bg}">
          <div class="bad-symbol" style="transform:${transform};${extra}">
            <svg viewBox="0 0 80 80" width="70" height="70"><path d="M20 54c-8 0-14-5-14-12s6-12 14-12h8V8" fill="none" stroke="${fill}" stroke-width="5"/><path d="M28 8h16l12 12v16L28 13" fill="none" stroke="${fill}" stroke-width="5"/><path d="M28 55l13-26 16 39 16-55 10 31h16" fill="none" stroke="#47F4E6" stroke-width="5"/></svg>
          </div>
          <div><h3>No ${esc(label.toLowerCase())}</h3><p>Evita este uso para preservar lectura y reconocimiento.</p></div>
        </div>`;
      })
      .join("")}</div>`;
  }
  if (name?.startsWith("ui") || ["dashboard-detail", "progress", "components", "data-ui"].includes(name)) {
    return renderUiMock(name);
  }
  if (name?.startsWith("journey")) {
    return renderWaveVisual("journey");
  }
  if (name === "roadmap") {
    return renderWaveVisual("roadmap");
  }
  if (name === "light-dark") {
    return `<div class="logo-board">
      <div class="logo-tile">${renderMiniDashboard(false)}<small>Modo claro</small></div>
      <div class="logo-tile dark-tile">${renderMiniDashboard(true)}<small>Modo oscuro</small></div>
    </div>`;
  }
  if (name === "contrast") {
    return `<div class="visual-panel">
      <h3>Contrastes recomendados</h3>
      <div class="matrix" style="margin-top:10px">
        <div class="matrix-item"><h3>Stage Black / Ready White</h3><p>${contrastRatio("#080A0E", "#F7F8F6")}:1 - lectura principal.</p></div>
        <div class="matrix-item"><h3>Pulse Cyan / Stage Black</h3><p>${contrastRatio("#47F4E6", "#080A0E")}:1 - acento accesible en dark.</p></div>
        <div class="matrix-item"><h3>Graphite / Ready White</h3><p>${contrastRatio("#2A2F36", "#F7F8F6")}:1 - texto de interfaz.</p></div>
        <div class="matrix-item"><h3>Risk Red / Ready White</h3><p>${contrastRatio("#E84A5F", "#F7F8F6")}:1 - usar con texto Graphite si hace falta.</p></div>
      </div>
    </div>`;
  }
  if (name === "type-samples" || name === "hierarchy" || name === "type") {
    return `<div class="visual-panel">
      <div style="font-size:52px;font-weight:780;line-height:1;color:#080A0E">Ready before<br/>the first beat.</div>
      <div style="margin-top:18px;font-size:20px;font-weight:650;color:#2A2F36">Revisa, prepara y exporta tu música.</div>
      <div style="margin-top:18px;font-family:Consolas,monospace;font-size:13px;color:#5E6874">C:\\Music\\Set\\track-ready.wav</div>
      <div style="margin-top:18px;border-top:1px solid #D9DEE3;padding-top:12px;display:grid;gap:6px">
        <p><strong>Inter/SF Pro:</strong> interfaz, marketing y documentación.</p>
        <p><strong>Mono:</strong> rutas, XML, logs y valores técnicos.</p>
      </div>
    </div>`;
  }
  if (name === "grid" || name === "design-system" || name === "component-library" || name === "states") {
    return renderDesignSystemVisual(name);
  }
  if (name === "closing") {
    return `<div class="closing-mark">${pulseSymbolSvg({ width: 180, height: 180 })}<h1>GigReady</h1><p class="lead">Ready before the first beat.</p></div>`;
  }
  return `<div class="visual-panel">${symbol}${renderWaveVisual(name)}</div>`;
}

function renderWaveVisual(name = "signal") {
  return `
  <svg viewBox="0 0 560 300" width="100%" height="220" xmlns="http://www.w3.org/2000/svg" aria-label="${esc(name)} visual">
    <rect width="560" height="300" rx="18" fill="#080A0E"/>
    ${Array.from({ length: 18 }, (_, i) => `<line x1="${30 + i * 30}" y1="24" x2="${30 + i * 30}" y2="276" stroke="#F7F8F6" stroke-opacity="0.06"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="24" y1="${42 + i * 34}" x2="536" y2="${42 + i * 34}" stroke="#F7F8F6" stroke-opacity="0.06"/>`).join("")}
    <path d="M35 198 C80 160 95 225 136 185 C175 147 196 92 238 127 C278 160 287 235 330 200 C372 166 389 62 430 84 C468 104 470 164 523 132" fill="none" stroke="#47F4E6" stroke-width="6" stroke-linecap="square"/>
    <path d="M35 225 C87 210 110 238 145 215 C188 187 202 148 239 166 C278 185 294 238 332 228 C380 216 388 118 432 132 C474 146 486 190 523 172" fill="none" stroke="#FF4FD8" stroke-opacity="0.78" stroke-width="3"/>
    <circle cx="238" cy="127" r="7" fill="#FFB84D"/>
    <circle cx="430" cy="84" r="7" fill="#19C37D"/>
    <text x="35" y="52" fill="#F7F8F6" font-size="22" font-family="Inter, Segoe UI" font-weight="760">Energy map</text>
    <text x="35" y="78" fill="#AEB7C2" font-size="13" font-family="Inter, Segoe UI">Intro - Groove - Break - Build - Drop - Mix Out</text>
  </svg>`;
}

function renderMiniDashboard(dark = false) {
  const bg = dark ? "#080A0E" : "#F7F8F6";
  const panel = dark ? "#121820" : "#FFFFFF";
  const text = dark ? "#F7F8F6" : "#080A0E";
  const border = dark ? "#2A2F36" : "#D9DEE3";
  return `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:10px;width:100%">
    <div style="height:8px;width:70px;background:#47F4E6;border-radius:6px;margin-bottom:12px"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
      <div style="background:${panel};border:1px solid ${border};border-radius:6px;padding:8px;color:${text}"><b>94</b><p class="micro">Score</p></div>
      <div style="background:${panel};border:1px solid ${border};border-radius:6px;padding:8px;color:${text}"><b>0</b><p class="micro">Críticos</p></div>
      <div style="background:${panel};border:1px solid ${border};border-radius:6px;padding:8px;color:${text}"><b>18</b><p class="micro">Cues</p></div>
    </div>
  </div>`;
}

function renderUiMock(name) {
  const waveform = `<svg viewBox="0 0 480 90" width="100%" height="76" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="90" fill="#FFFFFF"/>
    ${Array.from({ length: 48 }, (_, i) => {
      const h = 12 + ((i * 17) % 54);
      const color = i % 9 === 0 ? "#47F4E6" : i % 13 === 0 ? "#FF4FD8" : "#2A2F36";
      return `<rect x="${i * 10}" y="${45 - h / 2}" width="5" height="${h}" rx="2" fill="${color}" opacity="0.85"/>`;
    }).join("")}
    <line x1="0" y1="45" x2="480" y2="45" stroke="#D9DEE3"/>
  </svg>`;
  return `<div class="sample-ui">
    <div class="bar"><span style="width:10px;height:10px;border-radius:99px;background:#47F4E6"></span>GigReady</div>
    <div class="body">
      <div class="side">
        ${["Dashboard", "Problemas", "Duplicados", "Memory Cues", "Exportar"].map((item, i) => `<div style="height:22px;border-radius:5px;margin-bottom:6px;background:${i === 0 ? "#E9FFFC" : "#F2F4F5"};font-size:9px;padding:5px;color:#2A2F36">${item}</div>`).join("")}
      </div>
      <div class="main">
        <div class="metric-row">
          <div class="metric"><b>94</b><p class="micro">Estado de preparación</p></div>
          <div class="metric"><b>246</b><p class="micro">Tracks analizados</p></div>
          <div class="metric"><b>31</b><p class="micro">Cues sugeridos</p></div>
        </div>
        <div class="wave">${waveform}</div>
        <div style="margin-top:10px;display:grid;gap:5px">
          ${["Archivo validado", "Duplicado probable", "Cue pendiente"].map((row, i) => `<div style="height:20px;border:1px solid #D9DEE3;border-left:3px solid ${["#19C37D", "#FFB84D", "#246BFD"][i]};border-radius:5px;background:#FFFFFF;padding:3px 8px;font-size:9px">${row}</div>`).join("")}
        </div>
      </div>
    </div>
  </div>`;
}

function renderDesignSystemVisual(name) {
  return `<div class="visual-panel">
    <svg viewBox="0 0 560 260" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">
      <rect width="560" height="260" fill="#F7F8F6"/>
      ${Array.from({ length: 36 }, (_, i) => `<line x1="${i * 16}" y1="0" x2="${i * 16}" y2="260" stroke="#D9DEE3" stroke-width="1"/>`).join("")}
      ${Array.from({ length: 18 }, (_, i) => `<line x1="0" y1="${i * 16}" x2="560" y2="${i * 16}" stroke="#D9DEE3" stroke-width="1"/>`).join("")}
      <rect x="32" y="32" width="160" height="64" rx="6" fill="#080A0E"/>
      <text x="56" y="72" fill="#F7F8F6" font-size="18" font-weight="700" font-family="Inter, Segoe UI">Primary</text>
      <rect x="216" y="32" width="128" height="64" rx="6" fill="#FFFFFF" stroke="#D9DEE3"/>
      <text x="244" y="72" fill="#080A0E" font-size="18" font-weight="700" font-family="Inter, Segoe UI">Card</text>
      <rect x="368" y="32" width="144" height="64" rx="6" fill="#E9FFFC" stroke="#47F4E6"/>
      <text x="398" y="72" fill="#080A0E" font-size="18" font-weight="700" font-family="Inter, Segoe UI">Focus</text>
      <rect x="32" y="128" width="480" height="72" rx="8" fill="#FFFFFF" stroke="#D9DEE3"/>
      <rect x="56" y="150" width="92" height="12" rx="6" fill="#47F4E6"/>
      <rect x="56" y="172" width="180" height="10" rx="5" fill="#D9DEE3"/>
      <rect x="360" y="150" width="116" height="30" rx="6" fill="#080A0E"/>
      <text x="389" y="170" fill="#F7F8F6" font-size="12" font-weight="700" font-family="Inter, Segoe UI">Exportar</text>
    </svg>
    <p class="micro">${esc(name)}: escala de 8 px, radio 6 px y estados visibles.</p>
  </div>`;
}

function renderCover(page, index) {
  return `<section class="page dark cover" data-page="${index + 1}">
    <div class="brand-lockup">${horizontalLogoSvg()}</div>
    <h1>${esc(page.title)}</h1>
    <p class="lead">${esc(page.lead)}</p>
    <div class="meta-lines">
      <p>${esc(page.text[0])}</p>
      <p>${esc(page.text[1])}<br/><strong style="color:#47F4E6">${esc(page.text[2])}</strong></p>
    </div>
  </section>`;
}

function renderToc(page, index) {
  const tocItems = [
    ["01", "Filosofía de marca", "04"],
    ["02", "Posicionamiento", "10"],
    ["03", "Identidad verbal", "16"],
    ["04", "Sistema de logotipo", "22"],
    ["05", "Usos incorrectos", "27"],
    ["06", "Paleta cromática", "28"],
    ["07", "Tipografía", "31"],
    ["08", "Sistema gráfico", "34"],
    ["09", "Interfaz de producto", "38"],
    ["10", "Aplicaciones de marca", "43"],
    ["11", "Material promocional", "48"],
    ["12", "Accesibilidad", "52"],
    ["13", "Design System", "55"],
    ["14", "Experiencia de marca", "59"],
    ["15", "Roadmap visual", "63"],
    ["16", "Gobernanza y cierre", "65"],
  ];
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="toc-list">${tocItems
      .map(([id, label, pageNo]) => `<div class="toc-row"><span>${id}</span><span>${label}</span><span>${pageNo}</span></div>`)
      .join("")}</div>
    ${footer(page, index)}
  </section>`;
}

function renderSnapshot(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="snapshot-band">${page.blocks
      .map(
        (block) => `<div class="snapshot-card"><h3>${esc(block.heading)}</h3><p>${esc(block.body)}</p></div>`,
      )
      .join("")}</div>
    <div style="margin-top:14mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderStandard(page, index) {
  const isDark = page.kind === "chapter";
  return `<section class="page ${isDark ? "dark" : ""}" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="content-grid">
      <div>${renderBlocks(page.blocks)}</div>
      <div>${renderVisual(page.visual)}</div>
    </div>
    ${footer(page, index)}
  </section>`;
}

function renderContent(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="content-grid">
      <div>${renderBlocks(page.blocks)}</div>
      <div>${renderVisual(page.visual)}</div>
    </div>
    ${footer(page, index)}
  </section>`;
}

function renderMatrixPage(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    ${renderMatrix(page.items)}
    <div style="margin-top:8mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderManifesto(page, index) {
  return `<section class="page dark" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="quote">${esc(page.quote)}</div>
    ${renderBlocks(page.blocks)}
    ${footer(page, index)}
  </section>`;
}

function renderAudience(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="matrix">${page.personas
      .map(([name, body]) => `<div class="matrix-item"><h3>${esc(name)}</h3><p>${esc(body)}</p></div>`)
      .join("")}</div>
    <div style="margin-top:12mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderMessaging(page, index) {
  return `<section class="page dark" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="matrix">${page.messages
      .map((message, idx) => `<div class="matrix-item"><h3>Mensaje ${idx + 1}</h3><p>${esc(message)}</p></div>`)
      .join("")}</div>
    <div style="margin-top:12mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderLogo(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="logo-board">${page.blocks
      .map(([heading, body]) => `<div class="logo-tile"><h3>${esc(heading)}</h3><p>${esc(body)}</p></div>`)
      .join("")}</div>
    <div style="margin-top:9mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderIncorrect(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    ${renderVisual(page.visual)}
    <div class="matrix" style="margin-top:8mm">${page.items
      .map(([heading, body]) => `<div class="matrix-item"><h3>${esc(heading)}</h3><p>${esc(body)}</p></div>`)
      .join("")}</div>
    ${footer(page, index)}
  </section>`;
}

function renderColors(page, index) {
  const selected = page.colorNames.map(getColor);
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="color-grid">${selected
      .map(
        (color) => `<div class="color-card">
          <div class="swatch" style="background:${color.hex}"></div>
          <div class="color-info">
            <h3>${esc(color.name)} - ${esc(color.role)}</h3>
            <div class="spec"><span>${color.hex}</span><span>RGB ${color.rgb}</span><span>CMYK ${color.cmyk}</span></div>
            <p>${esc(color.use)}</p>
            <p class="micro" style="margin-top:6px">${esc(color.psychology)}</p>
          </div>
        </div>`,
      )
      .join("")}</div>
    ${
      page.stateNotes
        ? `<div class="state-notes">${page.stateNotes
            .map(([heading, body]) => `<div class="state-note"><h3>${esc(heading)}</h3><p>${esc(body)}</p></div>`)
            .join("")}</div>`
        : ""
    }
    ${footer(page, index)}
  </section>`;
}

function renderType(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="content-grid">
      <div>${renderMatrix(page.items)}</div>
      <div>${renderVisual(page.visual)}</div>
    </div>
    ${footer(page, index)}
  </section>`;
}

function renderApplications(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="content-grid">
      <div>${renderMatrix(page.items)}</div>
      <div>${renderVisual(page.visual)}</div>
    </div>
    ${footer(page, index)}
  </section>`;
}

function renderJourney(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="journey">${page.steps
      .map(
        ([heading, body], i) => `<div class="journey-step"><div class="dot">${i + 1}</div><h3>${esc(heading)}</h3><p>${esc(body)}</p></div>`,
      )
      .join("")}</div>
    <div style="margin-top:10mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderRoadmap(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="roadmap">${page.steps
      .map(
        ([year, title, body]) => `<div class="roadmap-row"><strong>${esc(year)}</strong><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`,
      )
      .join("")}</div>
    <div style="margin-top:8mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderGovernance(page, index) {
  return `<section class="page" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    ${renderMatrix(page.items)}
    <div style="margin-top:12mm">${renderVisual(page.visual)}</div>
    ${footer(page, index)}
  </section>`;
}

function renderClosing(page, index) {
  return `<section class="page dark" data-page="${index + 1}">
    ${topbar(page, index)}
    ${header(page)}
    <div class="quote">${esc(page.quote)}</div>
    ${renderVisual(page.visual)}
    ${footer(page, index)}
  </section>`;
}

function renderPage(page, index) {
  switch (page.kind) {
    case "cover":
      return renderCover(page, index);
    case "toc":
      return renderToc(page, index);
    case "snapshot":
      return renderSnapshot(page, index);
    case "chapter":
      return renderStandard(page, index);
    case "content":
      return renderContent(page, index);
    case "matrix":
    case "ui":
    case "accessibility":
      return renderMatrixPage(page, index);
    case "manifesto":
      return renderManifesto(page, index);
    case "audience":
      return renderAudience(page, index);
    case "messaging":
      return renderMessaging(page, index);
    case "logo":
      return renderLogo(page, index);
    case "incorrect":
      return renderIncorrect(page, index);
    case "colors":
      return renderColors(page, index);
    case "type":
      return renderType(page, index);
    case "applications":
      return renderApplications(page, index);
    case "journey":
      return renderJourney(page, index);
    case "roadmap":
      return renderRoadmap(page, index);
    case "governance":
      return renderGovernance(page, index);
    case "closing":
      return renderClosing(page, index);
    default:
      throw new Error(`Unknown page kind: ${page.kind}`);
  }
}

function html() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>GigReady - Manual de Marca</title>
  <style>${css()}</style>
</head>
<body>
  <main>
    ${pages.map(renderPage).join("\n")}
  </main>
</body>
</html>`;
}

function markdown() {
  const lines = [
    "# GigReady - Manual de Marca",
    "",
    `${documentMeta.version} - ${documentMeta.date}`,
    "",
    documentMeta.institutionalSubtitle,
    "",
    `Eslogan principal: ${documentMeta.tagline}`,
    "",
  ];
  for (const page of pages) {
    if (page.kind === "cover") continue;
    lines.push(`## ${page.section ? `${page.section} ` : ""}${page.title}`, "");
    if (page.lead) lines.push(page.lead, "");
    if (page.quote) lines.push(`> ${page.quote}`, "");
    if (page.blocks) {
      for (const block of page.blocks) {
        if (Array.isArray(block)) {
          lines.push(`### ${block[0]}`, "", block[1], "");
        } else {
          lines.push(`### ${block.heading}`, "", block.body, "");
        }
      }
    }
    const list = page.items || page.messages || page.personas || page.steps;
    if (list) {
      for (const item of list) {
        if (typeof item === "string") lines.push(`- ${item}`);
        else lines.push(`- **${item[0]}:** ${item.slice(1).join(" - ")}`);
      }
      lines.push("");
    }
    if (page.colorNames) {
      for (const color of page.colorNames.map(getColor)) {
        lines.push(`### ${color.name}`, "");
        lines.push(`HEX ${color.hex} | RGB ${color.rgb} | CMYK ${color.cmyk}`, "");
        lines.push(`Uso: ${color.use}`, "");
        lines.push(`Justificación: ${color.psychology}`, "");
      }
    }
  }
  return `${lines.join("\n").trim()}\n`;
}

function readme() {
  return `# GigReady Brand Book

Entregables generados:

- \`gigready-brand-book.html\`: manual paginado listo para imprimir.
- \`gigready-brand-book.md\`: fuente editorial editable.
- \`assets/\`: logotipos SVG y tokens de marca.
- \`../../output/pdf/gigready-brand-book.pdf\`: PDF final.

Regenerar:

\`\`\`powershell
node scripts/generate-brand-book.mjs
\`\`\`

Nota: el PDF se genera con Playwright/Chromium para preservar diseño, color y paginación.
`;
}

async function renderPdf(htmlPath, pdfPath) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1240, height: 1754 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  const samplePages = [1, 3, 23, 39, pages.length];
  for (const pageNumber of samplePages) {
    const locator = page.locator(`.page[data-page="${pageNumber}"]`);
    await locator.screenshot({
      path: path.join(shotDir, `gigready-brand-book-page-${String(pageNumber).padStart(2, "0")}.png`),
      animations: "disabled",
    });
  }
  await browser.close();
}

async function main() {
  ensureDirs();
  writeAssets();
  const htmlPath = path.join(brandDir, "gigready-brand-book.html");
  const mdPath = path.join(brandDir, "gigready-brand-book.md");
  const readmePath = path.join(brandDir, "README.md");
  const pdfPath = path.join(pdfDir, "gigready-brand-book.pdf");
  fs.writeFileSync(htmlPath, html(), "utf8");
  fs.writeFileSync(mdPath, markdown(), "utf8");
  fs.writeFileSync(readmePath, readme(), "utf8");
  await renderPdf(htmlPath, pdfPath);
  console.log(JSON.stringify({ htmlPath, mdPath, pdfPath, pages: pages.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
