"use client";

import { useState } from "react";

type View = "comprar" | "cuenta" | "vender" | "admin";

const products = [
  {
    name: "Canasta semanal hogar",
    store: "Almacen Central",
    price: "$18.990",
    tag: "Envio gratis",
  },
  {
    name: "Pack brunch local",
    store: "Cafe Barrio Norte",
    price: "$12.990",
    tag: "25 min",
  },
  {
    name: "Cable USB-C reforzado",
    store: "Tecno Express",
    price: "$6.990",
    tag: "30% off",
  },
];

export default function BazarApp() {
  const [view, setView] = useState<View>("comprar");

  return (
    <main>
      <header className="market-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => setView("comprar")}>
            Bazar
          </button>
          <input placeholder="Buscar productos, marcas y comercios" />
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
              <p>Semana local</p>
              <h1>Compra en comercios cercanos y suma Premier.</h1>
            </div>
            {products.map((product) => (
              <article className="product" key={product.name}>
                <div className="image" />
                <div>
                  <p>{product.store}</p>
                  <h2>{product.name}</h2>
                  <span>{product.tag}</span>
                </div>
                <strong>{product.price}</strong>
              </article>
            ))}
          </section>
          <aside className="panel">
            <h2>Tu compra</h2>
            <p>Agrega productos para simular el carrito.</p>
            <button type="button">Continuar compra</button>
          </aside>
        </section>
      )}

      {view === "cuenta" && (
        <Dashboard title="Mi cuenta" subtitle="Perfil, direcciones, pedidos y puntos Premier." />
      )}

      {view === "vender" && (
        <Dashboard title="Centro de vendedores" subtitle="Productos, stock, ventas y pedidos del comercio." />
      )}

      {view === "admin" && (
        <Dashboard title="Admin Bazar" subtitle="Usuarios, comercios, pedidos, comisiones y reglas Premier." />
      )}
    </main>
  );
}

function Dashboard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="dashboard">
      <div className="section-title">
        <p>Bazar</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>
      <div className="cards">
        <article><strong>3.184</strong><span>Usuarios</span></article>
        <article><strong>126</strong><span>Comercios</span></article>
        <article><strong>177</strong><span>Pedidos</span></article>
        <article><strong>$842.000</strong><span>Comision</span></article>
      </div>
    </section>
  );
}
