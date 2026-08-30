# Importar XML de GigReady en Rekordbox

Este documento explica como importar el XML generado por GigReady para conservar playlist, memory cues y estrellas.

## Idea clave

No basta con importar solo la playlist. Primero debes registrar el XML como libreria importada, luego importar los tracks a la coleccion y despues importar la playlist.

Flujo recomendado:

1. Registrar el XML de GigReady en Rekordbox.
2. Abrir la fuente `rekordbox xml` en el panel lateral.
3. Importar primero los tracks a la coleccion.
4. Importar o arrastrar despues la playlist de GigReady.
5. Revisar estrellas y memory cues antes de exportar el USB.

## Paso 1: Preparar el XML en GigReady

1. Completa el escaneo de tu carpeta.
2. Abre `Memory Cues`.
3. Revisa, edita y aprueba los cues que quieres exportar.
4. Ve a `Exportar`.
5. Elige `Rekordbox XML`.
6. Guarda el archivo XML.

Si vas a preparar un USB o una carpeta nueva, usa `Carpeta limpia` y activa `Incluir Rekordbox XML`. El XML generado dentro de esa carpeta apuntara a los archivos copiados en esa misma carpeta.

## Paso 2: Registrar el XML en Rekordbox

1. Abre Rekordbox.
2. Ve a `Preferencias`.
3. Entra a `Avanzado`.
4. Entra a `Base de datos`.
5. Busca la seccion `rekordbox xml` o `Imported Library`.
6. Presiona `Examinar`.
7. Selecciona el XML generado por GigReady.
8. Cierra Preferencias.

Resultado esperado: en el panel lateral izquierdo debe aparecer una fuente llamada `rekordbox xml`.

## Paso 3: Encontrar la fuente rekordbox xml

En el panel lateral de Rekordbox busca una seccion parecida a:

```text
rekordbox xml
  Collection
  Playlists
    GigReady - Nombre de carpeta
```

Muchos DJs no usan esta vista normalmente. No esta en tus playlists principales ni en el USB; aparece como una fuente adicional en el explorador lateral.

## Paso 4: Importar tracks a la coleccion

1. Abre `rekordbox xml`.
2. Entra a `Collection` o a la lista de tracks del XML.
3. Selecciona los tracks. Puedes usar `Ctrl + A`.
4. Haz clic derecho.
5. Elige `Import to Collection` o `Importar a coleccion`.
6. Espera a que Rekordbox termine de agregarlos.

Este paso es el que permite que Rekordbox cree registros internos con estrellas y memory cues.

## Paso 5: Importar la playlist

1. Dentro de `rekordbox xml`, abre `Playlists`.
2. Busca la playlist generada por GigReady.
3. Haz clic derecho e importala, o arrastrala a tus playlists de Rekordbox.
4. Abre varios tracks para revisar estrellas y memory cues.

## Paso 6: Exportar al USB

1. Conecta tu USB.
2. Revisa la playlist importada.
3. Ajusta cues si es necesario.
4. Exporta el USB desde Rekordbox.
5. Revisa el resultado antes de usarlo en cabina.

## Guia visual pendiente de capturas

Para la version final del instructivo conviene incluir capturas reales de estas pantallas:

1. `Preferencias > Avanzado > Base de datos`.
2. Selector del archivo XML.
3. Fuente `rekordbox xml` en el panel lateral.
4. Menu contextual `Import to Collection`.
5. Playlist importada en la lista principal.

Mientras no tengamos capturas definitivas, usa los nombres exactos de menu anteriores como referencia.

## Si los cues o estrellas no aparecen

- Verifica que los cues esten aprobados en GigReady antes de exportar.
- Importa primero los tracks desde `rekordbox xml`; despues importa la playlist.
- Evita importar solo una playlist desde el menu general si quieres conservar cues y estrellas.
- Si los tracks ya existian en la coleccion, Rekordbox puede priorizar el registro anterior.
- Para una prueba limpia, usa `Carpeta limpia` en GigReady y genera un XML para esa carpeta nueva.

## Tracks ya existentes en Rekordbox

Si el mismo archivo ya esta en la coleccion, Rekordbox puede no reemplazar cues o estrellas desde el XML.

Opciones seguras:

- Usar una carpeta limpia con nuevas rutas y XML propio.
- Retirar de la coleccion los tracks de prueba antes de importar, sin borrar los archivos del disco.
- Probar primero con una playlist pequena antes de aplicar el flujo a toda la carpeta.

## Detalles exportados por GigReady

GigReady exporta:

- Tracks validos.
- Rutas de archivo.
- Metadata basica.
- Rating de energia como estrellas de Rekordbox.
- Memory cues aprobados.
- Playlist importable.

Los memory cues se exportan como `POSITION_MARK` con `Type="0"` y `Num="-1"`.

Las estrellas se exportan con el atributo `Rating`:

| Estrellas | Valor XML |
|---|---:|
| 1 | 51 |
| 2 | 102 |
| 3 | 153 |
| 4 | 204 |
| 5 | 255 |

## Limitaciones

- GigReady no modifica la base de datos interna de Rekordbox.
- Rekordbox decide como fusionar datos XML con tracks ya existentes.
- Los colores de memory cues no se conservan de forma fiable por XML.
- Conviene revisar la importacion en Rekordbox antes de exportar al USB.
