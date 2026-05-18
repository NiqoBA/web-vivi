'use client';

import { useState } from 'react';
import type { Product } from '@/lib/alfa/types';
import { useAlfaAuth } from '@/components/AlfaAuthProvider';
import { AdminLoginModal } from '@/components/AdminLoginModal';
import { AdminProductModal } from '@/components/AdminProductModal';
import { CollectionSection } from '@/components/CollectionSection';
import { useNavScroll } from '@/hooks/useNavScroll';
import { useReveal } from '@/hooks/useReveal';

export function AlfaHome() {
  const { isAdmin, signOut } = useAlfaAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [heroStock, setHeroStock] = useState('14 piezas disponibles');
  const [catalogVersion, setCatalogVersion] = useState(0);
  useNavScroll();
  useReveal();

  function openCreate() {
    setEditingProduct(null);
    setProductOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setProductOpen(true);
  }

  function onSaved() {
    setCatalogVersion((v) => v + 1);
  }

  return (
    <>
      {isAdmin ? (
        <div className="admin-bar" id="admin-bar">
          <span>Modo administrador</span>
          <AdminBarActions onCreate={openCreate} onLogout={() => signOut()} />
        </div>
      ) : null}

      <header className="nav over" id="nav">
        <nav className="nav__links">
          <a href="#tienda">Tienda</a>
          <a href="#historia">Historia</a>
          <a href="#proceso">Proceso</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="nav__logo" href="#" aria-label="Alfa">
          <img src="/assets/logo.png" alt="Alfa" />
        </a>
        <div className="nav__right">
          <a href="#" aria-label="Buscar">
            Buscar
          </a>
          {!isAdmin ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setLoginOpen(true);
              }}
            >
              Admin
            </a>
          ) : (
            <span style={{ fontSize: 11, opacity: 0.7 }}>Admin</span>
          )}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero__media parallax" data-parallax="0.15">
          <HeroPh />
        </div>
        <div className="hero__content">
          <div className="hero__top">
            <div className="hero__eyebrow reveal in">Colección Otoño · Edición 03</div>
            <h1
              className="display hero__title reveal in d1"
              style={{ fontFamily: '"Times New Roman"' }}
            >
              Tejido
              <br />
              a mano.
            </h1>
            <p className="hero__sub reveal in d2">
              Piezas únicas de crochet, hechas en lotes pequeños con hilados naturales. Cada prenda
              tarda entre 14 y 40 horas en cobrar forma sobre la falda de quien la teje.
            </p>
          </div>
          <div className="hero__bottom">
            <div className="hero__meta reveal in d3">
              <span>
                ORIGEN
                <br />
                MONTEVIDEO, UY
              </span>
              <span>
                <b>Materiales</b>
                Algodón pima · lino · merino
              </span>
              <span>
                <b>Stock</b>
                <span data-hero-stock>{heroStock}</span>
              </span>
            </div>
            <div className="hero__cta reveal in d4">
              <a href="#tienda" className="btn btn--solid">
                Ver colección <span className="arrow" />
              </a>
              <a href="#wapp" className="btn btn--ghost">
                A medida
              </a>
            </div>
          </div>
        </div>
        <div className="hero__scroll" />
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          <span>Hecho a mano en Montevideo</span>
          <span>Lotes pequeños</span>
          <span>Hilados naturales</span>
          <span>Encargos personalizados</span>
          <span>Hecho a mano en Montevideo</span>
          <span>Lotes pequeños</span>
          <span>Hilados naturales</span>
          <span>Encargos personalizados</span>
        </div>
      </div>

      <CollectionSection
        key={catalogVersion}
        onEdit={openEdit}
        onCreate={openCreate}
        onHeroStock={setHeroStock}
      />

      <section className="section story" id="historia">
        <div className="story__grid">
          <div className="story__media reveal">
            <img
              src="/assets/fatima.jpeg"
              alt="Fátima tejiendo en su taller"
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 28%',
                display: 'block',
                filter: 'saturate(.82) contrast(1.02)',
              }}
            />
          </div>
          <div className="story__body reveal d1">
            <div className="eyebrow">02 — Nuestra historia</div>
            <h3 className="story__h">
              ¡Hola, <em>soy Fátima!</em>
            </h3>
            <p className="story__p">
              Soy quien está detrás de cada ovillo y cada puntada. Aprendí a tejer entre mates y
              risas en casa, y hoy comparto ese oficio con quienes buscan algo hecho a mano, con
              paciencia y buenos hilos. Me encanta escuchar tu idea, elegir colores juntas y ver
              cómo un proyecto cobra vida en mis manos.
            </p>
            <p className="story__p">
              En mi taller trabajo con materiales suaves, diseños propios y encargos
              personalizados: amigurumis, mantas y detalles para regalar o quedarte. Si te gusta
              el crochet tanto como a mí, acá tenés un rincón donde cada pieza cuenta una historia.
            </p>
            <div className="story__sig">
              <svg viewBox="0 0 180 60" fill="none" aria-hidden="true">
                <path
                  d="M6 40 C 22 8, 44 8, 52 36 C 56 50, 68 50, 76 32 C 84 14, 102 14, 110 38 C 116 54, 134 50, 146 28 C 156 10, 172 14, 178 30"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <small>Fátima · Montevideo</small>
            </div>
          </div>
        </div>
      </section>

      <section className="process" id="proceso">
        <div className="section">
          <div className="section__head">
            <div className="section__row">
              <div>
                <div className="eyebrow reveal">03 — Oficio</div>
                <h2 className="section__title reveal d1" style={{ marginTop: 18 }}>
                  Del ovillo al <em>cuerpo,</em>
                  <br />
                  sin atajos.
                </h2>
              </div>
              <p className="section__lede reveal d2">
                Cada pieza la tejo yo, en mi taller en Montevideo. Sin máquinas, sin terciarizar,
                sin etiquetas que no pueda rastrear hasta el hilado.
              </p>
            </div>
          </div>

          <div className="process__grid">
            <article className="step reveal">
              <div className="step__media">
                <img
                  src="/uploads/884f6976-cbd0-4d0e-bfba-8f7360211c4d.jpg"
                  alt="Ovillos e hilos naturales en tonos tierra"
                  loading="lazy"
                />
              </div>
              <StepContent
                num="01"
                title="Materia prima"
                text="Algodón pima del NOA, lino europeo y merino patagónico. Todo en tonos naturales o teñido con plantas."
              />
            </article>
            <article className="step reveal d1">
              <div className="step__media">
                <img src="/uploads/unnamed.jpg" alt="Manos tejiendo con aguja de madera" loading="lazy" />
              </div>
              <StepContent
                num="02"
                title="Tejido"
                text="Punto a punto, contado a mano. Entre 14 y 40 horas por prenda, según el patrón y la trama elegida."
              />
            </article>
            <article className="step reveal d2">
              <div className="step__media">
                <img
                  src="/uploads/proceso-terminacion.png"
                  alt="Pieza terminada de crochet hecha a mano"
                  loading="lazy"
                />
              </div>
              <StepContent
                num="03"
                title="Terminación"
                text="Bloqueamos cada pieza con vapor, cosemos la etiqueta y la envolvemos en papel kraft con tu nombre."
              />
            </article>
          </div>

          <div className="process__strip">
            <div className="fact reveal">
              <div className="fact__n">
                14<em>h</em>
              </div>
              <div className="fact__l">Mínimo por prenda</div>
            </div>
            <div className="fact reveal d1">
              <div className="fact__n">1</div>
              <div className="fact__l">Par de manos</div>
            </div>
            <div className="fact reveal d2">
              <div className="fact__n">0</div>
              <div className="fact__l">Máquinas</div>
            </div>
            <div className="fact reveal d3">
              <div className="fact__n">
                100<em>%</em>
              </div>
              <div className="fact__l">Hilados naturales</div>
            </div>
          </div>
        </div>
      </section>

      <section className="quote">
        <p className="reveal">
          Tu pasión por el crochet: <em>kits, patrones</em> y herramientas hechas con amor.
        </p>
        <div className="eyebrow reveal d1">Fátima · Fundadora</div>
      </section>


      <section className="wapp" id="contacto">
        <div className="wapp__inner" id="wapp">
          <div className="reveal">
            <h3 className="wapp__h">
              Encargos <em>a medida</em>
              <br />y consultas por WhatsApp.
            </h3>
            <p className="wapp__p">
              Te respondemos personalmente de lunes a viernes, de 10 a 18 h. Contanos qué buscás,
              te enviamos fotos del stock y armamos tu pedido.
            </p>
          </div>
          <div className="wapp__cta reveal d1">
            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--paper"
            >
              Escribir por WhatsApp <span className="arrow" />
            </a>
            <a href="mailto:hola@alfa.uy" className="btn btn--ghost">
              Email
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="foot">
          <div>
            <a className="foot__logo" href="#" aria-label="Alfa">
              <img src="/assets/logo.png" alt="Alfa" />
            </a>
            <p className="foot__tag">
              Crochet hecho a mano en Montevideo por Fátima. Lotes pequeños, hilados naturales,
              tiempo bien gastado.
            </p>
          </div>
          <div>
            <h5>Tienda</h5>
            <ul>
              <li>
                <a href="#">Toda la colección</a>
              </li>
              <li>
                <a href="#">Prendas</a>
              </li>
              <li>
                <a href="#">Accesorios</a>
              </li>
              <li>
                <a href="#">A medida</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>Atelier</h5>
            <ul>
              <li>
                <a href="#">Historia</a>
              </li>
              <li>
                <a href="#">Proceso</a>
              </li>
              <li>
                <a href="#">Cuidados</a>
              </li>
              <li>
                <a href="#">Envíos & cambios</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>Contacto</h5>
            <ul>
              <li>
                <a href="https://wa.me/5491100000000" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:hola@alfa.uy">hola@alfa.uy</a>
              </li>
              <li>
                <a href="#">Instagram</a>
              </li>
              <li>
                <a href="#">Pinterest</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot__bar">
          <span>© 2025 Alfa · Hecho con paciencia</span>
          <span>Montevideo, UY</span>
        </div>
      </footer>

      <a
        className="wfab"
        href="https://wa.me/5491100000000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.11 4.93A9.86 9.86 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.45 3.43 1.32 4.93L2 22l5.3-1.39a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.92-9.91 0-2.65-1.03-5.14-2.86-7Zm-7.07 15.24h-.01c-1.5 0-2.97-.4-4.26-1.17l-.3-.18-3.15.83.84-3.07-.2-.31a8.23 8.23 0 0 1-1.27-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.25-8.25 8.25Zm4.52-6.17c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.16 1.74 2.66 4.21 3.73.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
        </svg>
        <span className="lbl">WhatsApp</span>
      </a>

      <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <AdminProductModal
        open={productOpen}
        product={editingProduct}
        onClose={() => setProductOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
}

function AdminBarActions({ onCreate, onLogout }: { onCreate: () => void; onLogout: () => void }) {
  return (
    <div className="admin-bar__actions">
      <button type="button" className="admin-bar__btn admin-bar__btn--accent" onClick={onCreate}>
        + Producto
      </button>
      <button type="button" className="admin-bar__btn" onClick={onLogout}>
        Salir
      </button>
    </div>
  );
}

function HeroPh() {
  return (
    <div className="ph" data-tone="sand">
      <span className="ph__corner">ALFA / SS25</span>
      <span className="ph__cap">
        Editorial · model wearing oat cardigan, natural light, linen drape
      </span>
    </div>
  );
}

function StepContent({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <>
      <div className="step__num">Paso {num}</div>
      <h4 className="step__h">{title}</h4>
      <p className="step__p">{text}</p>
    </>
  );
}
