import React from 'react';

export function HelpPage() {
  return (
    <div className="app-content selectable">
      <h2 style={{ marginBottom: 'var(--space-6)' }}>Ayuda</h2>

      <div style={{ maxWidth: '720px' }}>
        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Que es GigReady</h3>
          <p>GigReady revisa tu musica antes de tocar. Escanea carpetas, pendrives o discos externos para detectar problemas, sugerir memory cues, calcular estrellas de energia y exportar informacion compatible con Rekordbox.</p>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Como escanear</h3>
          <ol style={{ paddingLeft: 'var(--space-5)', color: 'var(--color-text-secondary)', lineHeight: 2 }}>
            <li>Selecciona una carpeta o unidad desde la pantalla de inicio.</li>
            <li>Selecciona el genero para el calculo de estrellas.</li>
            <li>Haz clic en Iniciar escaneo.</li>
            <li>Revisa los resultados en el Dashboard.</li>
          </ol>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Tus archivos originales</h3>
          <p>GigReady trabaja en modo solo lectura por defecto. No se modificaran tus archivos originales durante el escaneo. Cualquier accion que modifique archivos requiere confirmacion explicita y genera un respaldo previo.</p>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Estado de preparacion</h3>
          <div style={{ color: 'var(--color-text-secondary)', lineHeight: 2 }}>
            <p><strong style={{ color: 'var(--color-ok)' }}>90-100:</strong> Listo. Tu musica esta en buen estado.</p>
            <p><strong style={{ color: 'var(--color-warning)' }}>70-89:</strong> Revision menor. Hay advertencias, sin problemas criticos.</p>
            <p><strong style={{ color: 'var(--color-warning)' }}>50-69:</strong> Requiere revision. Se encontraron problemas que conviene resolver.</p>
            <p><strong style={{ color: 'var(--color-critical)' }}>0-49:</strong> Riesgo alto. Hay archivos que pueden fallar en cabina.</p>
          </div>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Importar en Rekordbox</h3>
          <ol style={{ paddingLeft: 'var(--space-5)', color: 'var(--color-text-secondary)', lineHeight: 2 }}>
            <li>Genera el archivo Rekordbox XML desde Exportar o desde Carpeta limpia.</li>
            <li>Abre Rekordbox.</li>
            <li>En Preferencias, Advanced, Database, selecciona el XML en la seccion rekordbox xml.</li>
            <li>Abre el panel lateral rekordbox xml.</li>
            <li>Importa primero los tracks del XML a la coleccion.</li>
            <li>Luego importa o arrastra la playlist de GigReady desde ese mismo panel.</li>
            <li>Revisa los tracks importados, los memory cues y las estrellas.</li>
            <li>Exporta tu USB desde Rekordbox cuando estes conforme.</li>
          </ol>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Memory Cues</h3>
          <p>Son marcadores de referencia para mezclar: Intro, Mix In, Break, Drop y Mix Out, entre otros. GigReady sugiere cues como punto de partida. Puedes escucharlos, hacer zoom en el mapa de energia y ajustar su posicion arrastrando el marcador.</p>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Convertir audio</h3>
          <p>La seccion Convertir permite cargar un archivo o una carpeta, elegir MP3, WAV o AIFF, revisar una vista previa y crear copias en una carpeta destino. Los archivos originales no se modifican.</p>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Licencias</h3>
          <p>GigReady incluye FFmpeg/FFprobe bajo licencia LGPL para convertir y validar archivos de audio de forma local. FFmpeg y FFprobe son proyectos independientes de GigReady. La informacion completa se incluye en la documentacion de licencias.</p>
        </section>

        <section className="card">
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Soporte</h3>
          <p>Para solicitar soporte o nuevas funciones, revisa la documentacion incluida o contacta al equipo de producto.</p>
        </section>
      </div>
    </div>
  );
}
