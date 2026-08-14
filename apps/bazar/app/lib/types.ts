export type View = "comprar" | "ingresar" | "cuenta" | "vender" | "admin";

export type UserRole = "cliente" | "comercio" | "admin";

export type Product = {
  id: string;
  name: string;
  store: string;
  category: string;
  price: number;
  tag: string;
  delivery: string;
  premier: number;
  imageClass: string;
  stock?: number;
};

export type CartItem = Product & { quantity: number };

export type PaymentStatus = "pendiente" | "aprobado" | "rechazado" | "revision";

export type PaymentAttempt = {
  id: string;
  orderId: string;
  provider: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
  reference: string;
  riskLevel: "bajo" | "medio" | "alto";
  checks: string[];
};

export type Order = {
  id: string;
  status: string;
  paymentStatus: PaymentStatus;
  paymentProvider: string;
  total: number;
  commission: number;
  premier: number;
  items: CartItem[];
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
};

export type PaymentProvider = {
  name: string;
  status: string;
  use: string;
  settlement: string;
  priority: string;
};
