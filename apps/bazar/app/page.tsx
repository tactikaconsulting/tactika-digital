"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { money } from "./lib/format";
import { databaseChecklist, databaseModules } from "./lib/database-plan";
import { businessRules, initialUsers, paymentProviders, paymentSecurityRules, products } from "./lib/seed";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import type { CartItem, Order, PaymentAttempt, Product, UserAccount, UserRole, View } from "./lib/types";

type KycDraft = {
  rut: string;
  documentNumber: string;
  documentSerial: string;
  frontPhoto: string;
  selfiePhoto: string;
};

export default function BazarApp() {
  const [view, setView] = useState<View>("comprar");
  const [adminSection, setAdminSection] = useState<"resumen" | "clientes" | "comercios" | "usuarios" | "ganancias" | "pagos" | "datos">("resumen");
  const [customerSection, setCustomerSection] = useState<"compras" | "direcciones" | "premier" | "pagos" | "verificacion">("compras");
  const [merchantSection, setMerchantSection] = useState<"resumen" | "productos" | "stock" | "pedidos" | "pagos" | "verificacion">("resumen");
  const [checkoutStep, setCheckoutStep] = useState<"carrito" | "entrega" | "pago">("carrito");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [adminCode, setAdminCode] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [deliveryMethod, setDeliveryMethod] = useState<"Despacho" | "Retiro">("Despacho");
  const [paymentMethod, setPaymentMethod] = useState("Webpay");
  const [shippingAddress, setShippingAddress] = useState("Av. Principal 123, Santiago");
  const [loginEmail, setLoginEmail] = useState("");
  const [accountDraft, setAccountDraft] = useState({
    name: "",
    email: "",
    role: "cliente" as Exclude<UserRole, "admin">,
  });
  const [kycDraft, setKycDraft] = useState<KycDraft>({
    rut: "",
    documentNumber: "",
    documentSerial: "",
    frontPhoto: "",
    selfiePhoto: "",
  });
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [redeemedPremier, setRedeemedPremier] = useState(0);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "cliente" as UserRole,
  });

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLowerCase();
    const categoryFiltered = selectedCategory === "Todos"
      ? products
      : products.filter((product) => product.category === selectedCategory);

    if (!value) {
      return categoryFiltered;
    }

    return categoryFiltered.filter((product) =>
      `${product.name} ${product.store} ${product.category}`.toLowerCase().includes(value),
    );
  }, [query, selectedCategory]);

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );
  const premier = useMemo(
    () => cart.reduce((total, item) => total + item.premier * item.quantity, 0),
    [cart],
  );
  const commission = Math.round(subtotal * businessRules.marketplaceCommissionRate);
  const deliveryFee = deliveryMethod === "Despacho" && subtotal > 0 ? 1990 : 0;
  const serviceFee = subtotal > 0 ? 690 : 0;
  const orderTotal = subtotal + deliveryFee + serviceFee;
  const suspiciousPayments = payments.filter((payment) => payment.status === "revision" || payment.riskLevel !== "bajo");
  const monthlyCommission = orders.reduce(
    (total, order) => total + order.commission,
    277000,
  );
  const categories = ["Todos", ...Array.from(new Set(products.map((product) => product.category)))];
  const supabaseConfigured = isSupabaseConfigured();
  const clientUsers = users.filter((user) => user.role === "cliente");
  const merchantUsers = users.filter((user) => user.role === "comercio");
  const bazarRevenue = payments.reduce((total, payment) => total + payment.amount, 0) + 480000;
  const merchantSales = orders.reduce((total, order) => total + order.total - order.commission, 2770000);
  const pendingKyc = merchantUsers.filter((user) => user.status.toLowerCase().includes("pendiente")).length;
  const premierBalance = 1840 + orders.reduce((total, order) => total + order.premier, 0) - redeemedPremier;
  const adSlots = [
    ["Banner superior", "$120.000/mes", "Marca visible en la vitrina principal"],
    ["Producto destacado", money.format(businessRules.sponsoredProductsMonthlyFee), "Prioridad en categoria"],
    ["Comercio aliado", "$180.000/mes", "Bloque de tienda recomendada"],
  ];

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
    setCheckoutStep("carrito");
  }

  function removeFromCart(productId: number) {
    setCart((current) => current.filter((item) => item.id !== productId));
  }

  function confirmOrder() {
    if (cart.length === 0) {
      return;
    }

    const order: Order = {
      id: `BZ-${1043 + orders.length}`,
      status: "Pedido pagado",
      paymentStatus: "aprobado",
      paymentProvider: paymentMethod,
      total: orderTotal,
      commission,
      premier,
      items: cart,
    };
    const payment: PaymentAttempt = {
      id: `PAY-${2200 + payments.length}`,
      orderId: order.id,
      provider: paymentMethod,
      status: "aprobado",
      amount: orderTotal,
      createdAt: "Septiembre MVP",
      reference: `SIM-${paymentMethod.toUpperCase().replaceAll(" ", "-")}-${1043 + orders.length}`,
      riskLevel: paymentMethod === "Transferencia" ? "medio" : "bajo",
      checks: [
        "Monto coincide con pedido",
        "Referencia unica",
        "Estado aprobado por servidor",
        paymentMethod === "Transferencia" ? "Requiere conciliacion bancaria" : "Webhook simulado valido",
      ],
    };

    setOrders((current) => [order, ...current]);
    setPayments((current) => [payment, ...current]);
    setCart([]);
    setCheckoutStep("carrito");
    setActiveUser((current) => current ?? initialUsers[0]);
    setView("cuenta");
  }

  function continueCheckout() {
    if (cart.length === 0) {
      return;
    }

    if (checkoutStep === "carrito") {
      setCheckoutStep("entrega");
      return;
    }

    if (checkoutStep === "entrega") {
      setCheckoutStep("pago");
      return;
    }

    confirmOrder();
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

  function unlockAdmin() {
    if (adminCode.trim() !== "BAZAR-ADMIN") {
      setAuthMessage("Codigo admin incorrecto.");
      return;
    }

    const adminUser = users.find((user) => user.role === "admin") ?? initialUsers[2];
    signInAs(adminUser);
    setAdminCode("");
  }

  function submitKyc() {
    if (!kycDraft.rut.trim() || !kycDraft.documentNumber.trim() || !kycDraft.documentSerial.trim()) {
      setAuthMessage("Completa RUT, numero de documento y numero de serie.");
      return;
    }

    setKycSubmitted(true);
    setAuthMessage("");
    setActiveUser((current) => current ? { ...current, status: "Verificacion enviada" } : current);
  }

  function redeemPremier(points: number) {
    if (premierBalance < points) {
      return;
    }

    setRedeemedPremier((current) => current + points);
  }

  async function submitLogin() {
    const email = loginEmail.trim().toLowerCase();

    if (!email) {
      setAuthMessage("Ingresa tu correo para continuar.");
      return;
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: "bazar-mvp-password",
      });
      setAuthLoading(false);

      if (error || !data.user) {
        setAuthMessage("No pudimos iniciar sesion en Supabase. Revisa correo, clave o confirmacion.");
        return;
      }

      const role = (data.user.user_metadata.role as UserRole | undefined) ?? "cliente";
      signInAs({
        id: data.user.id,
        name: data.user.user_metadata.name ?? data.user.email ?? "Usuario Bazar",
        email: data.user.email ?? email,
        role,
        status: "Activo",
      });
      return;
    }

    const user = users.find((account) => account.email.toLowerCase() === email);

    if (!user) {
      setAuthMessage("No encontramos ese correo. Puedes crear una cuenta nueva.");
      return;
    }

    signInAs(user);
  }

  async function submitRegistration() {
    if (!accountDraft.name.trim() || !accountDraft.email.trim()) {
      setAuthMessage("Completa nombre y correo para crear la cuenta.");
      return;
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: accountDraft.email.trim(),
        password: "bazar-mvp-password",
        options: {
          data: {
            name: accountDraft.name.trim(),
            role: accountDraft.role,
          },
        },
      });
      setAuthLoading(false);

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      if (!data.user) {
        setAuthMessage("Cuenta enviada a Supabase. Revisa si requiere confirmacion por correo.");
        return;
      }

      const createdUser: UserAccount = {
        id: data.user.id,
        name: accountDraft.name.trim(),
        email: data.user.email ?? accountDraft.email.trim(),
        role: accountDraft.role,
        status: "Activo",
      };

      setUsers((current) => [createdUser, ...current]);
      setAccountDraft({ name: "", email: "", role: "cliente" });
      signInAs(createdUser);
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
            <button type="button" className="account-nav" onClick={() => setView(activeUser ? "cuenta" : "ingresar")}>
              {activeUser ? "Mi cuenta" : "Ingresar"}
            </button>
          </nav>
        </div>
        <div className="session-bar">
          <span>{activeUser ? `${activeUser.name} · ${activeUser.role}` : "Estas navegando como invitado"}</span>
        </div>
      </header>

      {view === "comprar" && (
        <section className="market-shell">
          <div className="market-hero">
            <div>
              <p>Marketplace local</p>
              <h1>Compra cerca, paga seguro y acumula Premier.</h1>
              <span>
                Catalogo, carrito, despacho y pagos en un solo flujo para reemplazar ventas
                sueltas por redes sociales.
              </span>
            </div>
            <div className="hero-metrics">
              <article><strong>24 h</strong><span>Despacho local</span></article>
              <article><strong>+Premier</strong><span>Beneficios por compra</span></article>
              <article><strong>10%</strong><span>Comision Bazar visible</span></article>
            </div>
          </div>

          <div className="category-strip" aria-label="Categorias">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={selectedCategory === category ? "active" : ""}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <section className="ad-marketplace">
            {adSlots.map(([name, price, description]) => (
              <article key={name}>
                <span>Espacio publicitario</span>
                <strong>{name}</strong>
                <p>{description}</p>
                <mark>{price}</mark>
              </article>
            ))}
          </section>

          <div className="market-layout">
            <aside className="panel filter-panel">
              <h2>Compra inteligente</h2>
              <label><input type="checkbox" defaultChecked /> Comercios verificados</label>
              <label><input type="checkbox" defaultChecked /> Suma Premier</label>
              <label><input type="checkbox" /> Solo despacho hoy</label>
              <div className="trust-box">
                <strong>Pago protegido</strong>
                <span>Primero simulamos Webpay, Mercado Pago, transferencia y saldo Bazar.</span>
              </div>
            </aside>

            <section className="results">
              <div className="results-head">
                <div>
                  <p>{filteredProducts.length} resultados</p>
                  <h2>{selectedCategory === "Todos" ? "Productos destacados" : selectedCategory}</h2>
                </div>
                <span>Orden recomendado</span>
              </div>

              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className={`image ${product.imageClass}`} />
                    <div className="product-body">
                      <p>{product.store}</p>
                      <h2>{product.name}</h2>
                      <span>{product.delivery} · {product.tag}</span>
                      <strong>{money.format(product.price)}</strong>
                    </div>
                    <div className="product-footer">
                      <mark>+{product.premier} Premier</mark>
                      <button type="button" onClick={() => addToCart(product)}>
                        Agregar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="checkout">
              <div className="checkout-card">
                <h2>Checkout</h2>
                <div className="checkout-steps" aria-label="Pasos de compra">
                  {["carrito", "entrega", "pago"].map((step) => (
                    <span key={step} className={checkoutStep === step ? "active" : ""}>
                      {step}
                    </span>
                  ))}
                </div>

                {cart.length === 0 ? (
                  <p className="empty-cart">Agrega productos para iniciar una compra.</p>
                ) : (
                  <div className="cart-list">
                    {cart.map((item) => (
                      <div key={item.id}>
                        <span>{item.quantity} x {item.name}</span>
                        <strong>{money.format(item.price * item.quantity)}</strong>
                        <button type="button" onClick={() => removeFromCart(item.id)}>
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {checkoutStep === "entrega" && (
                  <div className="checkout-form">
                    <label>
                      Direccion
                      <input
                        value={shippingAddress}
                        onChange={(event) => setShippingAddress(event.target.value)}
                      />
                    </label>
                    <label>
                      Entrega
                      <select
                        value={deliveryMethod}
                        onChange={(event) =>
                          setDeliveryMethod(event.target.value as "Despacho" | "Retiro")
                        }
                      >
                        <option value="Despacho">Despacho a domicilio</option>
                        <option value="Retiro">Retiro en comercio</option>
                      </select>
                    </label>
                  </div>
                )}

                {checkoutStep === "pago" && (
                  <div className="payment-stage">
                    <div className="payment-options">
                      {["Mercado Pago", "Webpay", "Transferencia", "Saldo Bazar"].map((method) => (
                        <button
                          type="button"
                          key={method}
                          className={paymentMethod === method ? "active" : ""}
                          onClick={() => setPaymentMethod(method)}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    <div className="payment-readiness">
                      <strong>Pago seguro preparado</strong>
                      <span>Crear sesion de pago</span>
                      <span>Redirigir a checkout</span>
                      <span>Confirmar por webhook</span>
                      <span>Validar monto y referencia</span>
                    </div>
                  </div>
                )}

                {checkoutStep === "carrito" && payments.length > 0 && (
                  <div className="last-payment">
                    <strong>Ultimo pago simulado</strong>
                    <span>{payments[0].id} · {payments[0].provider} · {payments[0].status}</span>
                  </div>
                )}

                {checkoutStep === "pago" && (
                  <div className="gateway-note">
                    <strong>{paymentMethod}</strong>
                    <span>
                      Bazar no aceptara capturas ni comprobantes manuales. El pedido se liberara
                      solo si el servidor confirma el pago, el monto y la referencia.
                    </span>
                  </div>
                )}

                <div className="totals">
                  <span>Subtotal</span>
                  <strong>{money.format(subtotal)}</strong>
                </div>
                <div className="totals">
                  <span>Despacho</span>
                  <strong>{money.format(deliveryFee)}</strong>
                </div>
                <div className="totals">
                  <span>Servicio Bazar</span>
                  <strong>{money.format(serviceFee)}</strong>
                </div>
                <div className="totals total-final">
                  <span>Total</span>
                  <strong>{money.format(orderTotal)}</strong>
                </div>
                <div className="totals">
                  <span>Premier</span>
                  <strong>{premier} pts</strong>
                </div>

                <button type="button" onClick={continueCheckout} disabled={cart.length === 0}>
                  {checkoutStep === "carrito" && "Continuar a entrega"}
                  {checkoutStep === "entrega" && "Continuar a pago"}
                  {checkoutStep === "pago" && `Pagar con ${paymentMethod}`}
                </button>
                {checkoutStep !== "carrito" && (
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setCheckoutStep(checkoutStep === "pago" ? "entrega" : "carrito")}
                  >
                    Volver
                  </button>
                )}
              </div>
            </aside>
          </div>
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
            <span className="connection-state">
              {supabaseConfigured ? "Supabase configurado: ingreso real activo." : "Modo demo: agrega variables de Supabase en Vercel para activar ingreso real."}
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
                  <button type="button" onClick={submitLogin} disabled={authLoading}>
                    {authLoading ? "Entrando..." : "Entrar a mi cuenta"}
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
                  <button type="button" onClick={submitRegistration} disabled={authLoading}>
                    {authLoading ? "Creando..." : "Crear y entrar"}
                  </button>
                </div>
              )}

              {authMessage && <p className="auth-message">{authMessage}</p>}
            </section>

            <aside className="demo-users">
              <h2>Usuarios de prueba</h2>
              <p>Sirven para revisar cliente y comercio mientras conectamos autenticacion real.</p>
              {users.filter((user) => user.role !== "admin").slice(0, 2).map((user) => (
                <article className="login-card" key={user.id}>
                  <span>{user.role}</span>
                  <strong>{user.name}</strong>
                  <p>{user.email}</p>
                  <button type="button" onClick={() => signInAs(user)}>
                    Entrar como {user.role}
                  </button>
                </article>
              ))}
              <div className="admin-gate">
                <h2>Acceso privado</h2>
                <input
                  value={adminCode}
                  onChange={(event) => setAdminCode(event.target.value)}
                  placeholder="Codigo administrador"
                  type="password"
                />
                <button type="button" onClick={unlockAdmin}>
                  Entrar a admin
                </button>
              </div>
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
                    [String(premierBalance), "Puntos Premier"],
                    [String(12 + orders.length), "Compras"],
                    ["3", "Direcciones"],
                    [kycSubmitted ? "En revision" : "Pendiente", "Verificacion"],
                  ].map(([value, label]) => (
                    <article key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </article>
                  ))}
                </div>
                {customerSection === "compras" && (
                  <>
                    <div className="customer-grid">
                      <article>
                        <h2>Resumen cliente</h2>
                        <span>Cuenta: {activeUser.email}</span>
                        <span>Rol: {activeUser.role}</span>
                        <span>Estado: {activeUser.status}</span>
                      </article>
                      <article>
                        <h2>Compras protegidas</h2>
                        <span>Pago validado por servidor</span>
                        <span>Pedido liberado solo con pago aprobado</span>
                      </article>
                      <article>
                        <h2>Soporte</h2>
                        <span>Reclamos y devoluciones</span>
                        <span>Seguimiento de despacho</span>
                      </article>
                    </div>
                    <OrderList orders={orders} />
                  </>
                )}
                {customerSection === "direcciones" && (
                  <div className="customer-grid">
                    <article><h2>Casa</h2><span>Av. Principal 123, Santiago</span><span>Despacho preferido</span></article>
                    <article><h2>Trabajo</h2><span>Direccion por completar</span><span>Pendiente</span></article>
                    <article><h2>Retiro</h2><span>Retiro en comercio disponible</span><span>Sin costo despacho</span></article>
                  </div>
                )}
                {customerSection === "premier" && (
                  <PremierPanel balance={premierBalance} onRedeem={redeemPremier} />
                )}
                {customerSection === "pagos" && (
                  <div className="customer-grid">
                    <article><h2>Webpay</h2><span>Preparado para integracion</span><span>Validacion por webhook</span></article>
                    <article><h2>Mercado Pago</h2><span>Solo si servidor confirma pago</span><span>No se aceptan capturas</span></article>
                    <article><h2>Transferencia</h2><span>Riesgo medio</span><span>Requiere revision manual</span></article>
                  </div>
                )}
                {customerSection === "verificacion" && (
                  <KycPanel
                    draft={kycDraft}
                    submitted={kycSubmitted}
                    onChange={setKycDraft}
                    onSubmit={submitKyc}
                  />
                )}
              </section>

              <aside className="account-panel">
                <h2>Cuenta cliente</h2>
                <button type="button" className={customerSection === "compras" ? "active" : ""} onClick={() => setCustomerSection("compras")}>
                  Mis compras
                </button>
                <button type="button" className={customerSection === "direcciones" ? "active" : ""} onClick={() => setCustomerSection("direcciones")}>Direcciones</button>
                <button type="button" className={customerSection === "premier" ? "active" : ""} onClick={() => setCustomerSection("premier")}>Premier</button>
                <button type="button" className={customerSection === "pagos" ? "active" : ""} onClick={() => setCustomerSection("pagos")}>Pagos</button>
                <button type="button" className={customerSection === "verificacion" ? "active" : ""} onClick={() => setCustomerSection("verificacion")}>Verificacion</button>
                <button type="button" onClick={() => setView("ingresar")}>
                  Cambiar usuario
                </button>
                {activeUser.role === "admin" && (
                  <button type="button" onClick={() => setView("admin")}>
                    Administrar Bazar
                  </button>
                )}
                <p>
                  El cliente compra, revisa pedidos, gestiona pagos y acumula Premier.
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
          <section className="dashboard merchant-dashboard">
            <div className="section-title">
              <p>Comercio</p>
              <h1>Panel comercio</h1>
              <span>
                Operacion diaria del negocio: catalogo, stock, pedidos, ventas y comision Bazar.
              </span>
            </div>
            <div className="merchant-layout">
              <aside className="merchant-menu">
                <h2>Mi tienda</h2>
                <button type="button" className={merchantSection === "resumen" ? "active" : ""} onClick={() => setMerchantSection("resumen")}>Resumen</button>
                <button type="button" className={merchantSection === "productos" ? "active" : ""} onClick={() => setMerchantSection("productos")}>Productos</button>
                <button type="button" className={merchantSection === "stock" ? "active" : ""} onClick={() => setMerchantSection("stock")}>Stock</button>
                <button type="button" className={merchantSection === "pedidos" ? "active" : ""} onClick={() => setMerchantSection("pedidos")}>Pedidos</button>
                <button type="button" className={merchantSection === "pagos" ? "active" : ""} onClick={() => setMerchantSection("pagos")}>Pagos</button>
                <button type="button" className={merchantSection === "verificacion" ? "active" : ""} onClick={() => setMerchantSection("verificacion")}>Verificacion</button>
              </aside>
              <section className="merchant-main">
                <div className="cards">
                  <article><strong>{money.format(merchantSales)}</strong><span>Ventas comercio</span></article>
                  <article><strong>{String(177 + orders.length)}</strong><span>Pedidos recibidos</span></article>
                  <article><strong>{products.length}</strong><span>Productos publicados</span></article>
                  <article><strong>{money.format(monthlyCommission)}</strong><span>Comision Bazar</span></article>
                </div>
                {merchantSection === "resumen" && (
                  <>
                    <div className="merchant-grid">
                      <div className="table-panel">
                        <h2>Catalogo activo</h2>
                        {products.map((product) => (
                          <article className="merchant-row" key={product.id}>
                            <div>
                              <strong>{product.name}</strong>
                              <span>{product.category} · {product.store}</span>
                            </div>
                            <mark>Activo</mark>
                            <strong>{money.format(product.price)}</strong>
                          </article>
                        ))}
                      </div>
                      <div className="merchant-side">
                        <h2>Operacion</h2>
                        <span>Preparar pedidos pagados</span>
                        <span>Actualizar stock antes de vender</span>
                        <span>Revisar pagos en conciliacion</span>
                        <span>Solicitar destaque o plan Pro</span>
                      </div>
                    </div>
                    <OrderList orders={orders} />
                  </>
                )}
                {merchantSection === "productos" && (
                  <MerchantProductPanel products={products} />
                )}
                {merchantSection === "stock" && (
                  <StockPanel products={products} />
                )}
                {merchantSection === "pedidos" && (
                  <OrderList orders={orders} />
                )}
                {merchantSection === "pagos" && (
                  <div className="merchant-grid">
                    <div className="table-panel">
                      <h2>Pagos comercio</h2>
                      {payments.length === 0 ? <p>No hay pagos conciliados.</p> : payments.map((payment) => (
                        <article className="payment-row" key={payment.id}>
                          <div><strong>{payment.id}</strong><span>{payment.provider}</span></div>
                          <mark>{payment.status}</mark>
                          <strong>{money.format(payment.amount)}</strong>
                        </article>
                      ))}
                    </div>
                    <div className="merchant-side">
                      <h2>Reglas de pago</h2>
                      <span>Saldo comercio despues de comision</span>
                      <span>Pagos sospechosos quedan retenidos</span>
                      <span>Transferencia requiere conciliacion</span>
                    </div>
                  </div>
                )}
                {merchantSection === "verificacion" && (
                  <KycPanel
                    draft={kycDraft}
                    submitted={kycSubmitted}
                    onChange={setKycDraft}
                    onSubmit={submitKyc}
                  />
                )}
              </section>
            </div>
          </section>
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
              className={adminSection === "clientes" ? "active" : ""}
              onClick={() => setAdminSection("clientes")}
            >
              Clientes
            </button>
            <button
              type="button"
              className={adminSection === "comercios" ? "active" : ""}
              onClick={() => setAdminSection("comercios")}
            >
              Comercios
            </button>
            <button
              type="button"
              className={adminSection === "ganancias" ? "active" : ""}
              onClick={() => setAdminSection("ganancias")}
            >
              Ganancias
            </button>
            <button
              type="button"
              className={adminSection === "pagos" ? "active" : ""}
              onClick={() => setAdminSection("pagos")}
            >
              Pagos e ingresos
            </button>
            <button
              type="button"
              className={adminSection === "datos" ? "active" : ""}
              onClick={() => setAdminSection("datos")}
            >
              Base de datos
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

          {adminSection === "clientes" && (
            <>
              <div className="cards">
                <article><strong>{clientUsers.length}</strong><span>Clientes registrados</span></article>
                <article><strong>{12 + orders.length}</strong><span>Compras totales</span></article>
                <article><strong>{1840 + premier}</strong><span>Premier emitido</span></article>
                <article><strong>{money.format(orderTotal)}</strong><span>Ticket simulado</span></article>
              </div>
              <div className="admin-control-layout">
                <UserTable users={clientUsers} title="Control de clientes" />
                <div className="admin-control-card">
                  <h2>Acciones cliente</h2>
                  <span>Revisar historial de compra</span>
                  <span>Bloquear cuenta sospechosa</span>
                  <span>Gestionar puntos Premier</span>
                  <span>Atender reclamos y devoluciones</span>
                </div>
              </div>
            </>
          )}

          {adminSection === "comercios" && (
            <>
              <div className="cards">
                <article><strong>{merchantUsers.length}</strong><span>Comercios registrados</span></article>
                <article><strong>{pendingKyc}</strong><span>KYC pendiente</span></article>
                <article><strong>{products.length}</strong><span>Productos publicados</span></article>
                <article><strong>{money.format(merchantSales)}</strong><span>Ventas comercio</span></article>
              </div>
              <div className="admin-control-layout">
                <UserTable users={merchantUsers} title="Control de comercios" />
                <div className="admin-control-card">
                  <h2>Acciones comercio</h2>
                  <span>Aprobar o rechazar KYC</span>
                  <span>Revisar catalogo y stock</span>
                  <span>Configurar comision</span>
                  <span>Activar tienda destacada</span>
                </div>
              </div>
            </>
          )}

          {adminSection === "ganancias" && (
            <>
              <div className="cards">
                <article><strong>{money.format(monthlyCommission)}</strong><span>Comisiones Bazar</span></article>
                <article><strong>$480.000</strong><span>Publicidad</span></article>
                <article><strong>{money.format(bazarRevenue)}</strong><span>Ingreso bruto estimado</span></article>
                <article><strong>{money.format(merchantSales)}</strong><span>Saldo comercios</span></article>
              </div>
              <div className="revenue-dashboard">
                <article>
                  <h2>Modelo de ingreso</h2>
                  <span>Comision por venta: 10%</span>
                  <span>Productos destacados: {money.format(businessRules.sponsoredProductsMonthlyFee)}</span>
                  <span>Plan comercio Pro: {money.format(businessRules.merchantProMonthlyFee)}</span>
                  <span>Fee de servicio: {money.format(serviceFee)} por pedido simulado</span>
                </article>
                <article>
                  <h2>Control financiero</h2>
                  <span>Conciliar pagos aprobados</span>
                  <span>Separar comision Bazar</span>
                  <span>Calcular saldo a comercio</span>
                  <span>Enviar a revision pagos sospechosos</span>
                </article>
              </div>
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
                <article><strong>{payments.length}</strong><span>Pagos simulados</span></article>
                <article><strong>{suspiciousPayments.length}</strong><span>Pagos en revision</span></article>
              </div>
              <div className="security-grid">
                <div className="security-card">
                  <h2>Reglas antifraude</h2>
                  {paymentSecurityRules.map((rule) => (
                    <span key={rule}>{rule}</span>
                  ))}
                </div>
                <div className="security-card warning">
                  <h2>Politica Bazar</h2>
                  <strong>No confiar en comprobantes del usuario</strong>
                  <p>
                    El comercio solo prepara o entrega pedidos cuando Bazar recibe confirmacion
                    del servidor de pago y valida monto, referencia y estado.
                  </p>
                </div>
              </div>
              <div className="payment-grid">
                {paymentProviders.map((provider) => (
                  <article className="payment-card" key={provider.name}>
                    <strong>{provider.name}</strong>
                    <span>{provider.priority} · {provider.status}</span>
                    <p>{provider.use}</p>
                    <small>{provider.settlement}</small>
                  </article>
                ))}
              </div>
              <div className="payments-layout">
                <div className="table-panel">
                  <h2>Transacciones</h2>
                  {payments.length === 0 ? (
                    <p>Aun no hay pagos. Simula una compra desde Comprar para ver el registro.</p>
                  ) : (
                    payments.map((payment) => (
                      <article className="payment-row" key={payment.id}>
                        <div>
                          <strong>{payment.id}</strong>
                          <span>{payment.orderId} · {payment.provider}</span>
                          <small>{payment.reference} · Riesgo {payment.riskLevel}</small>
                        </div>
                        <mark>{payment.status}</mark>
                        <strong>{money.format(payment.amount)}</strong>
                        <ul>
                          {payment.checks.map((check) => (
                            <li key={check}>{check}</li>
                          ))}
                        </ul>
                      </article>
                    ))
                  )}
                </div>
                <div className="payment-blueprint">
                  <h2>Ruta septiembre</h2>
                  <ol>
                    <li>Crear orden pendiente antes de enviar a la pasarela.</li>
                    <li>Crear sesion de pago con Mercado Pago o Webpay.</li>
                    <li>Redirigir al cliente al checkout seguro.</li>
                    <li>Recibir webhook y marcar pedido aprobado o rechazado.</li>
                    <li>Conciliar comision Bazar y saldo del comercio.</li>
                  </ol>
                </div>
              </div>
              <div className="revenue-plan">
                <h2>Fuentes de ingreso</h2>
                <p>Comision por venta, tiendas destacadas, productos patrocinados, planes Pro para comercios y fee de despacho.</p>
              </div>
            </>
          )}

          {adminSection === "datos" && (
            <>
              <div className="cards">
                <article><strong>Supabase</strong><span>Base recomendada</span></article>
                <article><strong>7</strong><span>Modulos de datos</span></article>
                <article><strong>SQL listo</strong><span>apps/bazar/db/schema.sql</span></article>
                <article><strong>3 env vars</strong><span>Variables requeridas</span></article>
              </div>
              <div className="database-layout">
                <div className="table-panel">
                  <h2>Modelo preparado</h2>
                  {databaseModules.map((module) => (
                    <article className="database-row" key={module.table}>
                      <div>
                        <strong>{module.name}</strong>
                        <span>{module.table}</span>
                      </div>
                      <p>{module.purpose}</p>
                    </article>
                  ))}
                </div>
                <div className="database-card">
                  <h2>Para conectar en Vercel</h2>
                  {databaseChecklist.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
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

function KycPanel({
  draft,
  submitted,
  onChange,
  onSubmit,
}: {
  draft: KycDraft;
  submitted: boolean;
  onChange: Dispatch<SetStateAction<KycDraft>>;
  onSubmit: () => void;
}) {
  return (
    <section className="verification-panel">
      <div>
        <p>Ingreso seguro</p>
        <h2>Verificacion de identidad</h2>
        <span>
          Para comprar o vender con confianza, Bazar debe validar RUT, numero de documento,
          foto del carnet y selfie. En produccion esto se conecta a Supabase Storage y revision
          interna del administrador.
        </span>
      </div>

      <div className="verification-form">
        <label>
          RUT
          <input
            value={draft.rut}
            onChange={(event) => onChange((current) => ({ ...current, rut: event.target.value }))}
            placeholder="12.345.678-9"
          />
        </label>
        <label>
          Numero de documento
          <input
            value={draft.documentNumber}
            onChange={(event) => onChange((current) => ({ ...current, documentNumber: event.target.value }))}
            placeholder="Numero impreso en carnet"
          />
        </label>
        <label>
          Numero de serie
          <input
            value={draft.documentSerial}
            onChange={(event) => onChange((current) => ({ ...current, documentSerial: event.target.value }))}
            placeholder="Serie o identificador"
          />
        </label>
        <label>
          Foto carnet
          <input
            onChange={(event) =>
              onChange((current) => ({ ...current, frontPhoto: event.target.files?.[0]?.name ?? "" }))
            }
            type="file"
            accept="image/*"
          />
        </label>
        <label>
          Selfie actual
          <input
            onChange={(event) =>
              onChange((current) => ({ ...current, selfiePhoto: event.target.files?.[0]?.name ?? "" }))
            }
            type="file"
            accept="image/*"
          />
        </label>
      </div>

      <div className="verification-status">
        <strong>{submitted ? "Verificacion enviada" : "Pendiente de envio"}</strong>
        <span>{draft.frontPhoto || "Carnet no cargado"}</span>
        <span>{draft.selfiePhoto || "Selfie no cargada"}</span>
        <p>
          Reglas: no liberar ventas grandes, retiros ni panel completo de comercio hasta aprobar
          identidad. El administrador revisa coincidencia de datos y documentos.
        </p>
        <button type="button" onClick={onSubmit}>
          Enviar verificacion
        </button>
      </div>
    </section>
  );
}

function PremierPanel({ balance, onRedeem }: { balance: number; onRedeem: (points: number) => void }) {
  const benefits = [
    ["500 pts", 500, "$2.000 descuento", "Cupon para compra sobre $15.000"],
    ["1.500 pts", 1500, "Despacho gratis", "Disponible en comercios aliados"],
    ["3.000 pts", 3000, "Beneficio aliado", "Promocion especial con marcas"],
  ] as const;

  return (
    <section className="premier-panel">
      <div className="premier-head">
        <div>
          <p>Premier</p>
          <h2>Beneficios para clientes frecuentes</h2>
          <span>Los puntos se ganan por compras aprobadas y se usan como beneficios, no como dinero.</span>
        </div>
        <strong>{balance} pts</strong>
      </div>
      <div className="premier-benefits">
        {benefits.map(([label, points, title, description]) => (
          <article className="benefit-card" key={label}>
            <mark>{label}</mark>
            <h3>{title}</h3>
            <p>{description}</p>
            <button type="button" onClick={() => onRedeem(points)} disabled={balance < points}>
              Canjear
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function MerchantProductPanel({ products }: { products: Product[] }) {
  return (
    <section className="merchant-product-panel">
      <div className="form-panel">
        <h2>Nuevo producto</h2>
        <input placeholder="Nombre del producto" />
        <input placeholder="Precio" />
        <input placeholder="Categoria" />
        <select defaultValue="activo">
          <option value="activo">Publicar activo</option>
          <option value="borrador">Guardar borrador</option>
        </select>
        <button type="button">Guardar producto</button>
        <p>En el MVP queda como interfaz. Luego se guarda en Supabase y queda visible en Comprar.</p>
      </div>
      <div className="table-panel">
        <h2>Productos publicados</h2>
        {products.map((product) => (
          <article className="merchant-row" key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <span>{product.store} · {product.category}</span>
            </div>
            <mark>Publicado</mark>
            <strong>{money.format(product.price)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function StockPanel({ products }: { products: Product[] }) {
  return (
    <section className="stock-panel">
      <div className="stock-head">
        <div>
          <p>Inventario</p>
          <h2>Control de stock</h2>
          <span>Evita vender productos sin disponibilidad y ayuda a preparar pedidos.</span>
        </div>
        <button type="button">Actualizar stock</button>
      </div>
      <div className="stock-grid">
        {products.map((product, index) => (
          <article className="stock-card" key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <span>{product.category}</span>
            </div>
            <input defaultValue={index % 2 === 0 ? 18 : 7} aria-label={`Stock de ${product.name}`} />
            <mark>{index % 2 === 0 ? "OK" : "Bajo"}</mark>
          </article>
        ))}
      </div>
    </section>
  );
}

function UserTable({ users, title = "Usuarios registrados" }: { users: UserAccount[]; title?: string }) {
  return (
    <div className="table-panel">
      <h2>{title}</h2>
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
            <mark>{order.paymentProvider} · {order.paymentStatus}</mark>
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
