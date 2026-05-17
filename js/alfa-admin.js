/**
 * Panel de administración (productos + imágenes + categorías).
 */
(function () {
  const store = () => window.alfaStore;
  const client = () => window.alfaSupabase;

  let categories = [];
  let editingId = null;
  let mainFile = null;
  let altFile = null;

  const panel = document.getElementById('admin-product-modal');
  const form = document.getElementById('admin-product-form');
  const errEl = document.getElementById('admin-product-error');

  function requireAdmin() {
    if (!window.alfaAuth?.isAdmin) throw new Error('Sesión de administrador requerida.');
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadCategories(selectedId) {
    categories = await store().fetchCategories();
    const sel = form?.querySelector('[name="category_id"]');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Sin categoría</option>' +
      categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    if (selectedId) sel.value = selectedId;
  }

  function openModal(title) {
    if (!panel) return;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    panel.querySelector('.admin-modal__title').textContent = title;
    if (errEl) errEl.textContent = '';
  }

  function closeModal() {
    if (!panel) return;
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    editingId = null;
    mainFile = null;
    altFile = null;
    form?.reset();
    const newCat = form?.elements.namedItem('new_category');
    if (newCat) newCat.value = '';
    updatePreviews();
  }

  function updatePreviews() {
    const mainPrev = document.getElementById('admin-preview-main');
    const altPrev = document.getElementById('admin-preview-alt');
    const mainUrl = form?.querySelector('[name="image_main_url"]')?.value;
    const altUrl = form?.querySelector('[name="image_alt_url"]')?.value;

    if (mainPrev) {
      mainPrev.innerHTML = mainUrl
        ? `<img src="${escapeHtml(mainUrl)}" alt="" />`
        : '<span class="admin-preview__empty">Sin imagen 1</span>';
    }
    if (altPrev) {
      altPrev.innerHTML = altUrl
        ? `<img src="${escapeHtml(altUrl)}" alt="" />`
        : '<span class="admin-preview__empty">Sin imagen 2</span>';
    }
  }

  function fillForm(p) {
    if (!form) return;
    const fields = {
      name: p?.name || '',
      subtitle: p?.subtitle || '',
      category_id: p?.category_id || '',
      price_amount: p?.price_amount ?? '',
      stock_quantity: p?.stock_quantity ?? '',
      stock_status: p?.stock_status || 'in_stock',
      tone_main: p?.tone_main || 'oat',
      tone_alt: p?.tone_alt || 'cream',
      image_main_url: p?.image_main_url || '',
      image_alt_url: p?.image_alt_url || '',
      is_active: p?.is_active !== false,
    };
    Object.entries(fields).forEach(([k, v]) => {
      const el = form.elements.namedItem(k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v;
    });
    updatePreviews();
  }

  async function nextSortOrder() {
    const products = await store().fetchProducts(true);
    return products.reduce((m, p) => Math.max(m, Number(p.sort_order) || 0), 0) + 1;
  }

  async function readForm() {
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const stock_status = fd.get('stock_status');
    const stock_quantity = fd.get('stock_quantity');
    const catId = String(fd.get('category_id') || '').trim();

    const payload = {
      slug: store().slugify(name),
      name,
      subtitle: String(fd.get('subtitle') || '').trim(),
      category_id: catId || null,
      price_amount: fd.get('price_amount') ? Number(fd.get('price_amount')) : null,
      price_prefix: null,
      currency: 'UYU',
      stock_quantity: stock_quantity !== '' ? Number(stock_quantity) : null,
      stock_status,
      stock_label: store().stockLabelFromFields(stock_status, stock_quantity),
      badge: null,
      layout_class: store().DEFAULT_LAYOUT,
      reveal_delay: store().DEFAULT_REVEAL,
      tone_main: fd.get('tone_main') || 'oat',
      tone_alt: fd.get('tone_alt') || 'cream',
      cap_main: null,
      cap_alt: null,
      image_main_url: String(fd.get('image_main_url') || '').trim() || null,
      image_alt_url: String(fd.get('image_alt_url') || '').trim() || null,
      is_active: !!form.elements.namedItem('is_active')?.checked,
    };

    if (!editingId) {
      payload.sort_order = await nextSortOrder();
    }

    return payload;
  }

  async function uploadIfNeeded(slug, payload) {
    if (mainFile) {
      if (payload.image_main_url) await store().removeStorageFile(payload.image_main_url).catch(() => {});
      payload.image_main_url = await store().uploadImage(slug, 'main', mainFile);
    }
    if (altFile) {
      if (payload.image_alt_url) await store().removeStorageFile(payload.image_alt_url).catch(() => {});
      payload.image_alt_url = await store().uploadImage(slug, 'alt', altFile);
    }
    return payload;
  }

  async function saveProduct(e) {
    e.preventDefault();
    requireAdmin();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    if (errEl) errEl.textContent = '';
    try {
      let payload = await readForm();
      payload = await uploadIfNeeded(payload.slug, payload);

      if (editingId) {
        const { error } = await client().from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await client().from('products').insert(payload);
        if (error) throw error;
      }
      closeModal();
      await store().loadCatalog(true);
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'No se pudo guardar el producto.';
    } finally {
      submit.disabled = false;
    }
  }

  async function deleteProduct(id) {
    requireAdmin();
    if (!confirm('¿Eliminar este producto de forma permanente?')) return;
    const { error } = await client().from('products').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await store().loadCatalog(true);
  }

  async function openEdit(id) {
    requireAdmin();
    const products = await store().fetchProducts(true);
    const p = products.find((x) => x.id === id);
    if (!p) return;
    editingId = id;
    await loadCategories(p.category_id);
    fillForm(p);
    openModal('Editar producto');
  }

  async function openCreate() {
    requireAdmin();
    editingId = null;
    await loadCategories();
    fillForm(null);
    openModal('Nuevo producto');
  }

  async function addCategoryFromForm() {
    requireAdmin();
    const input = form?.elements.namedItem('new_category');
    const name = String(input?.value || '').trim();
    if (!name) return;
    const slug = store().slugify(name);
    const { data, error } = await client()
      .from('categories')
      .insert({ name, slug, sort_order: categories.length + 1 })
      .select('id')
      .single();
    if (error) throw error;
    input.value = '';
    await loadCategories(data.id);
  }

  function bindGridActions() {
    const grid = document.getElementById('collection-grid');
    if (!grid || grid._adminBound) return;
    grid._adminBound = true;
    grid.addEventListener('click', (e) => {
      if (!window.alfaAuth?.isAdmin) return;
      const edit = e.target.closest('[data-edit-product]');
      const del = e.target.closest('[data-delete-product]');
      if (edit) openEdit(edit.getAttribute('data-edit-product'));
      if (del) deleteProduct(del.getAttribute('data-delete-product'));
    });
  }

  form?.querySelector('[name="image_main"]')?.addEventListener('change', (e) => {
    mainFile = e.target.files?.[0] || null;
  });
  form?.querySelector('[name="image_alt"]')?.addEventListener('change', (e) => {
    altFile = e.target.files?.[0] || null;
  });

  form?.querySelector('[data-clear-image="main"]')?.addEventListener('click', async () => {
    const url = form.querySelector('[name="image_main_url"]').value;
    if (url) await store().removeStorageFile(url).catch(() => {});
    form.querySelector('[name="image_main_url"]').value = '';
    mainFile = null;
    updatePreviews();
  });

  form?.querySelector('[data-clear-image="alt"]')?.addEventListener('click', async () => {
    const url = form.querySelector('[name="image_alt_url"]').value;
    if (url) await store().removeStorageFile(url).catch(() => {});
    form.querySelector('[name="image_alt_url"]').value = '';
    altFile = null;
    updatePreviews();
  });

  form?.querySelector('[data-add-category]')?.addEventListener('click', async () => {
    try {
      await addCategoryFromForm();
    } catch (err) {
      alert(err.message || 'No se pudo crear la categoría.');
    }
  });

  document.getElementById('admin-new-product')?.addEventListener('click', (e) => {
    e.preventDefault();
    openCreate();
  });

  document.getElementById('admin-new-product-inline')?.addEventListener('click', (e) => {
    e.preventDefault();
    openCreate();
  });

  panel?.querySelectorAll('[data-close-admin-modal]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  panel?.addEventListener('click', (e) => {
    if (e.target === panel) closeModal();
  });

  form?.addEventListener('submit', saveProduct);

  window.addEventListener('alfa:auth', (e) => {
    bindGridActions();
    if (e.detail?.isAdmin) loadCategories();
  });

  bindGridActions();
})();
