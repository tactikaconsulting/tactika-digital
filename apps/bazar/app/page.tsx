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
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState("");
  const [query, setQuery] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [accountDraft, setAccountDraft] = useState({
    name: "",
    email: "",
    role: "cliente" as Exclude<UserRole, "admin">,
  });
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
    setActiveUser((current) => current ?? initialUsers[0]);
    setView("cuenta");
  }

  function signInAs(user: UserAccount) {
    setActiveUser(user);
    setAuthMessage("");

    if (user.role === "comercio") {
      setView("vender");
      return;
    }

    if (user.role === "admin") {
      setView("admin");
      return;
    }

    setView("cuenta");
  }

  function submitLogin() {
    const email = loginEmail.trim().toLowerCase();
    const user = users.find((account) => account.email.toLowerCase() === email);

    if (!user) {
      setAuthMessage("No encontramos ese correo. Puedes crear una cuenta nueva.");
      return;
    }

    signInAs(user);
  }

  function submitRegistration() {
    if (!accountDraft.name.trim() || !accountDraft.email.trim()) {
      setAuthMessage("Completa nombre y correo para crear la cuenta.");
      return;
    }

    const existingUser = users.find(
      (user) => user.email.toLowerCase() === accountDraft.email.trim().toLowerCase(),
    );

    if (existingUser) {
      setAuthMessage("Ese correo ya existe. Puedes iniciar sesion con esa cuenta.");
      setAuthMode("login");
      setLoginEmail(existingUser.email);
      return;
    }

    const createdUser: UserAccount = {
      id: `${accountDraft.role.toUpperCase()}-${1000 + users.length}`,
      name: accountDraft.name.trim(),
      email: accountDraft.email.trim(),
      role: accountDraft.role,
      status: accountDraft.role === "comercio" ? "Pendiente KYC" : "Activo",
    };

    setUsers((current) => [createdUser, ...current]);
    setAccountDraft({ name: "", email: "", role: "cliente" });
    signInAs(createdUser);
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
            <button type="button" onClick={() => setView("vender")}>Comercio</button>
            <button type="button" onClick={() => setView(activeUser ? "cuenta" : "ingresar")}>
              {activeUser ? "Mi cuenta" : "Ingresar"}
            </button>
          </nav>
        </div>
        <div className="session-bar">
          <span>{activeUser ? `${activeUser.name} · ${activeUser.role}` : "Estas navegando como invitado"}</span>
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

      {view === "ingresar" && (
        <section className="dashboard">
          <div className="section-title">
            <p>Cuenta Bazar</p>
            <h1>Ingresa o crea tu cuenta</h1>
            <span>
              El MVP ya deja clara la base del sistema: clientes compran, comercios venden
              y administradores gestionan la plataforma.
            </span>
          </div>

          <div className="auth-layout">
            <section className="auth-card">
              <div className="auth-tabs" role="tablist" aria-label="Ingreso Bazar">
                <button
                  type="button"
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => {
                    setAuthMode("login");
                    setAuthMessage("");
                  }}
                >
                  Iniciar sesion
                </button>
                <button
                  type="button"
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => {
                    setAuthMode("register");
                    setAuthMessage("");
                  }}
                >
                  Crear cuenta
                </button>
              </div>

              {authMode === "login" ? (
                <div className="auth-form">
                  <label>
                    Correo
                    <input
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder="tu@correo.cl"
                      type="email"
                    />
                  </label>
                  <label>
                    Clave
                    <input placeholder="Clave simulada para MVP" type="password" />
                  </label>
                  <button type="button" onClick={submitLogin}>
                    Entrar a mi cuenta
                  </button>
                </div>
              ) : (
                <div className="auth-form">
                  <label>
                    Nombre
                    <input
                      value={accountDraft.name}
                      onChange={(event) =>
                        setAccountDraft((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Nombre o comercio"
                    />
                  </label>
                  <label>
                    Correo
                    <input
                      value={accountDraft.email}
                      onChange={(event) =>
                        setAccountDraft((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="tu@correo.cl"
                      type="email"
                    />
                  </label>
                  <label>
                    Tipo de cuenta
                    <select
                      value={accountDraft.role}
                      onChange={(event) =>
                        setAccountDraft((current) => ({
                          ...current,
                          role: event.target.value as Exclude<UserRole, "admin">,
                        }))
                      }
                    >
                      <option value="cliente">Cliente comprador</option>
                      <option value="comercio">Comercio vendedor</option>
                    </select>
                  </label>
                  <button type="button" onClick={submitRegistration}>
                    Crear y entrar
                  </button>
                </div>
              )}

              {authMessage && <p className="auth-message">{authMessage}</p>}
            </section>

            <aside className="demo-users">
              <h2>Usuarios de prueba</h2>
              <p>Sirven para revisar los roles mientras conectamos autenticacion real.</p>
              {users.slice(0, 3).map((user) => (
                <article className="login-card" key={user.id}>
                  <span>{user.role}</span>
                  <strong>{user.name}</strong>
                  <p>{user.email}</p>
                  <button type="button" onClick={() => signInAs(user)}>
                    Entrar como {user.role}
                  </button>
                </article>
              ))}
            </aside>
          </div>
        </section>
      )}

      {view === "cuenta" && (
        <section className="dashboard">
          <div className="section-title">
            <p>Cliente</p>
            <h1>Mi cuenta</h1>
            <span>
              {activeUser
                ? `${activeUser.name}: perfil del comprador, pedidos, direcciones, medios de pago y puntos Premier.`
                : "Para ver una cuenta real, entra con un usuario cliente."}
            </span>
          </div>

          {activeUser ? (
            <div className="account-layout">
              <section className="account-main">
                <div className="cards">
                  {[
                    [String(1840 + orders.reduce((total, order) => total + order.premier, 0)), "Puntos Premier"],
                    [String(12 + orders.length), "Compras"],
                    ["3", "Direcciones"],
                    ["2", "Medios de pago"],
                  ].map(([value, label]) => (
                    <article key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </article>
                  ))}
                </div>
                <OrderList orders={orders} />
              </section>

              <aside className="account-panel">
                <h2>Accesos de mi cuenta</h2>
                <button type="button" className="active">
                  Perfil cliente
                </button>
                <button type="button" onClick={() => setView("ingresar")}>
                  Cambiar usuario
                </button>
                {activeUser.role === "admin" && (
                  <button type="button" onClick={() => setView("admin")}>
                    Administrar Bazar
                  </button>
                )}
                <p>
                  El cliente compra y revisa pedidos. Comercio y admin tienen paneles separados.
                </p>
              </aside>
            </div>
          ) : (
            <EmptyAccess onSignIn={() => setView("ingresar")} />
          )}
        </section>
      )}

      {view === "vender" && (
        activeUser?.role === "comercio" || activeUser?.role === "admin" ? (
          <Dashboard
            label="Comercio"
            title="Panel comercio"
            subtitle="Espacio separado para que cada negocio publique productos, controle stock, revise ventas y gestione pedidos."
            metrics={[
              ["$2.770.000", "Ventas mes"],
              [String(177 + orders.length), "Pedidos"],
              ["24", "Productos activos"],
              [money.format(monthlyCommission), "Comision Bazar"],
            ]}
            orders={orders}
          />
        ) : (
          <section className="dashboard">
            <div className="section-title">
              <p>Comercio</p>
              <h1>Vender en Bazar</h1>
              <span>
                Este modulo es para negocios. Ingresa como comercio para publicar productos,
                gestionar pedidos y ver comisiones.
              </span>
            </div>
            <EmptyAccess onSignIn={() => setView("ingresar")} />
          </section>
        )
      )}

      {view === "admin" && (
        activeUser?.role === "admin" ? (
          <section className="dashboard">
          <div className="section-title">
            <p>Backoffice</p>
            <h1>Admin Bazar</h1>
            <span>
              Centro interno para usuarios, comercios, pedidos, pagos,
              comisiones, publicidad y reglas Premier.
            </span>
            <button className="back-link" type="button" onClick={() => setView("cuenta")}>
              Volver a mi cuenta
            </button>
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
        ) : (
          <section className="dashboard">
            <div className="section-title">
              <p>Backoffice</p>
              <h1>Administracion protegida</h1>
              <span>
                Este modulo no debe quedar abierto. Ingresa como administrador para revisar usuarios,
                comercios, pagos e ingresos.
              </span>
            </div>
            <EmptyAccess onSignIn={() => setView("ingresar")} />
          </section>
        )
      )}
    </main>
  );
}

function EmptyAccess({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="empty-access">
      <strong>Necesitas ingresar</strong>
      <p>Selecciona un usuario de prueba para ver la experiencia que corresponde a cada rol.</p>
      <button type="button" onClick={onSignIn}>
        Ir a ingresar
      </button>
    </div>
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
  label = "Bazar",
  title,
  subtitle,
  metrics,
  orders,
}: {
  label?: string;
  title: string;
  subtitle: string;
  metrics: [string, string][];
  orders?: Order[];
}) {
  return (
    <section className="dashboard">
      <div className="section-title">
        <p>{label}</p>
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
