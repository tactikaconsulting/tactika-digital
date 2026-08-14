export const databaseModules = [
  {
    name: "Usuarios",
    table: "users",
    purpose: "Clientes, comercios y administradores con roles separados.",
  },
  {
    name: "Comercios",
    table: "merchants",
    purpose: "Datos del negocio, estado KYC y comision por venta.",
  },
  {
    name: "Verificacion",
    table: "identity_verifications",
    purpose: "RUT, numero de documento, carnet, selfie y revision admin.",
  },
  {
    name: "Productos",
    table: "products",
    purpose: "Catalogo, categorias, precios, stock y puntos Premier.",
  },
  {
    name: "Pedidos",
    table: "orders / order_items",
    purpose: "Compra completa con productos, despacho, total y estado.",
  },
  {
    name: "Pagos",
    table: "payments / payment_events",
    purpose: "Proveedor, estado, riesgo, webhook y validaciones antifraude.",
  },
  {
    name: "Premier",
    table: "premier_ledger",
    purpose: "Movimientos de puntos por compra, ajuste o devolucion.",
  },
  {
    name: "Publicidad",
    table: "ad_packages / ad_campaigns",
    purpose: "Paquetes de alianza, marcas destacadas y campanas comerciales.",
  },
  {
    name: "Auditoria",
    table: "audit_logs",
    purpose: "Registro interno de acciones sensibles y revision admin.",
  },
];

export const databaseChecklist = [
  "Usar el proyecto Supabase existente de Tactika Consulting.",
  "Agregar NEXT_PUBLIC_SUPABASE_URL en Vercel.",
  "Agregar NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.",
  "Agregar DATABASE_URL en Vercel para tareas servidor.",
  "Ejecutar apps/bazar/db/schema.sql.",
  "Crear tu usuario admin y asignar role = admin en public.users.",
  "Conectar login real a users.",
  "Guardar documentos KYC en Supabase Storage y registrar ruta en identity_verifications.",
  "Guardar productos del comercio en products.",
  "Crear pedidos pendientes antes de pagar.",
  "Actualizar payments solo desde webhook validado.",
  "Crear paquetes de publicidad en ad_packages para vender alianzas.",
];
