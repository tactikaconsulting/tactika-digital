import type { PaymentProvider, Product, UserAccount } from "./types";

export const products: Product[] = [
  {
    id: 1,
    name: "Canasta semanal hogar",
    store: "Almacen Central",
    category: "Almacen",
    price: 18990,
    tag: "Envio gratis",
    delivery: "Llega hoy",
    premier: 190,
    imageClass: "groceries",
  },
  {
    id: 2,
    name: "Pack brunch local",
    store: "Cafe Barrio Norte",
    category: "Comida",
    price: 12990,
    tag: "25 min",
    delivery: "Retiro o despacho",
    premier: 130,
    imageClass: "food",
  },
  {
    id: 3,
    name: "Cable USB-C reforzado",
    store: "Tecno Express",
    category: "Tecnologia",
    price: 6990,
    tag: "30% off",
    delivery: "Despacho 24 h",
    premier: 70,
    imageClass: "tech",
  },
  {
    id: 4,
    name: "Kit cuidado personal",
    store: "Farmacia Local",
    category: "Farmacia",
    price: 15990,
    tag: "Llega hoy",
    delivery: "Despacho express",
    premier: 160,
    imageClass: "pharmacy",
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
    status: "Candidato Chile",
    use: "Pagos con tarjeta y transferencia local.",
    settlement: "Liquidacion bancaria del comercio o cuenta Bazar.",
    priority: "Etapa 2",
  },
  {
    name: "Mercado Pago",
    status: "Recomendado MVP",
    use: "Checkout redirigido para cobrar rapido en septiembre.",
    settlement: "Bazar cobra y concilia pagos aprobados.",
    priority: "Etapa 1",
  },
  {
    name: "Transferencia",
    status: "Manual controlado",
    use: "Respaldo para comercios locales al inicio.",
    settlement: "Validacion manual contra cartola bancaria.",
    priority: "Etapa 1",
  },
  {
    name: "Saldo Bazar",
    status: "Futuro",
    use: "Saldo interno, devoluciones y beneficios Premier.",
    settlement: "Requiere reglas internas y control contable.",
    priority: "Etapa 3",
  },
];

export const businessRules = {
  marketplaceCommissionRate: 0.1,
  sponsoredProductsMonthlyFee: 49000,
  merchantProMonthlyFee: 19900,
};
