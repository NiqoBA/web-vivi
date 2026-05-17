'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { Category, Product, StockStatus } from '@/lib/alfa/types';
import { useAlfaAuth } from '@/components/AlfaAuthProvider';
import {
  DEFAULT_LAYOUT,
  DEFAULT_REVEAL,
  TONES,
  fetchCategories,
  fetchProducts,
  removeStorageFile,
  slugify,
  stockLabelFromFields,
  uploadImage,
} from '@/lib/alfa/catalog';
import { getSupabaseClient } from '@/lib/supabase/client';

type Props = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

export function AdminProductModal({ open, product, onClose, onSaved }: Props) {
  const { isAdmin } = useAlfaAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [altFile, setAltFile] = useState<File | null>(null);
  const [mainUrl, setMainUrl] = useState('');
  const [altUrl, setAltUrl] = useState('');

  const editingId = product?.id ?? null;

  const loadCats = useCallback(
    async (selectedId?: string | null) => {
      const cats = await fetchCategories();
      setCategories(cats);
      if (selectedId) {
        const sel = document.querySelector<HTMLSelectElement>('[name="category_id"]');
        if (sel) sel.value = selectedId;
      }
    },
    [],
  );

  useEffect(() => {
    if (open && isAdmin) loadCats(product?.category_id ?? null);
  }, [open, isAdmin, product?.category_id, loadCats]);

  useEffect(() => {
    if (!open) return;
    setMainFile(null);
    setAltFile(null);
    setError('');
    setMainUrl(product?.image_main_url || '');
    setAltUrl(product?.image_alt_url || '');
  }, [open, product]);

  if (!open || !isAdmin) return null;

  async function handleAddCategory(form: HTMLFormElement) {
    const input = form.elements.namedItem('new_category') as HTMLInputElement | null;
    const name = String(input?.value || '').trim();
    if (!name) return;
    const client = getSupabaseClient();
    const { data, error: catErr } = await client
      .from('categories')
      .insert({ name, slug: slugify(name), sort_order: categories.length + 1 })
      .select('id')
      .single();
    if (catErr) throw catErr;
    if (input) input.value = '';
    await loadCats(data.id);
  }

  async function nextSortOrder(): Promise<number> {
    const products = await fetchProducts(true);
    return products.reduce((m, p) => Math.max(m, Number(p.sort_order) || 0), 0) + 1;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const stock_status = fd.get('stock_status') as StockStatus;
    const stock_quantity = fd.get('stock_quantity');
    const catId = String(fd.get('category_id') || '').trim();
    const slug = slugify(name);

    let payload = {
      slug,
      name,
      subtitle: String(fd.get('subtitle') || '').trim(),
      category_id: catId || null,
      price_amount: fd.get('price_amount') ? Number(fd.get('price_amount')) : null,
      price_prefix: null,
      currency: 'UYU',
      stock_quantity: stock_quantity !== '' ? Number(stock_quantity) : null,
      stock_status,
      stock_label: stockLabelFromFields(stock_status, stock_quantity as string),
      badge: null,
      layout_class: DEFAULT_LAYOUT,
      reveal_delay: DEFAULT_REVEAL,
      tone_main: String(fd.get('tone_main') || 'oat'),
      tone_alt: String(fd.get('tone_alt') || 'cream'),
      cap_main: null,
      cap_alt: null,
      image_main_url: mainUrl.trim() || null,
      image_alt_url: altUrl.trim() || null,
      is_active: !!(form.elements.namedItem('is_active') as HTMLInputElement)?.checked,
    } as Record<string, unknown>;

    if (!editingId) {
      payload.sort_order = await nextSortOrder();
    }

    setLoading(true);
    setError('');
    try {
      if (mainFile) {
        if (payload.image_main_url) await removeStorageFile(String(payload.image_main_url));
        payload.image_main_url = await uploadImage(slug, 'main', mainFile);
      }
      if (altFile) {
        if (payload.image_alt_url) await removeStorageFile(String(payload.image_alt_url));
        payload.image_alt_url = await uploadImage(slug, 'alt', altFile);
      }

      const client = getSupabaseClient();
      if (editingId) {
        const { error: upErr } = await client.from('products').update(payload).eq('id', editingId);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await client.from('products').insert(payload);
        if (insErr) throw insErr;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    } finally {
      setLoading(false);
    }
  }

  async function clearImage(which: 'main' | 'alt') {
    const url = which === 'main' ? mainUrl : altUrl;
    if (url) await removeStorageFile(url).catch(() => {});
    if (which === 'main') {
      setMainUrl('');
      setMainFile(null);
    } else {
      setAltUrl('');
      setAltFile(null);
    }
  }

  const defaultValues = {
    name: product?.name || '',
    subtitle: product?.subtitle || '',
    category_id: product?.category_id || '',
    price_amount: product?.price_amount ?? '',
    stock_quantity: product?.stock_quantity ?? '',
    stock_status: product?.stock_status || 'in_stock',
    tone_main: product?.tone_main || 'oat',
    tone_alt: product?.tone_alt || 'cream',
    is_active: product?.is_active !== false,
  };

  return (
    <div
      className="admin-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal__dialog" role="dialog" aria-labelledby="admin-product-title">
        <div className="admin-modal__head">
          <h2 className="admin-modal__title" id="admin-product-title">
            {editingId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <form className="admin-form" onSubmit={handleSubmit} key={product?.id || 'new'}>
          <label>
            <span>Nombre</span>
            <input type="text" name="name" required defaultValue={defaultValues.name} />
          </label>
          <label>
            <span>Descripción corta</span>
            <input type="text" name="subtitle" defaultValue={defaultValues.subtitle} />
          </label>
          <div className="admin-form__category">
            <label>
              <span>Categoría</span>
              <select name="category_id" defaultValue={defaultValues.category_id}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-form__new-cat">
              <input type="text" name="new_category" placeholder="Nueva categoría…" />
              <button
                type="button"
                className="admin-form__secondary"
                onClick={async (ev) => {
                  try {
                    await handleAddCategory(ev.currentTarget.closest('form') as HTMLFormElement);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'No se pudo crear la categoría.');
                  }
                }}
              >
                Agregar
              </button>
            </div>
          </div>
          <div className="admin-form__row">
            <label>
              <span>Precio (UYU)</span>
              <input
                type="number"
                name="price_amount"
                min={0}
                step={1}
                defaultValue={defaultValues.price_amount}
              />
            </label>
            <label>
              <span>Estado stock</span>
              <select name="stock_status" defaultValue={defaultValues.stock_status}>
                <option value="in_stock">En stock</option>
                <option value="low">Últimas unidades</option>
                <option value="out_of_stock">Agotado</option>
                <option value="made_to_order">Por encargo</option>
              </select>
            </label>
          </div>
          <label>
            <span>Cantidad</span>
            <input
              type="number"
              name="stock_quantity"
              min={0}
              defaultValue={defaultValues.stock_quantity}
            />
          </label>
          <div className="admin-form__row">
            <label>
              <span>Tono sin foto 1</span>
              <select name="tone_main" defaultValue={defaultValues.tone_main}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tono sin foto 2</span>
              <select name="tone_alt" defaultValue={defaultValues.tone_alt}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-form__images">
            <div>
              <label>
                <span>Imagen 1</span>
                <input
                  type="file"
                  name="image_main"
                  accept="image/*"
                  onChange={(ev) => setMainFile(ev.target.files?.[0] || null)}
                />
              </label>
              <AdminPreview url={mainUrl} empty="Sin imagen 1" />
              <button type="button" className="admin-form__secondary" onClick={() => clearImage('main')}>
                Quitar
              </button>
            </div>
            <div>
              <label>
                <span>Imagen 2</span>
                <input
                  type="file"
                  name="image_alt"
                  accept="image/*"
                  onChange={(ev) => setAltFile(ev.target.files?.[0] || null)}
                />
              </label>
              <AdminPreview url={altUrl} empty="Sin imagen 2" />
              <button type="button" className="admin-form__secondary" onClick={() => clearImage('alt')}>
                Quitar
              </button>
            </div>
          </div>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={defaultValues.is_active}
            />
            <span>Visible en la tienda</span>
          </label>
          <p className="admin-form__error">{error}</p>
          <div className="admin-form__actions">
            <button type="submit" className="admin-form__submit" disabled={loading}>
              Guardar producto
            </button>
            <button type="button" className="admin-form__secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminPreview({ url, empty }: { url: string; empty: string }) {
  return (
    <div className="admin-preview">
      {url ? <img src={url} alt="" /> : <span className="admin-preview__empty">{empty}</span>}
    </div>
  );
}
