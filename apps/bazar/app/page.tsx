"use client";

import { useMemo, useState } from "react";

type View = "comprar" | "cuenta" | "vender" | "admin";
type Product = {
  id: number;
  name: string;
  store: string;
  price: number;
  tag: string;
  premier: number;
};
type CartItem = Product & { quantity: number };
type Order = {
  id: string;
  status: string;
  total: number;
  commission: number;
  premier: number;
  items: CartItem[];
};

const products: Product[] = [
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

const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export default function BazarApp() {
  const [view, setView] = useState<View>("comprar");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.store}`.toLowerCase().includes(value),
    );
  }, [query]);

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );
  const premier = useMemo(
    () => cart.reduce((total, item) => total + item.premier * item.quantity, 0),
    [cart],
  );
  const commission = Math.round(subtotal * 0.1);
  const monthlyCommission = orders.reduce(
    (total, order) => total + order.commission,
    277000,
  );

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function confirmOrder() {
    if (cart.length === 0) {
      return;
    }

    const order: Order = {
      id: `BZ-${1043 + orders.length}`,
      status: "Recibido",
      total: subtotal,
      commission,
      premier,
      items: cart,
    };

    setOrders((current) => [order, ...current]);
    setCart([]);
    setView("cuenta");
  }

  return (
    <main>
      <header className="market-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => setView("comprar")}>
            Bazar
          </button>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar productos, marcas y comercios"
          />
          <nav>
            <button type="button" onClick={() => setView("comprar")}>Comprar</button>
            <button type="button" onClick={() => setView("cuenta")}>Mi cuenta</button>
            <button type="button" onClick={() => setView("vender")}>Vender</button>
            <button type="button" onClick={() => setView("admin")}>Admin</button>
          </nav>
        </div>
      </header>

      {view === "comprar" && (
        <section className="market-layout">
          <aside className="panel">
            <h2>Filtros</h2>
            <label><input type="checkbox" defaultChecked /> Envio gratis</label>
            <label><input type="checkbox" /> Llega hoy</label>
            <label><input type="checkbox" defaultChecked /> Suma Premier</label>
          </aside>

          <section className="results">
            <div className="hero">
              <p>Marketplace local</p>
              <h1>Compra en comercios cercanos y deja el pedido ordenado.</h1>
              <span>
                Bazar busca reemplazar ventas sueltas por redes con catalogo,
                carrito, pedido y beneficios Premier.
              </span>
            </div>
            {filteredProducts.map((product) => (
              <article className="product" key={product.id}>
                <div className="image" />
                <div>
                  <p>{product.store}</p>
                  <h2>{product.name}</h2>
                  <span>{product.tag} · +{product.premier} Premier</span>
                </div>
                <div className="product-action">
                  <strong>{money.format(product.price)}</strong>
                  <button type="button" onClick={() => addToCart(product)}>
                    Agregar
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="panel checkout">
            <h2>Tu compra</h2>
            {cart.length === 0 ? (
              <p>Agrega productos para simular el carrito.</p>
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div key={item.id}>
                    <span>{item.quantity} x {item.name}</span>
                    <strong>{money.format(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="totals">
              <span>Subtotal</span>
              <strong>{money.format(subtotal)}</strong>
            </div>
            <div className="totals">
              <span>Premier</span>
              <strong>{premier} pts</strong>
            </div>
            <button type="button" onClick={confirmOrder} disabled={cart.length === 0}>
              Confirmar pedido
            </button>
          </aside>
        </section>
      )}

      {view === "cuenta" && (
        <Dashboard
          title="Mi cuenta"
          subtitle="Perfil, direcciones, pedidos y puntos Premier del cliente."
          metrics={[
            [String(1840 + orders.reduce((total, order) => total + order.premier, 0)), "Puntos Premier"],
            [String(12 + orders.length), "Compras"],
            ["3", "Direcciones"],
            ["2", "Medios de pago"],
          ]}
          orders={orders}
        />
      )}

      {view === "vender" && (
        <Dashboard
          title="Centro de vendedores"
          subtitle="Productos, stock, ventas y pedidos del comercio."
          metrics={[
            ["$2.770.000", "Ventas mes"],
            [String(177 + orders.length), "Pedidos"],
            ["24", "Productos activos"],
            [money.format(monthlyCommission), "Comision Bazar"],
          ]}
          orders={orders}
        />
      )}

      {view === "admin" && (
        <section className="dashboard">
          <div className="section-title">
            <p>Modelo de ingresos</p>
            <h1>Admin Bazar</h1>
            <span>
              Control de usuarios, comercios, comisiones, publicidad interna y
              reglas Premier.
            </span>
          </div>
          <div className="cards">
            <article><strong>{money.format(monthlyCommission)}</strong><span>Comision acumulada</span></article>
            <article><strong>$480.000</strong><span>Publicidad destacada</span></article>
            <article><strong>126</strong><span>Comercios activos</span></article>
            <article><strong>{3 + orders.length}</strong><span>Pedidos por revisar</span></article>
          </div>
          <div className="revenue-plan">
            <h2>Fuentes de ingreso</h2>
            <p>Comision por venta, tiendas destacadas, productos patrocinados, planes Pro para comercios y fee de despacho.</p>
          </div>
          <OrderList orders={orders} />
        </section>
      )}
    </main>
  );
}

function Dashboard({
  title,
  subtitle,
  metrics,
  orders,
}: {
  title: string;
  subtitle: string;
  metrics: [string, string][];
  orders?: Order[];
}) {
  return (
    <section className="dashboard">
      <div className="section-title">
        <p>Bazar</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>
      <div className="cards">
        {metrics.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
      <OrderList orders={orders ?? []} />
    </section>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="order-panel">
        <h2>Pedidos recientes</h2>
        <p>Aun no hay pedidos simulados. Agrega productos y confirma una compra.</p>
      </div>
    );
  }

  return (
    <div className="order-panel">
      <h2>Pedidos recientes</h2>
      {orders.map((order) => (
        <article className="order-row" key={order.id}>
          <div>
            <strong>{order.id}</strong>
            <span>{order.items.length} productos · {order.status}</span>
          </div>
          <div>
            <strong>{money.format(order.total)}</strong>
            <span>Comision {money.format(order.commission)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
