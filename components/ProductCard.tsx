'use client';

import { useState } from 'react';
import type { Product } from '@/lib/alfa/types';
import { DEFAULT_LAYOUT, DEFAULT_REVEAL, formatPrice, stockClassFor } from '@/lib/alfa/catalog';

type Slide = {
  key: string;
  url: string | null;
  tone: string | null;
  cap: string | null;
};

type Props = {
  product: Product;
  admin?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function Placeholder({ tone, cap }: { tone: string; cap: string | null }) {
  return (
    <div className="ph" data-tone={tone}>
      {cap ? <span className="ph__cap">{cap}</span> : null}
    </div>
  );
}

function SlideView({
  slide,
  active,
  product,
}: {
  slide: Slide;
  active: boolean;
  product: Product;
}) {
  return (
    <div className={`product__slide${active ? ' is-active' : ''}`} data-slide={slide.key}>
      {slide.url ? (
        <img src={slide.url} alt={slide.cap || product.name} loading="lazy" />
      ) : (
        <Placeholder tone={slide.tone || 'oat'} cap={slide.cap} />
      )}
    </div>
  );
}

function ProductGallery({ product }: { product: Product }) {
  const slides: Slide[] = [
    { key: 'main', url: product.image_main_url, tone: product.tone_main, cap: product.cap_main },
  ];
  if (product.image_alt_url) {
    slides.push({
      key: 'alt',
      url: product.image_alt_url,
      tone: product.tone_alt,
      cap: product.cap_alt,
    });
  }

  const [idx, setIdx] = useState(0);
  const multi = slides.length > 1;
  const show = (i: number) => setIdx((i + slides.length) % slides.length);

  return (
    <div className="product__gallery" data-gallery>
      <div className="product__gallery-track">
        {slides.map((s, i) => (
          <SlideView key={s.key} slide={s} active={i === idx} product={product} />
        ))}
      </div>
      {multi ? (
        <>
          <button
            type="button"
            className="product__gallery-nav product__gallery-nav--prev"
            aria-label="Imagen anterior"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              show(idx - 1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="product__gallery-nav product__gallery-nav--next"
            aria-label="Siguiente imagen"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              show(idx + 1);
            }}
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}

export function ProductCard({ product, admin, onEdit, onDelete }: Props) {
  const reveal = ['reveal', DEFAULT_REVEAL].join(' ');
  const stockClass = stockClassFor(product.stock_status);
  const layout = product.layout_class || DEFAULT_LAYOUT;
  const inactive = admin && !product.is_active ? ' product--inactive' : '';

  return (
    <article
      className={`product ${layout} ${reveal}${inactive}`}
      data-product-id={product.id}
      data-slug={product.slug}
    >
      {admin ? (
        <div className="product__admin-bar">
          <button type="button" className="product__admin-btn" onClick={() => onEdit?.(product.id)}>
            Editar
          </button>
          <button
            type="button"
            className="product__admin-btn product__admin-btn--danger"
            onClick={() => onDelete?.(product.id)}
          >
            Eliminar
          </button>
          {!product.is_active ? <span className="product__admin-tag">Oculto</span> : null}
        </div>
      ) : null}
      <div className="product__media">
        <ProductGallery product={product} />
      </div>
      <div className="product__info">
        <div>
          <h3 className="product__name">
            {product.name}
            {product.categories?.name ? (
              <span className="product__category">{product.categories.name}</span>
            ) : null}
            <small>{product.subtitle}</small>
          </h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="product__price">{formatPrice(product)}</div>
          <div
            className={`product__stock ${stockClass}`}
            style={{ marginTop: 8, justifyContent: 'flex-end' }}
          >
            {product.stock_label}
          </div>
        </div>
      </div>
    </article>
  );
}
