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

## Proximas prioridades

1. Carrito y pedido funcional.
2. Panel comercio para productos, stock y pedidos.
3. Admin para usuarios, comercios, comisiones y publicidad.
4. Login y roles.
5. Base de datos.
6. Pagos, comisiones y Premier.
