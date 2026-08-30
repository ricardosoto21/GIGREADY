# GigReady - QA Checklist

Checklist operativo para beta privada y preparacion de distribucion Windows x64.

## Escaneo

- [ ] Seleccionar carpeta abre el dialogo nativo.
- [ ] El escaneo siempre corre completo.
- [ ] Se incluyen subcarpetas.
- [ ] Se calculan hashes.
- [ ] Se valida con FFprobe.
- [ ] Se generan sugerencias de cues.
- [ ] Se calculan estrellas segun el genero elegido.
- [ ] El progreso se actualiza sin bloquear la interfaz.
- [ ] El escaneo se puede cancelar.
- [ ] Un error por archivo no detiene el escaneo completo.
- [ ] Archivos de sistema y temporales se ignoran.

## Auditoria

- [ ] Archivo no legible se marca como critico.
- [ ] Duracion 0 o inexistente se marca como critico.
- [ ] Bitrate bajo se marca como advertencia.
- [ ] Nombre problematico se marca como advertencia.
- [ ] Ruta larga se marca como advertencia.
- [ ] Duracion corta se marca como advertencia.
- [ ] Metadata faltante se marca como informativa, no critica.
- [ ] La metadata informativa aparece agrupada en la vista de problemas.
- [ ] El score general coincide con la severidad de los problemas.

## Cues

- [ ] La pestaña Memory Cues muestra tracks con cues sugeridos.
- [ ] El boton Revisar cues abre el detalle del track.
- [ ] Anterior y Siguiente recorren la lista de tracks con cues.
- [ ] Se puede reproducir desde un cue.
- [ ] Se puede repetir un tramo alrededor del cue.
- [ ] El mapa de energia permite zoom.
- [ ] Arrastrar un cue guarda el nuevo tiempo como editado.
- [ ] Click en zona vacia permite crear cue manual.
- [ ] Aprobar cue lo deja disponible para XML.
- [ ] Descartar cue lo excluye del XML.
- [ ] XML exporta solo memory cues aprobados.
- [ ] XML usa `POSITION_MARK Type="0" Num="-1"` para memory cues.

## Estrellas

- [ ] El genero se selecciona antes del escaneo.
- [ ] Automatico usa la metadata de genero cuando existe.
- [ ] General DJ funciona como criterio neutro.
- [ ] Rekordbox / CDJ no cambia el criterio de estrellas por si mismo.
- [ ] Psytrance evita infravalorar tracks con energia sostenida.
- [ ] Minimal pondera groove y continuidad.
- [ ] El XML incluye el rating de Rekordbox cuando corresponde.

## Rekordbox

- [ ] Exportar XML genera archivo valido.
- [ ] La pantalla Exportar muestra pasos posteriores.
- [ ] La guia explica registrar el XML en Preferencias.
- [ ] La guia indica importar primero tracks y luego playlist.
- [ ] En Rekordbox aparecen estrellas despues de importar tracks.
- [ ] En Rekordbox aparecen memory cues aprobados despues de importar tracks.
- [ ] La playlist importada conserva los tracks esperados.

## Conversor

- [ ] Convertir aparece en el menu lateral.
- [ ] Se puede cargar un archivo.
- [ ] Se puede cargar una carpeta.
- [ ] La vista previa muestra formato, duracion, estado y salida.
- [ ] MP3 genera 320 kbps CBR.
- [ ] WAV genera PCM sin compresion.
- [ ] AIFF genera PCM sin compresion.
- [ ] No se sobrescriben archivos existentes.
- [ ] Se mantiene estructura interna de carpetas por defecto.
- [ ] La conversion puede cancelarse.
- [ ] Un archivo fallido no detiene toda la cola.

## Historial

- [ ] Los escaneos se guardan en SQLite.
- [ ] Abrir un escaneo anterior navega al dashboard correcto.
- [ ] El historial muestra score, problemas y conteo de cues.
- [ ] Sesiones antiguas abren aunque tengan configuraciones legacy.

## UX

- [ ] No hay emojis en etiquetas, botones ni mensajes.
- [ ] No aparecen terminos tecnicos innecesarios en la interfaz.
- [ ] No hay textos con simbolos corruptos.
- [ ] El lenguaje es claro, sobrio y profesional.
- [ ] Las acciones de escritura muestran vista previa o confirmacion.
- [ ] No se modifican archivos originales durante el escaneo.

## Distribucion

- [ ] `npm run verify:ffmpeg` pasa.
- [ ] `npm run typecheck` pasa.
- [ ] `npm test` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run build:win` genera instalador.
- [ ] `npm run checksum:release` genera hashes.
- [ ] El instalador contiene `ffmpeg.exe` y `ffprobe.exe` bajo LGPL.
- [ ] La nota de instalacion beta esta incluida en el paquete.
- [ ] La guia Rekordbox esta incluida en el paquete.
- [ ] El protocolo de prueba beta esta incluido en el paquete.

## QA Humano Pendiente

- [ ] Instalar en Windows 10 limpio.
- [ ] Instalar en Windows 11 limpio.
- [ ] Revisar aviso SmartScreen por falta de firma.
- [ ] Importar XML en Rekordbox real.
- [ ] Confirmar estrellas en Rekordbox real.
- [ ] Confirmar memory cues en Rekordbox real.
- [ ] Escanear una carpeta real de al menos 1.000 tracks.
- [ ] Validar subjetivamente cues por genero con DJs.
- [ ] Tomar capturas reales para la guia visual.
