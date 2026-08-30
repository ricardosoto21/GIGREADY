# Arquitectura de GigReady

GigReady es una aplicación de escritorio construida con **Electron**, **React** y **TypeScript**. Sigue un enfoque de "local-first" priorizando la privacidad y el rendimiento sin depender de servicios en la nube.

## 1. Tecnologías principales
- **Runtime**: Electron 33.3.1
- **Renderer**: React 19 + TypeScript 5.7
- **Estado**: Zustand 5.0
- **Base de datos**: SQLite (via better-sqlite3)
- **Metadata**: music-metadata 10.6
- **Validación y análisis de audio**: FFprobe LGPL incluido como binario Windows x64 controlado por GigReady

## 2. Estructura de procesos

### Proceso Main (Electron)
Gestiona el ciclo de vida de la aplicación, el acceso al sistema de archivos y la base de datos.
- `app/electron/main.ts`: Punto de entrada.
- `app/electron/ipc.ts`: Puentes de comunicación con el Renderer.
- `app/electron/preload.ts`: Exposición segura de APIs.

### Proceso Renderer (React)
Interfaz de usuario dinámica y fluida.
- `app/src/App.tsx`: Enrutamiento y layout principal.
- `app/src/pages/`: Pantallas funcionales (Dashboard, Export, Clean Folder, etc.).
- `app/src/components/`: Componentes compartidos y sistema de diseño.

## 3. Capas del Backend (Lógica de negocio)

### Scanner & Orchestrator (`app/backend/scanner/`)
Se encarga de descubrir archivos en el sistema, gestionar la concurrencia del análisis y emitir eventos de progreso a la UI.

### Metadata & Audit (`app/backend/metadata/`, `app/backend/risk/`)
Extrae etiquetas ID3/Vorbis/MP4 y aplica un motor de reglas para detectar riesgos técnicos (bitrate bajo, archivos corruptos, nombres inválidos).

### Audio & Cues (`app/backend/audio/`)
- **Cue Engine**: Motor basado en reglas que analiza la estructura rítmica (BPM) y la duración para sugerir marcadores de mezcla (Intro, Drop, Outro).
- **Energy Analyzer**: Genera mapas de energía para la visualización de formas de onda.

### Data Access (`app/backend/database/`)
Capa de abstracción sobre SQLite que gestiona sesiones, tracks, issues y cues. Utiliza el modo WAL para permitir lecturas rápidas durante el escaneo.

## 4. Flujo de datos
1. El usuario selecciona una carpeta.
2. El **Orchestrator** inicia el escaneo recursivo.
3. Se extrae metadata y se valida con **ffprobe**.
4. El **Risk Engine** audita cada track y guarda resultados en la DB.
5. El **Cue Engine** genera sugerencias.
6. La UI se actualiza vía **IPC** con el estado de la base de datos.
7. Las exportaciones se generan a partir de los datos aprobados en la DB.

## 5. Decisiones de diseño
- **Inmutabilidad**: La aplicación nunca modifica los archivos originales por defecto.
- **Seguridad**: El acceso al sistema de archivos está restringido a los handlers IPC específicos.
- **Portabilidad**: Las rutas en el XML de Rekordbox se codifican cuidadosamente para garantizar la compatibilidad entre diferentes instalaciones.

## 6. Motor musical interno 1.2.0-beta.1

El analisis musical queda separado del escaneo tecnico.

- `standard`: usa el analisis local basado en FFprobe/energia como ruta estable.
- `advanced_internal`: modo interno oculto en la UI publica; llama un binario externo mediante `GIGREADY_MIR_ANALYZER_PATH`.
- Si el binario externo falla o no esta configurado, GigReady vuelve a `standard` y baja la confianza de los cues.
- El resultado se guarda en `musical_analysis` y se cachea en `analysis_cache`.
- El mapa de energia de la UI se deriva del analisis musical cuando existe.

Flujo:

1. Metadata y validacion tecnica.
2. Analisis musical.
3. BPM/beats/downbeats/frases/secciones.
4. Planificacion de memory cues.
5. Revision y aprobacion manual.
6. Exportacion Rekordbox XML solo con cues aprobados.

El modo avanzado interno no se empaqueta en el instalador publico hasta resolver licencias de distribucion.
