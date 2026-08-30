# Protocolo de prueba beta - GigReady

Objetivo: validar instalacion, escaneo, cues, estrellas, exportacion Rekordbox XML y conversion de audio con usuarios reales.

## Preparacion

1. Usar `GigReady Setup 1.2.0-beta.1.exe`.
2. Leer `docs/beta-installation-note.md`.
3. Probar con una carpeta copiada o musica nueva, no con la unica libreria principal.
4. Anotar version de Rekordbox y Windows.

## Prueba 1: Instalacion

1. Instalar GigReady.
2. Registrar si aparece alerta de Windows.
3. Abrir la app.
4. Confirmar que se ve la version correcta en el menu lateral.

## Prueba 2: Escaneo base

1. Abrir `Escanear`.
2. Seleccionar carpeta de 20 a 100 tracks.
3. Elegir genero real de la carpeta.
4. Iniciar escaneo.
5. Revisar Dashboard.
6. Abrir Problemas y confirmar que los informativos no se sienten alarmantes.

## Prueba 3: Energia

1. Revisar estrellas generadas.
2. Comparar 5 tracks de energia alta y 5 de energia baja dentro del genero.
3. Anotar casos incorrectos.
4. Para Psytrance o Techno, validar que la escala no deje tracks intensos con 1 o 2 estrellas sin motivo claro.

## Prueba 4: Memory Cues

1. Abrir `Memory Cues`.
2. Confirmar que el boton `Revisar cues` es claro.
3. Entrar al detalle de 5 tracks.
4. Escuchar desde marcadores.
5. Usar zoom.
6. Mover al menos un cue.
7. Aprobar cues utiles.
8. Anotar cues duplicados, especialmente `Mix Out` y `Outro`.

## Prueba 5: Rekordbox XML

1. Exportar `Rekordbox XML`.
2. Seguir el panel de siguiente paso en GigReady.
3. En Rekordbox, registrar el XML en `Preferencias > Avanzado > Base de datos > rekordbox xml`.
4. Abrir fuente `rekordbox xml` en el panel lateral.
5. Importar tracks a la coleccion.
6. Importar playlist.
7. Verificar estrellas y memory cues.

## Prueba 6: Conversor

1. Abrir `Convertir`.
2. Cargar un archivo.
3. Convertir a MP3.
4. Cargar una carpeta pequena.
5. Convertir a WAV o AIFF.
6. Confirmar que los originales no cambiaron.

## Prueba 7: Carpeta grande

1. Probar 70 tracks.
2. Probar 500 tracks si el equipo lo permite.
3. Probar 1000 tracks solo si hay tiempo.
4. Anotar tiempo percibido, bloqueos y errores.

## Cierre

Completar `docs/beta-feedback-form.md` y adjuntar capturas de cualquier problema.
