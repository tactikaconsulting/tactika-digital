# Bazar App

Repositorio para construir Bazar como aplicacion marketplace.

## Decision actual

- La landing de asesoria existente se mantiene aparte y no se toca.
- Este repositorio se enfoca en la app Bazar.
- El dominio recomendado para produccion es `bazar.tactikaconsulting.com`.

## Proyecto activo

```text
apps/bazar
```

## Vercel

Configura el proyecto de Vercel con:

```text
Root Directory: apps/bazar
Domain: bazar.tactikaconsulting.com
```

## Desarrollo local

```bash
npm install
npm run dev:bazar
```

## Base de datos

El esquema inicial esta en:

```text
apps/bazar/db/schema.sql
```

La app esta preparada para Postgres usando Neon o Supabase. La variable requerida sera:

```text
DATABASE_URL
```

## Proximas prioridades

1. Crear base Postgres en Neon o Supabase.
2. Conectar login real a usuarios y roles.
3. Guardar comercios, productos, pedidos y pagos en la base.
4. Conectar webhook real de pagos.
5. Panel comercio para productos, stock y pedidos reales.
6. Admin para usuarios, comercios, comisiones, pagos y seguridad.
