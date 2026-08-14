# Base de datos Bazar

Este directorio deja preparada la base real del MVP.

## Motor recomendado

Usar Postgres. Puede ser:

- Neon Postgres en Vercel Marketplace.
- Supabase Postgres.

## Variable necesaria

```text
DATABASE_URL=postgres://...
```

En Vercel se agrega en:

```text
Project Settings > Environment Variables
```

## Primer despliegue de esquema

Ejecutar el contenido de:

```text
apps/bazar/db/schema.sql
```

en el editor SQL de Neon o Supabase.

## Modulos cubiertos

- Usuarios y roles.
- Comercios y validacion KYC.
- Productos y stock.
- Pedidos e items.
- Pagos y eventos de webhook.
- Seguridad antifraude.
- Premier.
- Auditoria interna.

## Regla operacional

Un pedido no debe pasar a `pago_aprobado` solo porque el usuario vuelve desde la pasarela.
Debe aprobarse solo cuando el servidor recibe un evento valido, verifica firma, monto, referencia
y estado del proveedor.
