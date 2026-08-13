# Tactika + Bazar Vercel Template

Plantilla para trabajar en VS Code con dos proyectos separados en un mismo
repositorio:

- `apps/landing`: landing corporativa de Tactika Consulting.
- `apps/bazar`: aplicacion marketplace Bazar.

## Flujo recomendado

1. Abrir esta carpeta en VS Code.
2. Subirla a GitHub.
3. Importar dos proyectos en Vercel desde el mismo repositorio:
   - Proyecto 1: root directory `apps/landing`.
   - Proyecto 2: root directory `apps/bazar`.
4. Conectar dominios:
   - `tactikaconsulting.com` para la landing.
   - `bazar.tactikaconsulting.com` para la app.

## Comandos locales

```bash
npm install
npm run dev:landing
npm run dev:bazar
```

## Produccion

Cada app tiene su propio `package.json`, por lo que Vercel puede desplegarlas
como proyectos independientes aunque vivan en el mismo repositorio.
