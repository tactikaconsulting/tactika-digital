const services = [
  "Prospeccion B2B",
  "Automatizacion comercial",
  "Estrategia digital",
  "Implementacion de CRM",
];

export default function LandingPage() {
  return (
    <main>
      <header className="site-header">
        <strong>Tactika Consulting</strong>
        <nav>
          <a href="#servicios">Servicios</a>
          <a href="#bazar">Bazar</a>
          <a href="#contacto">Contacto</a>
        </nav>
      </header>

      <section className="hero">
        <p>Consultoria y tecnologia para crecer</p>
        <h1>Convertimos estrategia comercial en sistemas que venden.</h1>
        <span>
          Landing corporativa separada de la aplicacion Bazar, lista para usar
          en Vercel con tu dominio principal.
        </span>
        <div>
          <a href="#contacto">Agendar diagnostico</a>
          <a href="#bazar">Ver producto Bazar</a>
        </div>
      </section>

      <section className="section" id="servicios">
        <div className="section-title">
          <p>Servicios</p>
          <h2>Una base clara para vender mejor</h2>
        </div>
        <div className="grid">
          {services.map((service) => (
            <article key={service}>
              <h3>{service}</h3>
              <p>
                Diagnostico, implementacion y seguimiento con foco en resultados
                comerciales medibles.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section product" id="bazar">
        <div>
          <p>Bazar Marketplace</p>
          <h2>La app vive aparte, bajo su propio subdominio.</h2>
        </div>
        <a href="https://bazar.tactikaconsulting.com">Abrir Bazar</a>
      </section>

      <section className="section contact" id="contacto">
        <h2>Hablemos de crecimiento.</h2>
        <p>contacto@tactikaconsulting.com</p>
      </section>
    </main>
  );
}
