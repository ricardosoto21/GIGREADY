# Manual de uso - GigReady

GigReady revisa musica antes de tocar. El flujo recomendado es simple: seleccionar una carpeta, elegir un genero para las estrellas, revisar el resultado, aprobar cues utiles y exportar M3U o Rekordbox XML. Tambien incluye un conversor independiente para preparar copias en MP3, WAV o AIFF.

## Pantallas principales

**Inicio**

Acceso rapido para escanear una carpeta, abrir historial o revisar ayuda.

**Escanear**

Selecciona carpeta, pendrive o disco externo. El escaneo siempre revisa la carpeta completa, incluye subcarpetas, calcula hashes, valida archivos y sugiere cues.

Antes de iniciar puedes elegir:

- Genero para energia: define el criterio de estrellas.
- Perfil de compatibilidad: General DJ o Rekordbox / CDJ.

**Dashboard**

Resume el estado del escaneo: score, tracks analizados, problemas, duplicados, cues sugeridos y cues aprobados.

**Problemas**

Muestra archivos que requieren revision. Los problemas criticos deben revisarse antes de preparar un USB.

**Duplicados**

Agrupa duplicados exactos y probables. GigReady no borra archivos automaticamente.

**Memory Cues**

Muestra cues sugeridos por track. Revisa cada track, edita cuando sea necesario y aprueba solo los cues que quieras exportar.

**Detalle de track**

Permite ver metadata, problemas, mapa de energia y marcadores. Los botones Anterior y Siguiente recorren los tracks con cues dentro de la sesion activa.

La vista de detalle incluye reproduccion local, escucha desde cada marcador, repeticion de tramo, zoom en el mapa de energia y ajuste de cues arrastrando el marcador.

**Carpeta limpia**

Crea una copia nueva de los archivos validos. Puede normalizar nombres, excluir duplicados exactos e incluir playlist M3U o Rekordbox XML.

**Convertir**

Permite cargar un archivo o una carpeta, elegir MP3, WAV o AIFF, revisar una vista previa y convertir copias en una carpeta destino. Los originales no se modifican.

**Exportar**

Opciones visibles:

- Playlist M3U.
- Rekordbox XML.
- Acceso a Carpeta limpia.

**Historial**

Lista escaneos anteriores con score, problemas y conteo de cues sugeridos/aprobados.

**Configuracion**

Permite ajustar reglas de bitrate, duracion minima, ruta maxima, caracteres a evitar, concurrencia, confianza minima de cues, perfil de energia y formatos aceptados.

**Registros**

Muestra eventos locales utiles para soporte.

**Ayuda**

Incluye flujo de uso, importacion a Rekordbox, seguridad de archivos y licencias.

## Flujo recomendado

1. Abre GigReady.
2. Entra a Escanear.
3. Selecciona la carpeta o unidad con musica.
4. Elige el genero para calcular estrellas.
5. Elige General DJ o Rekordbox / CDJ.
6. Inicia el escaneo.
7. Revisa el Dashboard.
8. Abre Problemas y revisa archivos criticos.
9. Abre Memory Cues.
10. Entra al detalle de cada track que quieras preparar.
11. Edita, descarta o aprueba cues.
12. Exporta Rekordbox XML o crea una Carpeta limpia.
13. Importa el XML en Rekordbox y revisa antes de exportar el USB.

## Cues

Los cues son sugerencias. GigReady puede sugerir Intro, First Beat, Mix In, Groove Start, Bass In, Break, Build Up, Drop, Mix Out y Outro.

Estados:

- Sugerido: creado por el analisis.
- Aprobado: se exporta al XML.
- Editado: ajustado por el usuario.
- Descartado: no se exporta.

Solo los cues aprobados se exportan a Rekordbox XML.

Para ajustar un cue con precision:

1. Abre el detalle del track.
2. Usa el zoom del mapa de energia.
3. Selecciona un marcador.
4. Usa Desde marcador o Repetir tramo para escucharlo.
5. Arrastra el marcador y sueltalo en la nueva posicion.
6. Revisa el estado editado y apruebalo si quieres exportarlo.

## Convertir audio

1. Abre Convertir.
2. Carga un archivo o una carpeta.
3. Elige formato de salida: MP3, WAV o AIFF.
4. Elige carpeta destino.
5. Prepara la vista previa.
6. Revisa rutas de salida y formato.
7. Haz clic en Convertir.

GigReady no sobrescribe archivos existentes. Si una ruta ya existe, crea un nombre seguro con sufijo numerico.

## Estrellas de energia

El genero seleccionado al iniciar el escaneo define el criterio de puntuacion. Las estrellas se exportan al XML de Rekordbox cuando el track se incluye en la exportacion.

Opciones:

- Automatico por genero.
- General DJ.
- House / Tech House.
- Techno.
- Trance / Melodic.
- Psytrance.
- Minimal / Minimal Techno.
- Drum & Bass.
- Reggaeton / Latin.
- Hip Hop / Trap.
- Downtempo / Warm-up.

## Importar en Rekordbox

1. Exporta Rekordbox XML desde GigReady.
2. Abre Rekordbox.
3. Ve a Preferencias y configura la ruta del XML importado.
4. Abre el panel rekordbox xml.
5. Importa primero los tracks desde el XML.
6. Luego importa o arrastra la playlist de GigReady.
7. Revisa estrellas y memory cues en Rekordbox.
8. Exporta tu USB desde Rekordbox cuando estes conforme.

## Seguridad

GigReady analiza en modo solo lectura. No modifica originales durante el escaneo.

Las acciones que pueden modificar archivos originales, como Safe Rename sobre originales, requieren vista previa, confirmacion y respaldo previo.

La Carpeta limpia copia archivos; no mueve originales.

## Licencias

GigReady incluye FFmpeg/FFprobe bajo LGPL para conversion y validacion local de audio. La informacion completa esta en `docs/licenses.md`, `docs/ffprobe-distribution.md` y `THIRD_PARTY_NOTICES.md`.
