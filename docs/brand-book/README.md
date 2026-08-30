# GigReady Brand Book

Entregables generados:

- `gigready-brand-book.html`: manual paginado listo para imprimir.
- `gigready-brand-book.md`: fuente editorial editable.
- `assets/`: logotipos SVG y tokens de marca.
- `../../output/pdf/gigready-brand-book.pdf`: PDF final.

Regenerar:

```powershell
node scripts/generate-brand-book.mjs
```

Nota: el PDF se genera con Playwright/Chromium para preservar diseño, color y paginación.
