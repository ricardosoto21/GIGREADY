# GigReady - Licencias de dependencias

Documento de referencia para compatibilidad comercial y distribucion inicial.

| Libreria | Version | Licencia | Uso en GigReady | Riesgo de distribucion | Observaciones comerciales |
|---|---:|---|---|---|---|
| electron | ^33 | MIT | Shell desktop | Bajo | Compatible con uso comercial |
| react | ^19 | MIT | UI framework | Bajo | Compatible con uso comercial |
| react-dom | ^19 | MIT | Rendering React | Bajo | Compatible con uso comercial |
| typescript | ^5 | Apache-2.0 | Tipado | Bajo | Dev only |
| zustand | ^5 | MIT | Estado global | Bajo | Compatible con uso comercial |
| @tanstack/react-table | ^8 | MIT | Tablas grandes | Bajo | Compatible con uso comercial |
| react-window | ^1 | MIT | Virtualizacion | Bajo | Compatible con uso comercial |
| better-sqlite3 | ^11 | MIT | Base local SQLite | Bajo | Compatible con uso comercial |
| music-metadata | ^10 | MIT | Metadata de audio | Bajo | Compatible con uso comercial |
| FFmpeg / FFprobe | N-125307-gd66e84695b-20260626 | LGPL-3.0-or-later | Conversion, validacion y analisis por ventanas | Bajo/medio | Binarios Windows x64 verificados; ver `docs/ffprobe-distribution.md` |
| fast-glob | ^3 | MIT | Escaneo de archivos | Bajo | Compatible con uso comercial |
| zod | ^3 | MIT | Validacion de datos | Bajo | Compatible con uso comercial |
| winston | ^3 | MIT | Logs locales | Bajo | Compatible con uso comercial |
| uuid | ^11 | MIT | IDs | Bajo | Compatible con uso comercial |
| csv-stringify | ^6 | MIT | Exportacion CSV | Bajo | Compatible con uso comercial |
| electron-builder | ^25 | MIT | Build y packaging | Bajo | Dev only |
| vite | ^6 | MIT | Bundler frontend | Bajo | Dev only |
| vitest | ^2 | MIT | Tests unitarios | Bajo | Dev only |
| @playwright/test | ^1 | Apache-2.0 | Tests E2E | Bajo | Dev only |
| concurrently | ^9 | MIT | Scripts de desarrollo | Bajo | Dev only |
| wait-on | ^8 | MIT | Esperar servidor | Bajo | Dev only |
| chokidar | ^4 | MIT | Watchers de archivos | Bajo | Compatible con uso comercial |
| Essentia | No incluido | AGPLv3 / licencia comercial | Candidato para motor avanzado interno | Alto | No empaquetar en instalador publico sin licencia comercial |
| aubio | No incluido | GPLv3 o posterior | Candidato para BPM, beats y onsets en pruebas internas | Alto | No empaquetar en instalador publico cerrado sin revisar obligaciones GPL |

## FFprobe / FFmpeg

GigReady distribuye `ffmpeg.exe` y `ffprobe.exe` para Windows x64 en `vendor/ffmpeg/win-x64`.

Estado verificado:

1. `ffmpeg.exe -L` y `ffprobe.exe -L` declaran GNU Lesser General Public License.
2. La configuracion no incluye `--enable-gpl`.
3. La configuracion no incluye `--enable-nonfree`.
4. El instalador empaqueta los binarios en `resources/ffmpeg`.
5. El texto LGPL y los avisos de terceros se empaquetan junto al instalador.

Links oficiales:

- FFmpeg legal: https://ffmpeg.org/legal.html
- FFmpeg: https://ffmpeg.org/
- LGPL 3.0: https://www.gnu.org/licenses/lgpl-3.0.html
- Build usada para Windows: https://github.com/BtbN/FFmpeg-Builds

## Motor avanzado interno

La version `1.2.0-beta.1` conserva soporte interno para un analizador externo mediante `GIGREADY_MIR_ANALYZER_PATH`. Ese binario no se incluye en el instalador publico ni se muestra en la interfaz de beta privada.

Razon de la restriccion:

- Essentia declara AGPLv3 para uso abierto/no comercial y licencia comercial bajo solicitud: https://essentia.upf.edu/documentation/licensing_information.html
- aubio declara GPLv3 o posterior en su repositorio oficial: https://github.com/aubio/aubio

Decision de release: el modo avanzado queda como prototipo interno. El build distribuible debe funcionar con el motor estandar sin empaquetar dependencias copyleft adicionales.
