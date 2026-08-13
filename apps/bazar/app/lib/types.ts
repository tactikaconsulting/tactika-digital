export type View = "comprar" | "ingresar" | "cuenta" | "vender" | "admin";

export type UserRole = "cliente" | "comercio" | "admin";

export type Product = {
  id: number;
  name: string;
  store: string;
  category: string;
  price: number;
  tag: string;
  delivery: string;
  premier: number;
  imageClass: string;
};

export type CartItem = Product & { quantity: number };

export type Order = {
  id: string;
  status: string;
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
};
