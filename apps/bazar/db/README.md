# Base de datos Bazar

Este directorio deja preparada la base real del MVP.

## Motor usado

Usar Supabase Postgres del proyecto Tactika Consulting.

## Variable necesaria

```text
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
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

En Supabase se hace en:

```text
SQL Editor > New query
```

Las claves publicas se obtienen en:

```text
Project Settings > API
```

La URL de conexion Postgres se obtiene en:

```text
Project Settings > Database
```

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

## Login inicial

La app ya puede usar Supabase Auth cuando existan las variables en Vercel.

En el MVP se usa una clave temporal fija para pruebas:

```text
bazar-mvp-password
```

Antes de operar con usuarios reales, hay que cambiar esto por una pantalla de clave real,
recuperacion de clave y confirmacion de correo.
