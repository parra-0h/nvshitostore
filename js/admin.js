const CATEGORY_LABELS = {
  pantalones: 'Pantalones',
  polerones: 'Polerones',
  poleras: 'Poleras',
  zapatillas: 'Zapatillas',
  accesorios: 'Accesorios'
};

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

async function checkSession() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.authenticated) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
}

function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  loadProducts();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('bad credentials');
    document.getElementById('password').value = '';
    showDashboard();
  } catch {
    loginError.textContent = 'Contraseña incorrecta.';
    loginError.hidden = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

/* ---------------- Upload ---------------- */

const dropzone = document.getElementById('dropzone');
const imageInput = document.getElementById('imageInput');
const previewImg = document.getElementById('previewImg');
const dropzoneEmpty = document.getElementById('dropzoneEmpty');
const uploadForm = document.getElementById('uploadForm');
const uploadError = document.getElementById('uploadError');
const uploadSuccess = document.getElementById('uploadSuccess');
const uploadBtn = document.getElementById('uploadBtn');

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag');
  if (e.dataTransfer.files[0]) {
    imageInput.files = e.dataTransfer.files;
    previewFile(e.dataTransfer.files[0]);
  }
});
imageInput.addEventListener('change', () => {
  if (imageInput.files[0]) previewFile(imageInput.files[0]);
});

function previewFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    previewImg.src = reader.result;
    previewImg.hidden = false;
    dropzoneEmpty.hidden = true;
  };
  reader.readAsDataURL(file);
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  uploadError.hidden = true;
  uploadSuccess.hidden = true;

  const file = imageInput.files[0];
  const name = document.getElementById('name').value.trim();
  const category = document.getElementById('category').value;
  const price = document.getElementById('price').value.trim();
  const description = document.getElementById('description').value.trim();
  const inStock = document.getElementById('inStock').checked;
  const stockQty = document.getElementById('stockQty').value.trim();

  if (!file || !name || !category) {
    uploadError.textContent = 'Falta la foto, el nombre o la categoría.';
    uploadError.hidden = false;
    return;
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('name', name);
  formData.append('category', category);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('in_stock', inStock ? 'true' : 'false');
  formData.append('stock_qty', stockQty);

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Subiendo…';

  try {
    const res = await fetch('/api/products', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error al subir el producto');
    }
    uploadForm.reset();
    previewImg.hidden = true;
    previewImg.src = '';
    dropzoneEmpty.hidden = false;
    uploadSuccess.hidden = false;
    loadProducts();
  } catch (err) {
    uploadError.textContent = err.message;
    uploadError.hidden = false;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Publicar producto';
  }
});

/* ---------------- Product list ---------------- */

const productsList = document.getElementById('productsList');
const productCount = document.getElementById('productCount');
const filterCategory = document.getElementById('filterCategory');
let products = [];

async function loadProducts() {
  const res = await fetch('/api/products');
  products = await res.json();
  renderList();
}

function renderList() {
  const cat = filterCategory.value;
  const items = cat ? products.filter((p) => p.category === cat) : products;

  productCount.textContent = items.length;
  productsList.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.style.padding = '0';
    empty.textContent = 'No hay productos todavía.';
    productsList.appendChild(empty);
    return;
  }

  for (const product of items) {
    productsList.appendChild(buildRow(product));
  }
}

function buildRow(product) {
  const row = document.createElement('div');
  row.className = 'product-row';

  const img = document.createElement('img');
  img.className = 'row-thumb';
  img.src = `/img/${product.image_key}`;
  img.alt = product.name;

  const info = document.createElement('div');
  info.className = 'row-info';

  const cat = document.createElement('span');
  cat.className = 'row-cat';
  cat.textContent = CATEGORY_LABELS[product.category] || product.category;

  const name = document.createElement('h4');
  name.textContent = product.name;

  const price = document.createElement('span');
  price.className = 'row-price';
  price.textContent = product.price ? `$${product.price}` : 'Sin precio';

  const stockBadge = document.createElement('span');
  stockBadge.className = 'row-stock-badge';
  if (product.stock_qty !== null && product.stock_qty !== undefined && product.stock_qty !== '') {
    stockBadge.textContent = `Stock: ${product.stock_qty}`;
    stockBadge.classList.add(product.stock_qty > 0 ? 'badge-ok' : 'badge-low');
  } else {
    stockBadge.textContent = 'Sin cantidad';
    stockBadge.classList.add('badge-none');
  }

  info.appendChild(cat);
  info.appendChild(name);
  info.appendChild(price);
  info.appendChild(stockBadge);
  if (product.description) {
    const LIMIT = 60;
    const isLong = product.description.length > LIMIT;

    const desc = document.createElement('p');
    desc.className = 'row-desc';
    desc.textContent = isLong
      ? product.description.slice(0, LIMIT).trimEnd() + '…'
      : product.description;
    info.appendChild(desc);

    if (isLong) {
      const toggle = document.createElement('button');
      toggle.className = 'row-desc-toggle';
      toggle.textContent = 'Ver más';
      let open = false;
      toggle.addEventListener('click', () => {
        open = !open;
        desc.textContent = open
          ? product.description
          : product.description.slice(0, LIMIT).trimEnd() + '…';
        desc.style.whiteSpace = open ? 'normal' : '';
        toggle.textContent = open ? 'Ver menos' : 'Ver más';
      });
      info.appendChild(toggle);
    }
  }

  const label = document.createElement('label');
  label.className = 'switch';
  label.title = 'Disponible en stock';

  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = !!product.in_stock;
  toggle.addEventListener('change', () => updateStock(product.id, toggle.checked, row));

  const track = document.createElement('span');
  track.className = 'switch-track';
  const thumb = document.createElement('span');
  thumb.className = 'switch-thumb';
  track.appendChild(thumb);

  label.appendChild(toggle);
  label.appendChild(track);

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'row-edit';
  editBtn.textContent = 'Editar';
  editBtn.addEventListener('click', () => openEditModal(product));

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'row-delete';
  delBtn.textContent = 'Eliminar';
  delBtn.addEventListener('click', () => deleteProduct(product.id, row));

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  row.appendChild(img);
  row.appendChild(info);
  row.appendChild(label);
  row.appendChild(actions);
  return row;
}

async function updateStock(id, inStock, rowEl) {
  rowEl.classList.add('is-saving');
  try {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ in_stock: inStock })
    });
    const p = products.find((x) => x.id === id);
    if (p) p.in_stock = inStock;
  } finally {
    rowEl.classList.remove('is-saving');
  }
}

async function deleteProduct(id, rowEl) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  rowEl.classList.add('is-saving');
  try {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    products = products.filter((p) => p.id !== id);
    renderList();
  } finally {
    rowEl.classList.remove('is-saving');
  }
}

filterCategory.addEventListener('change', renderList);

/* ---------------- Edit modal ---------------- */

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editError = document.getElementById('editError');
const editSuccess = document.getElementById('editSuccess');
const editSaveBtn = document.getElementById('editSaveBtn');

function openEditModal(product) {
  document.getElementById('editId').value = product.id;
  document.getElementById('editName').value = product.name;
  document.getElementById('editCategory').value = product.category;
  document.getElementById('editPrice').value = product.price || '';
  document.getElementById('editDescription').value = product.description || '';
  document.getElementById('editStockQty').value = (product.stock_qty !== null && product.stock_qty !== undefined) ? product.stock_qty : '';
  document.getElementById('editInStock').checked = !!product.in_stock;
  editError.hidden = true;
  editSuccess.hidden = true;
  editModal.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('editName').focus();
}

function closeEditModal() {
  editModal.hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !editModal.hidden) closeEditModal(); });

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  editError.hidden = true;
  editSuccess.hidden = true;

  const id = document.getElementById('editId').value;
  const name = document.getElementById('editName').value.trim();
  const category = document.getElementById('editCategory').value;
  const price = document.getElementById('editPrice').value.trim();
  const description = document.getElementById('editDescription').value.trim();
  const inStock = document.getElementById('editInStock').checked;
  const stockQtyRaw = document.getElementById('editStockQty').value.trim();
  const stockQty = stockQtyRaw !== '' && !isNaN(stockQtyRaw) ? parseInt(stockQtyRaw, 10) : null;

  editSaveBtn.disabled = true;
  editSaveBtn.textContent = 'Guardando…';

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, price, description, in_stock: inStock, stock_qty: stockQty })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error al guardar');
    }
    // Update local cache
    const p = products.find((x) => x.id === id);
    if (p) Object.assign(p, { name, category, price, description, in_stock: inStock, stock_qty: stockQty });
    editSuccess.hidden = false;
    renderList();
    setTimeout(closeEditModal, 900);
  } catch (err) {
    editError.textContent = err.message;
    editError.hidden = false;
  } finally {
    editSaveBtn.disabled = false;
    editSaveBtn.textContent = 'Guardar cambios';
  }
});

checkSession();
