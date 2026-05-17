import { alfaConfig } from '@/lib/alfa/config';
import type { Category, Product, ProductPayload, StockStatus } from '@/lib/alfa/types';
import { getSupabaseClient } from '@/lib/supabase/client';

export const TONES = ['oat', 'cream', 'clay', 'rust', 'bone', 'taupe', 'sand', 'ink'] as const;
export const DEFAULT_LAYOUT = 'product--c';
export const DEFAULT_REVEAL = 'd1';

const STOCK_CLASS: Record<StockStatus, string> = {
  in_stock: '',
  low: 'low',
  out_of_stock: 'sold',
  made_to_order: '',
};

export function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatPrice(p: Pick<Product, 'price_amount'>): string {
  const amount = Number(p.price_amount);
  if (!Number.isFinite(amount)) return '';
  return `UYU ${amount.toLocaleString('es-UY')}`;
}

export function stockLabelFromFields(status: StockStatus, qty: string | number | null): string {
  const q = Number(qty);
  if (status === 'out_of_stock') return 'Agotado · lista de espera';
  if (status === 'made_to_order') return 'Por encargo';
  if (status === 'low') return 'Último';
  if (Number.isFinite(q) && q > 0) return `${q} disponible${q === 1 ? '' : 's'}`;
  return 'Sin stock';
}

export function totalAvailablePieces(products: Product[]): number {
  return products.reduce((sum, p) => {
    if (!p.is_active) return sum;
    if (p.stock_status === 'out_of_stock' || p.stock_status === 'made_to_order') return sum;
    const q = Number(p.stock_quantity);
    return sum + (Number.isFinite(q) ? Math.max(0, q) : 0);
  }, 0);
}

export async function fetchCategories(): Promise<Category[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('categories').select('*').order('sort_order');
  if (error) throw error;
  return (data as Category[]) || [];
}

export async function fetchProducts(admin = false): Promise<Product[]> {
  const client = getSupabaseClient();
  let q = client
    .from('products')
    .select('*, categories(id, slug, name)')
    .order('sort_order', { ascending: true });
  if (!admin) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Product[]) || [];
}

export function publicImageUrl(path: string): string {
  const client = getSupabaseClient();
  return client.storage.from(alfaConfig.storageBucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadImage(slug: string, variant: string, file: File): Promise<string> {
  const client = getSupabaseClient();
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
  const path = `${slug}/${variant}-${Date.now()}.${ext}`;
  const { error } = await client.storage.from(alfaConfig.storageBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return publicImageUrl(path);
}

export async function removeStorageFile(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;
  const client = getSupabaseClient();
  const marker = `/object/public/${alfaConfig.storageBucket}/`;
  const i = publicUrl.indexOf(marker);
  if (i < 0) return;
  const path = decodeURIComponent(publicUrl.slice(i + marker.length));
  await client.storage.from(alfaConfig.storageBucket).remove([path]);
}

export function stockClassFor(status: StockStatus): string {
  return STOCK_CLASS[status] || '';
}
