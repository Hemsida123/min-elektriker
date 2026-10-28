(() => {
  'use strict';
  const root = document.body.dataset.root || './';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = number => new Intl.NumberFormat('sv-SE', {maximumFractionDigits: Number.isInteger(Number(number)) ? 0 : 2}).format(number) + ' kr';
  const storeKey = 'min-elektriker-design-cart-v1';
  let memoryCart = [];
  function readCart() {
    try {
      const list = JSON.parse(localStorage.getItem(storeKey) || '[]');
      return Array.isArray(list) ? list.filter(p => typeof p.key === 'string' && typeof p.name === 'string' && /^produkter\/[a-zA-Z0-9%_-]+\.html$/.test(p.path) && Number.isFinite(p.price) && p.price > 0 && Number.isInteger(p.qty) && p.qty > 0 && p.qty <= 99).slice(0, 100) : [];
    } catch { return memoryCart; }
  }
  function saveCart(cart) {
    memoryCart = cart;
    try { localStorage.setItem(storeKey, JSON.stringify(cart)); } catch {}
    updateCount();
  }
  function updateCount() { const n = readCart().reduce((sum, p) => sum + p.qty, 0); $$('[data-cart-count]').forEach(el => el.textContent = n); }
  updateCount();
  window.addEventListener('storage', () => { updateCount(); if ($('#basket-items')) renderCart(); });
  const menu = $('.menu-toggle');
  function closeMenu() { document.body.classList.remove('menu-open'); menu?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-label', 'Öppna meny'); }
  menu?.addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Stäng meny' : 'Öppna meny'); });
  $$('.navlinks a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { closeMenu(); menu.focus(); } });
  window.matchMedia('(min-width:701px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  $('#email-form')?.addEventListener('submit', e => { e.preventDefault(); const subject = $('#subject').value; const message = $('#message').value.trim(); if (!message) return; window.location.href = 'mailto:peter@min-elektriker.se?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message + '\n\nNamn:\nTelefon:\nOrt:'); });
  $$('[data-gallery]').forEach(button => button.addEventListener('click', () => { $('#main-product-image').src = button.dataset.gallery; $$('[data-gallery]').forEach(b => b.classList.toggle('active', b === button)); }));
  let toastTimer;
  function toast(text) { const el = $('#toast'); el.innerHTML = '<span>' + escape(text) + '</span><a href="' + root + 'varukorg.html">Visa varukorg</a>'; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 6000); }
  const productElement = $('#product-data');
  if (productElement) {
    const p = JSON.parse(productElement.textContent);
    const select = $('#variant');
    select?.addEventListener('change', () => { const v = p.variants.find(v => String(v.id) === select.value); $('#product-price').textContent = v ? money(v.price) : 'Från ' + money(p.price); $('#add-to-cart').disabled = !v || !v.available; });
    $('#add-to-cart')?.addEventListener('click', () => {
      const v = select ? p.variants.find(v => String(v.id) === select.value) : null;
      if (select && (!v || !v.available)) return;
      const qty = Number($('#quantity').value);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) { $('#quantity').reportValidity(); return; }
      const key = p.id + '-' + (v?.id || 'single');
      const cart = readCart(); const found = cart.find(x => x.key === key);
      if (found) found.qty = Math.min(99, found.qty + qty);
      else cart.push({key, name: p.name, path: p.path, image: p.image, price: v?.price || p.price, variant: v?.label || '', qty});
      saveCart(cart); toast('Produkten har lagts i din demovarukorg.');
    });
  }
  function renderCart() {
    const list = readCart(); const el = $('#basket-items');
    if (!list.length) el.innerHTML = '<div class="empty"><h2>Här är det tomt än så länge.</h2><p>Utforska sortimentet och lägg till produkter för att prova varukorgen.</p><a class="btn" href="' + root + 'webbutik.html">Till webbutiken</a></div>';
    else el.innerHTML = list.map(p => '<article class="basket-row">' + (p.image && /^assets\/products\/[a-f0-9]+\.webp$/.test(p.image) ? '<img src="' + root + p.image + '" alt="" width="90" height="90">' : '<span class="no-photo">Ingen bild</span>') + '<div><h3><a href="' + root + escape(p.path) + '">' + escape(p.name) + '</a></h3>' + (p.variant ? '<small>' + escape(p.variant) + '</small>' : '') + '<div class="qty-control"><button data-qty="-1" data-key="' + escape(p.key) + '" aria-label="Minska antal för ' + escape(p.name) + '">−</button><span aria-label="Antal">' + p.qty + '</span><button data-qty="1" data-key="' + escape(p.key) + '" aria-label="Öka antal för ' + escape(p.name) + '" ' + (p.qty >= 99 ? 'disabled' : '') + '>+</button><button class="remove" data-remove="' + escape(p.key) + '">Ta bort</button></div></div><strong>' + money(p.price * p.qty) + '</strong></article>').join('');
    $('#basket-total').textContent = money(list.reduce((s, p) => s + p.price * p.qty, 0));
    $('#basket-count').textContent = list.reduce((s, p) => s + p.qty, 0);
    $('#checkout-preview').disabled = !list.length;
    if (!list.length) $('#checkout-info').hidden = true;
    updateCount();
  }
  if ($('#basket-items')) {
    renderCart();
    $('#basket-items').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      let cart = readCart();
      if (b.dataset.remove) cart = cart.filter(p => p.key !== b.dataset.remove);
      if (b.dataset.qty) { const p = cart.find(p => p.key === b.dataset.key); if (p) p.qty = Math.min(99, p.qty + Number(b.dataset.qty)); cart = cart.filter(p => p.qty > 0); }
      saveCart(cart); renderCart();
    });
    $('#checkout-preview').addEventListener('click', () => { $('#checkout-info').hidden = false; $('#checkout-info').setAttribute('tabindex', '-1'); $('#checkout-info').focus(); });
  }
  function initShop() {
    if (!$('#shop') || !window.MIN_CATALOG || $('#shop').dataset.ready) return;
    $('#shop').dataset.ready = 'true';
    const data = window.MIN_CATALOG;
    const params = new URLSearchParams(location.search);
    const state = {query: params.get('q') || '', category: params.get('kategori') || '', sort: params.get('sort') || 'featured', page: Math.max(1, Number(params.get('sida')) || 1)};
    if (!['featured','price-asc','price-desc','name'].includes(state.sort)) state.sort = 'featured';
    $('#sok').value = state.query; $('#sort').value = state.sort;
    const topCats = data.categories.filter(c => !c.parent && c.count > 0).sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    $('#categories').innerHTML = '<button type="button" data-category="">Alla produkter <small>' + data.products.length + '</small></button>' + topCats.map(c => '<button type="button" data-category="' + c.id + '">' + escape(c.name) + '<small>' + c.count + '</small></button>').join('');
    $('#category-mobile').innerHTML = '<option value="">Alla kategorier</option>' + data.categories.filter(c => c.count > 0).sort((a,b) => a.name.localeCompare(b.name, 'sv')).map(c => '<option value="' + c.id + '">' + escape(c.name + (c.parent ? ' · ' + (data.categories.find(parent => parent.id === c.parent)?.name || '') : '')) + '</option>').join('');
    const featured = [816,1139,329,296,809,1472,1473,1474,1475];
    const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    function render() {
      const query = normalize(state.query).split(/\s+/).filter(Boolean);
      const cat = data.categories.find(c => String(c.id) === state.category);
      let list = data.products.filter(p => (!cat || p.categories.some(c => cat.children.includes(c))) && query.every(q => normalize(p.name + ' ' + p.sku + ' ' + p.category).includes(q)));
      if (state.sort === 'price-asc') list.sort((a,b) => (a.price || Infinity) - (b.price || Infinity));
      if (state.sort === 'price-desc') list.sort((a,b) => b.price - a.price);
      if (state.sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name, 'sv'));
      if (state.sort === 'featured') list.sort((a,b) => (featured.includes(a.id) ? featured.indexOf(a.id) : (a.image ? 999 : 1999)) - (featured.includes(b.id) ? featured.indexOf(b.id) : (b.image ? 999 : 1999)));
      const pages = Math.max(1, Math.ceil(list.length / 24)); state.page = Math.min(pages, state.page);
      $('#results-count').textContent = list.length + (list.length === 1 ? ' produkt' : ' produkter') + (state.query ? ' för ”' + state.query + '”' : '');
      $('#category-mobile').value = state.category;
      $$('[data-category]').forEach(b => { b.classList.toggle('selected', b.dataset.category === state.category); b.setAttribute('aria-pressed', String(b.dataset.category === state.category)); });
      $('#products').innerHTML = list.length ? list.slice((state.page - 1) * 24, state.page * 24).map(p => '<a class="product-card" href="' + root + escape(p.path) + '"><div class="product-media">' + (/installation/i.test(p.name) ? '<span class="product-label">Med installation</span>' : '') + (p.image ? '<img src="' + root + p.image + '" width="400" height="400" loading="lazy" decoding="async" alt="' + escape(p.name) + '">' : '<span class="no-photo">Produktbild saknas</span>') + '</div><span class="category">' + escape(p.category) + '</span><h3>' + escape(p.name) + '</h3><div class="price-row"><span class="price">' + (p.price > 0 ? (p.variable ? '<small>Från </small>' : '') + money(p.price) : 'Begär pris') + '</span><span class="circle" aria-hidden="true"><img class="icon" alt="" src="' + root + 'assets/icons/arrow-up-right.svg"></span></div></a>').join('') : '<div class="empty"><h2>Vi hittade ingen matchning.</h2><p>Prova ett annat sökord eller välj en annan kategori.</p><button class="btn" id="reset-search">Visa alla produkter</button></div>';
      const nums = [...new Set([1, Math.max(1,state.page-1), state.page, Math.min(pages,state.page+1), pages])].sort((a,b)=>a-b);
      $('#pagination').innerHTML = pages > 1 ? '<button data-page="' + (state.page - 1) + '" ' + (state.page === 1 ? 'disabled' : '') + ' aria-label="Föregående sida"><img class="icon" alt="" src="' + root + 'assets/icons/arrow-left.svg"></button>' + nums.map((n,i) => (i && n > nums[i-1]+1 ? '<span>…</span>' : '') + '<button data-page="' + n + '" class="' + (n === state.page ? 'current' : '') + '" ' + (n === state.page ? 'aria-current="page"' : '') + ' aria-label="Sida ' + n + '">' + n + '</button>').join('') + '<button data-page="' + (state.page + 1) + '" ' + (state.page === pages ? 'disabled' : '') + ' aria-label="Nästa sida"><img class="icon" alt="" src="' + root + 'assets/icons/arrow-right.svg"></button>' : '';
      const url = new URL(location.href); url.search = ''; if (state.query) url.searchParams.set('q',state.query); if (state.category) url.searchParams.set('kategori',state.category); if (state.sort !== 'featured') url.searchParams.set('sort',state.sort); if (state.page > 1) url.searchParams.set('sida',String(state.page));
      try { history.replaceState(null, '', url); } catch {}
      $('#reset-search')?.addEventListener('click', () => { state.query = ''; state.category = ''; state.page = 1; $('#sok').value = ''; render(); $('#sok').focus(); });
    }
    let searchTimer;
    $('#sok').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.query = $('#sok').value.trim(); state.page = 1; render(); }, 130); });
    $('#sort').addEventListener('change', () => { state.sort = $('#sort').value; state.page = 1; render(); });
    $('#category-mobile').addEventListener('change', () => { state.category = $('#category-mobile').value; state.page = 1; render(); });
    $('#categories').addEventListener('click', e => { const b = e.target.closest('[data-category]'); if (!b) return; state.category = b.dataset.category; state.page = 1; render(); });
    $('#pagination').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (!b) return; state.page = Number(b.dataset.page); render(); $('.shop-toolbar').scrollIntoView({block:'start',behavior:'instant'}); });
    render();
  }
  initShop(); document.addEventListener('catalogready', initShop);
})();
