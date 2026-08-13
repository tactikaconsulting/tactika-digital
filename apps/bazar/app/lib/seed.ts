import type { PaymentProvider, Product, UserAccount } from "./types";

export const products: Product[] = [
  {
    id: 1,
    name: "Canasta semanal hogar",
    store: "Almacen Central",
    price: 18990,
    tag: "Envio gratis",
    premier: 190,
  },
  {
    id: 2,
    name: "Pack brunch local",
    store: "Cafe Barrio Norte",
    price: 12990,
    tag: "25 min",
    premier: 130,
  },
  {
    id: 3,
    name: "Cable USB-C reforzado",
    store: "Tecno Express",
    price: 6990,
    tag: "30% off",
    premier: 70,
  },
  {
    id: 4,
    name: "Kit cuidado personal",
    store: "Farmacia Local",
    price: 15990,
    tag: "Llega hoy",
    premier: 160,
  },
];

export const initialUsers: UserAccount[] = [
  {
    id: "USR-1001",
    name: "Camila Rojas",
    email: "camila@cliente.cl",
    role: "cliente",
    status: "Activo",
  },
  {
    id: "STR-204",
    name: "Almacen Central",
    email: "ventas@almacencentral.cl",
    role: "comercio",
    status: "Pendiente KYC",
  },
  {
    id: "ADM-001",
    name: "Administrador Bazar",
    email: "admin@bazar.local",
    role: "admin",
    status: "Activo",
  },
];

export const paymentProviders: PaymentProvider[] = [
  {
    name: "Webpay / Transbank",
    status: "Pendiente integracion",
    use: "Pagos con tarjeta y transferencia local.",
  },
  {
    name: "Stripe",
    status: "Fase futura",
    use: "Suscripciones, comercios Pro y pagos internacionales.",
  },
  {
    name: "Bazar Wallet",
    status: "Diseno",
    use: "Saldo interno, devoluciones y beneficios Premier.",
  },
];

export const businessRules = {
  marketplaceCommissionRate: 0.1,
  sponsoredProductsMonthlyFee: 49000,
  merchantProMonthlyFee: 19900,
};
