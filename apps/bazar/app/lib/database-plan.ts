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
    name: "Auditoria",
    table: "audit_logs",
    purpose: "Registro interno de acciones sensibles y revision admin.",
  },
];

export const databaseChecklist = [
  "Crear base Postgres en Neon o Supabase.",
  "Agregar DATABASE_URL en Vercel.",
  "Ejecutar apps/bazar/db/schema.sql.",
  "Conectar login real a users.",
  "Guardar productos del comercio en products.",
  "Crear pedidos pendientes antes de pagar.",
  "Actualizar payments solo desde webhook validado.",
];
