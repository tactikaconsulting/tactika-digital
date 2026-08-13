"use client";

import { useMemo, useState } from "react";
import { money } from "./lib/format";
import { businessRules, initialUsers, paymentProviders, products } from "./lib/seed";
import type { CartItem, Order, Product, UserAccount, UserRole, View } from "./lib/types";

export default function BazarApp() {
  const [view, setView] = useState<View>("comprar");
  const [adminSection, setAdminSection] = useState<"resumen" | "usuarios" | "pagos">("resumen");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "cliente" as UserRole,
  });

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
  const commission = Math.round(subtotal * businessRules.marketplaceCommissionRate);
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

  function createUser() {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      return;
    }

    setUsers((current) => [
      {
        id: `${newUser.role.toUpperCase()}-${1000 + current.length}`,
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        status: newUser.role === "comercio" ? "Pendiente KYC" : "Activo",
      },
      ...current,
    ]);
    setNewUser({ name: "", email: "", role: "cliente" });
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
            <button type="button" onClick={() => setView("vender")}>Soy comercio</button>
            <button type="button" onClick={() => setView("admin")}>Administrar</button>
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
            <p>Backoffice</p>
            <h1>Admin Bazar</h1>
            <span>
              Centro interno para usuarios, comercios, pedidos, pagos,
              comisiones, publicidad y reglas Premier.
            </span>
          </div>

          <div className="admin-tabs" role="tablist" aria-label="Modulos admin">
            <button
              type="button"
              className={adminSection === "resumen" ? "active" : ""}
              onClick={() => setAdminSection("resumen")}
            >
              Resumen
            </button>
            <button
              type="button"
              className={adminSection === "usuarios" ? "active" : ""}
              onClick={() => setAdminSection("usuarios")}
            >
              Usuarios y roles
            </button>
            <button
              type="button"
              className={adminSection === "pagos" ? "active" : ""}
              onClick={() => setAdminSection("pagos")}
            >
              Pagos e ingresos
            </button>
          </div>

          {adminSection === "resumen" && (
            <>
              <div className="cards">
                <article><strong>{money.format(monthlyCommission)}</strong><span>Comision acumulada</span></article>
                <article><strong>$480.000</strong><span>Publicidad destacada</span></article>
                <article><strong>126</strong><span>Comercios activos</span></article>
                <article><strong>{3 + orders.length}</strong><span>Pedidos por revisar</span></article>
              </div>
              <OrderList orders={orders} />
            </>
          )}

          {adminSection === "usuarios" && (
            <div className="admin-grid">
              <div className="form-panel">
                <h2>Crear usuario</h2>
                <input
                  value={newUser.name}
                  onChange={(event) =>
                    setNewUser((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Nombre o comercio"
                />
                <input
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="Correo"
                />
                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      role: event.target.value as UserRole,
                    }))
                  }
                >
                  <option value="cliente">Cliente</option>
                  <option value="comercio">Comercio</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="button" onClick={createUser}>
                  Crear usuario
                </button>
              </div>

              <UserTable users={users} />
            </div>
          )}

          {adminSection === "pagos" && (
            <>
              <div className="cards">
                <article><strong>10%</strong><span>Comision marketplace</span></article>
                <article><strong>{money.format(businessRules.sponsoredProductsMonthlyFee)}</strong><span>Producto destacado</span></article>
                <article><strong>{money.format(businessRules.merchantProMonthlyFee)}</strong><span>Plan comercio Pro</span></article>
                <article><strong>Por definir</strong><span>Fee despacho</span></article>
              </div>
              <div className="payment-grid">
                {paymentProviders.map((provider) => (
                  <article className="payment-card" key={provider.name}>
                    <strong>{provider.name}</strong>
                    <span>{provider.status}</span>
                    <p>{provider.use}</p>
                  </article>
                ))}
              </div>
              <div className="revenue-plan">
                <h2>Fuentes de ingreso</h2>
                <p>Comision por venta, tiendas destacadas, productos patrocinados, planes Pro para comercios y fee de despacho.</p>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function UserTable({ users }: { users: UserAccount[] }) {
  return (
    <div className="table-panel">
      <h2>Usuarios registrados</h2>
      {users.map((user) => (
        <article className="table-row" key={user.id}>
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <span>{user.role}</span>
          <mark>{user.status}</mark>
        </article>
      ))}
    </div>
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
