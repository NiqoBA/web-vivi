/**
 * Login de administrador (sin registro público).
 */
(function () {
  const cfg = window.ALFA_SUPABASE;
  const client = window.alfaSupabase;

  if (!client) {
    console.warn('[alfa-auth] Esperando alfaSupabase');
    return;
  }

  const ADMIN_ID = cfg.adminUserId || 'fe5ad7ae-1303-4bf2-bbf9-1ac266687d99';

  function isAdminSession(session) {
    if (!session?.user) return false;
    const u = session.user;
    return u.id === ADMIN_ID || u.app_metadata?.role === 'admin';
  }

  function applyAdminUi(isAdmin) {
    document.body.classList.toggle('admin-mode', isAdmin);
    const bar = document.getElementById('admin-bar');
    if (bar) bar.hidden = !isAdmin;
    document.querySelectorAll('[data-admin-only]').forEach((el) => {
      if (el.id === 'admin-bar') return;
      el.hidden = !isAdmin;
    });
    document.querySelectorAll('[data-guest-only]').forEach((el) => {
      el.hidden = isAdmin;
    });
  }

  function publish(session) {
    const isAdmin = isAdminSession(session);
    window.alfaAuth = {
      session,
      user: session?.user ?? null,
      isAdmin,
      signIn: async (email, password) => {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!isAdminSession(data.session)) {
          await client.auth.signOut();
          throw new Error('Esta cuenta no tiene permisos de administrador.');
        }
        return data.session;
      },
      signOut: async () => {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      },
    };
    applyAdminUi(isAdmin);
    window.dispatchEvent(
      new CustomEvent('alfa:auth', { detail: { session, isAdmin } })
    );
  }

  client.auth.onAuthStateChange((_event, session) => publish(session));

  client.auth.getSession().then(({ data }) => publish(data.session));

  // Modal login
  const modal = document.getElementById('admin-login-modal');
  const form = document.getElementById('admin-login-form');
  const errEl = document.getElementById('admin-login-error');

  function openLogin() {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    errEl && (errEl.textContent = '');
    form?.querySelector('input[name="email"]')?.focus();
  }

  function closeLogin() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-open-admin-login]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.alfaAuth?.isAdmin) return;
      openLogin();
    });
  });

  modal?.querySelectorAll('[data-close-admin-login]').forEach((btn) => {
    btn.addEventListener('click', closeLogin);
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeLogin();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    const submit = form.querySelector('[type="submit"]');
    submit && (submit.disabled = true);
    if (errEl) errEl.textContent = '';
    try {
      await window.alfaAuth.signIn(email, password);
      closeLogin();
      form.reset();
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'No se pudo iniciar sesión.';
    } finally {
      submit && (submit.disabled = false);
    }
  });

  document.getElementById('admin-logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.alfaAuth.signOut();
  });
})();
