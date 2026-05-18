'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/alfa/types';
import { useAlfaAuth } from '@/components/AlfaAuthProvider';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts, totalAvailablePieces } from '@/lib/alfa/catalog';
import { getSupabaseClient } from '@/lib/supabase/client';
import { dispatchObserveReveals } from '@/hooks/useReveal';

const CATALOG_PREVIEW_LIMIT = 3;

type Props = {
  onEdit: (product: Product) => void;
  onCreate: () => void;
  onHeroStock?: (text: string) => void;
};

export function CollectionSection({ onEdit, onCreate, onHeroStock }: Props) {
  const { isAdmin, ready } = useAlfaAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const showPreviewOnly = !isAdmin && !showAll && products.length > CATALOG_PREVIEW_LIMIT;
  const visibleProducts = showPreviewOnly
    ? products.slice(0, CATALOG_PREVIEW_LIMIT)
    : products;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await fetchProducts(isAdmin);
      setProducts(list);
      const total = totalAvailablePieces(list);
      if (onHeroStock && total > 0) {
        onHeroStock(`${total} pieza${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'}`);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, onHeroStock]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  useEffect(() => {
    if (!loading && gridRef.current) {
      dispatchObserveReveals(gridRef.current);
    }
  }, [loading, products, showAll]);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto de forma permanente?')) return;
    const client = getSupabaseClient();
    const { error: delErr } = await client.from('products').delete().eq('id', id);
    if (delErr) {
      alert(delErr.message);
      return;
    }
    await load();
  }

  return (
    <section className="section collection" id="tienda">
      <div className="section__head">
        <div className="section__row">
          <div>
            <div className="eyebrow reveal">01 — Selección</div>
            <h2 className="section__title reveal d1" style={{ marginTop: 18 }}>
              Piezas en <em>stock,</em>
              <br />
              esta semana.
            </h2>
          </div>
          <p className="section__lede reveal d2" style={{ fontSize: 9 }} />
        </div>
      </div>

      {isAdmin ? (
        <div className="collection__admin-actions">
          <button
            type="button"
            className="admin-bar__btn admin-bar__btn--accent"
            onClick={onCreate}
          >
            + Nuevo producto
          </button>
        </div>
      ) : null}

      <div
        className="collection__grid"
        id="collection-grid"
        ref={gridRef}
        aria-live="polite"
        aria-busy={loading}
      >
        {loading ? (
          <p className="section__lede" style={{ gridColumn: '1 / -1' }}>
            Cargando colección…
          </p>
        ) : error ? (
          <p className="section__lede" style={{ gridColumn: '1 / -1' }}>
            No pudimos cargar la tienda.
          </p>
        ) : products.length === 0 ? (
          <p className="section__lede" style={{ gridColumn: '1 / -1' }}>
            No hay productos en la tienda.
          </p>
        ) : (
          visibleProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              admin={isAdmin}
              onEdit={() => {
                const full = products.find((x) => x.id === p.id);
                if (full) onEdit(full);
              }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
      {showPreviewOnly ? (
        <div className="collection__foot reveal">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setShowAll(true)}
          >
            Ver toda la tienda <span className="arrow" />
          </button>
        </div>
      ) : null}
    </section>
  );
}