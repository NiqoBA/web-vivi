/**
 * Catálogo dinámico desde Supabase.
 */
(function () {
  const cfg = window.ALFA_SUPABASE;
  if (!cfg?.url || !cfg?.anonKey) {
    console.warn('[alfa-store] Falta ALFA_SUPABASE');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  window.alfaSupabase = client;

  const STOCK_CLASS = {
    in_stock: '',
    low: 'low',
    out_of_stock: 'sold',
    made_to_order: '',
  };

  const TONES = ['oat', 'cream', 'clay', 'rust', 'bone', 'taupe', 'sand', 'ink'];
  const DEFAULT_LAYOUT = 'product--c';
  const DEFAULT_REVEAL = 'd1';
  const CATALOG_PREVIEW_LIMIT = 3;
  let catalogShowAll = false;
  let catalogProductsCache = [];

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function formatPrice(p) {
    const amount = Number(p.price_amount);
    if (!Number.isFinite(amount)) return '';
    return `UYU ${amount.toLocaleString('es-UY')}`;
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function slideContent(p, which) {
    const url = which === 'main' ? p.image_main_url : p.image_alt_url;
    const tone = which === 'main' ? p.tone_main : p.tone_alt;
    const cap = which === 'main' ? p.cap_main : p.cap_alt;
    if (url) {
      return `<img src="${escapeAttr(url)}" alt="${escapeAttr(cap || p.name)}" loading="lazy" />`;
    }
    const capHtml = cap ? `<span class="ph__cap">${escapeHtml(cap)}</span>` : '';
    return `<div class="ph" data-tone="${escapeAttr(tone || 'oat')}">${capHtml}</div>`;
  }

  function renderProductGallery(p) {
    const slides = [{ key: 'main', html: slideContent(p, 'main') }];
    if (p.image_alt_url) {
      slides.push({ key: 'alt', html: slideContent(p, 'alt') });
    }
    const slideHtml = slides
      .map(
        (s, i) =>
          `<div class="product__slide${i === 0 ? ' is-active' : ''}" data-slide="${s.key}">${s.html}</div>`
      )
      .join('');
    const multi = slides.length > 1;

    return `
      <div class="product__gallery" data-gallery>
        <div class="product__gallery-track">${slideHtml}</div>
        <button type="button" class="product__gallery-nav product__gallery-nav--prev" data-gallery-prev aria-label="Imagen anterior" ${multi ? '' : 'hidden'}>‹</button>
        <button type="button" class="product__gallery-nav product__gallery-nav--next" data-gallery-next aria-label="Siguiente imagen" ${multi ? '' : 'hidden'}>›</button>
      </div>`;
  }

  function renderProduct(p, opts = {}) {
    const admin = !!opts.admin;
    const reveal = ['reveal', DEFAULT_REVEAL].join(' ');
    const stockClass = STOCK_CLASS[p.stock_status] || '';
    const layout = p.layout_class || DEFAULT_LAYOUT;
    const cat = p.categories?.name
      ? `<span class="product__category">${escapeHtml(p.categories.name)}</span>`
      : '';
    const inactive = admin && !p.is_active ? ' product--inactive' : '';

    const adminBar = admin
      ? `<div class="product__admin-bar">
          <button type="button" class="product__admin-btn" data-edit-product="${escapeAttr(p.id)}">Editar</button>
          <button type="button" class="product__admin-btn product__admin-btn--danger" data-delete-product="${escapeAttr(p.id)}">Eliminar</button>
          ${!p.is_active ? '<span class="product__admin-tag">Oculto</span>' : ''}
        </div>`
      : '';

    return `
    <article class="product ${escapeAttr(layout)} ${reveal}${inactive}" data-product-id="${escapeAttr(p.id)}" data-slug="${escapeAttr(p.slug)}">
      ${adminBar}
      <div class="product__media">
        ${renderProductGallery(p)}
      </div>
      <div class="product__info">
        <div>
          <h3 class="product__name">${escapeHtml(p.name)}${cat}<small>${escapeHtml(p.subtitle)}</small></h3>
        </div>
        <div style="text-align:right">
          <div class="product__price">${escapeHtml(formatPrice(p))}</div>
          <div class="product__stock ${stockClass}" style="margin-top:8px;justify-content:flex-end">${escapeHtml(p.stock_label)}</div>
        </div>
      </div>
    </article>`;
  }

  function initProductGalleries(root) {
    (root || document).querySelectorAll('[data-gallery]').forEach((gallery) => {
      if (gallery._bound) return;
      gallery._bound = true;
      const slides = [...gallery.querySelectorAll('.product__slide')];
      if (slides.length < 2) return;
      let idx = slides.findIndex((s) => s.classList.contains('is-active'));
      if (idx < 0) idx = 0;

      const show = (i) => {
        idx = (i + slides.length) % slides.length;
        slides.forEach((s, n) => s.classList.toggle('is-active', n === idx));
      };

      gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        show(idx - 1);
      });
      gallery.querySelector('[data-gallery-next]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        show(idx + 1);
      });
    });
  }

  function totalAvailablePieces(products) {
    return products.reduce((sum, p) => {
      if (!p.is_active) return sum;
      if (p.stock_status === 'out_of_stock' || p.stock_status === 'made_to_order') return sum;
      const q = Number(p.stock_quantity);
      return sum + (Number.isFinite(q) ? Math.max(0, q) : 0);
    }, 0);
  }

  async function fetchCategories() {
    const { data, error } = await client.from('categories').select('*').order('sort_order');
    if (error) throw error;
    return data || [];
  }

  async function fetchProducts(admin = false) {
    let q = client
      .from('products')
      .select('*, categories(id, slug, name)')
      .order('sort_order', { ascending: true });
    if (!admin) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  function updateCollectionFoot(showPreview) {
    const foot = document.querySelector('.collection__foot');
    if (!foot) return;
    foot.hidden = !showPreview;
    if (showPreview) foot.classList.add('in');
  }

  function bindCollectionFoot() {
    const foot = document.querySelector('.collection__foot');
    if (!foot || foot._catalogBound) return;
    foot._catalogBound = true;
    const btn = foot.querySelector('[data-show-all-catalog], a, button');
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      catalogShowAll = true;
      renderCatalogGrid(catalogProductsCache, !!window.alfaAuth?.isAdmin);
    });
  }

  function renderCatalogGrid(products, admin) {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;

    const showPreview =
      !admin && !catalogShowAll && products.length > CATALOG_PREVIEW_LIMIT;
    const visible = showPreview ? products.slice(0, CATALOG_PREVIEW_LIMIT) : products;

    grid.innerHTML = visible.length
      ? visible.map((p) => renderProduct(p, { admin })).join('')
      : '<p class="section__lede" style="grid-column:1/-1">No hay productos en la tienda.</p>';

    initProductGalleries(grid);
    updateCollectionFoot(showPreview);

    if (typeof window.__alfaObserveReveals === 'function') {
      window.__alfaObserveReveals(grid);
    }
  }

  async function loadCatalog(admin = false) {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;

    bindCollectionFoot();
    grid.setAttribute('aria-busy', 'true');
    try {
      const products = await fetchProducts(admin);
      catalogProductsCache = products;
      if (admin) catalogShowAll = true;

      renderCatalogGrid(products, admin);

      const total = totalAvailablePieces(products);
      const stockMeta = document.querySelector('[data-hero-stock]');
      if (stockMeta && total > 0) {
        stockMeta.textContent = `${total} pieza${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'}`;
      }
    } catch (err) {
      console.error('[alfa-store]', err);
      grid.innerHTML =
        '<p class="section__lede" style="grid-column:1/-1">No pudimos cargar la tienda.</p>';
      updateCollectionFoot(false);
    } finally {
      grid.removeAttribute('aria-busy');
    }
  }

  function stockLabelFromFields(status, qty) {
    const q = Number(qty);
    if (status === 'out_of_stock') return 'Agotado · lista de espera';
    if (status === 'made_to_order') return 'Por encargo';
    if (status === 'low') return 'Último';
    if (Number.isFinite(q) && q > 0) return `${q} disponible${q === 1 ? '' : 's'}`;
    return 'Sin stock';
  }

  window.alfaStore = {
    client,
    TONES,
    DEFAULT_LAYOUT,
    DEFAULT_REVEAL,
    slugify,
    formatPrice,
    stockLabelFromFields,
    fetchProducts,
    fetchCategories,
    loadCatalog,
    renderProduct,
    initProductGalleries,
    storageBucket: cfg.storageBucket,
    publicImageUrl(path) {
      return client.storage.from(cfg.storageBucket).getPublicUrl(path).data.publicUrl;
    },
    async uploadImage(slug, variant, file) {
      const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
      const path = `${slug}/${variant}-${Date.now()}.${ext}`;
      const { error } = await client.storage.from(cfg.storageBucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      return this.publicImageUrl(path);
    },
    async removeStorageFile(publicUrl) {
      if (!publicUrl) return;
      const marker = `/object/public/${cfg.storageBucket}/`;
      const i = publicUrl.indexOf(marker);
      if (i < 0) return;
      const path = decodeURIComponent(publicUrl.slice(i + marker.length));
      await client.storage.from(cfg.storageBucket).remove([path]);
    },
  };

  window.addEventListener('alfa:auth', (e) => {
    if (!e.detail?.isAdmin) catalogShowAll = false;
    loadCatalog(e.detail?.isAdmin);
  });

  if (window.alfaAuth) loadCatalog(window.alfaAuth.isAdmin);
})();
