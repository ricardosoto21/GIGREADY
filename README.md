# GigReady

**Revisa, prepara y exporta tu musica antes de tocar.**

GigReady es una aplicacion desktop para DJs que revisa carpetas, pendrives o discos externos antes de importar musica a Rekordbox. Trabaja localmente, no modifica archivos originales durante el escaneo y ayuda a preparar playlists, memory cues, estrellas de energia, carpetas limpias y conversiones de audio.

## Funciones principales

- Escaneo completo de MP3, WAV, AIFF, FLAC, M4A, AAC y OGG.
- Validacion tecnica con FFprobe LGPL incluido para Windows x64.
- Conversion independiente a MP3, WAV y AIFF con FFmpeg LGPL incluido.
- Lectura de metadata con fallback por nombre de archivo.
- Deteccion de archivos criticos, advertencias e informacion util.
- Deteccion de duplicados exactos y probables.
- Calculo de estrellas de energia por genero seleccionado.
- Sugerencia, edicion y aprobacion de memory cues.
- Vista previa de audio, zoom y ajuste por arrastre de cues.
- Creacion de carpeta limpia sin mover originales.
- Exportacion de playlist M3U/M3U8.
- Exportacion Rekordbox XML con memory cues aprobados y estrellas.
- Historial local en SQLite.
- Logs locales para soporte.

## Stack

| Area | Tecnologia |
|---|---|
| Desktop | Electron |
| Frontend | React + TypeScript |
| Estado | Zustand |
| Base local | SQLite con better-sqlite3 |
| Metadata | music-metadata |
| Audio | FFmpeg / FFprobe LGPL bundled |
| Escaneo | fast-glob |
| Tests | Vitest |
| Build Windows | electron-builder NSIS |

## Desarrollo

```bash
npm install
npm run dev
```

## Validacion

```bash
npm run verify:ffmpeg
npm run typecheck
npm test
npm run build
```

## Build Windows

```bash
npm run build:win
npm run checksum:release
```

El instalador se genera en `release/`.

## FFmpeg / FFprobe

GigReady incluye `ffmpeg.exe` y `ffprobe.exe` Windows x64 bajo LGPL. La verificacion y trazabilidad estan documentadas en:

- `docs/ffprobe-distribution.md`
- `docs/licenses.md`
- `THIRD_PARTY_NOTICES.md`

## Beta privada

La version `1.2.0-beta.1` esta preparada como beta privada de evaluacion. No debe publicarse como release comercial final sin completar firma de codigo, revision legal final y QA manual con Rekordbox.

Documentos para testers:

- `docs/beta-installation-note.md`: nota de instalacion para Windows sin firma.
- `docs/beta-test-protocol.md`: flujo de prueba recomendado.
- `docs/beta-feedback-form.md`: formulario para registrar feedback.
- `docs/rekordbox-import.md`: guia detallada para importar XML en Rekordbox.

## Limitaciones conocidas

- Los cues sugeridos requieren revision y aprobacion manual.
- La importacion XML en Rekordbox requiere que las rutas de archivo coincidan.
- La firma digital de Windows aun no esta configurada.
- La activacion con claves de un solo uso queda para un hito posterior.
- El modo avanzado interno no se distribuye ni se muestra en la interfaz de beta.

## Version

- `1.2.0-beta.1`: conversor independiente, FFmpeg LGPL, preview de audio, zoom y arrastre de cues.
- `1.1.0-beta.1`: FFprobe LGPL regularizado, escaneo completo unico, seleccion de genero, exportacion enfocada en M3U/Rekordbox XML.
- `1.0.4`: Exportacion Rekordbox XML corregida para memory cues.
