const CATEGORY_LABELS = {
  pantalones: 'Pantalones',
  polerones: 'Polerones',
  poleras: 'Poleras',
  accesorios: 'Accesorios'
};

const grid = document.getElementById('productGrid');
const emptyState = document.getElementById('emptyState');
const navButtons = document.querySelectorAll('#catNav button');

let allProducts = [];
let activeCategory = '';

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('request failed');
    allProducts = await res.json();
    render();
  } catch (err) {
    grid.innerHTML = '';
    emptyState.hidden = false;
    emptyState.textContent = 'No se pudo cargar el catálogo. Intenta de nuevo más tarde.';
  }
}

function render() {
  const items = activeCategory
    ? allProducts.filter((p) => p.category === activeCategory)
    : allProducts;

  grid.innerHTML = '';
  emptyState.hidden = items.length > 0;
  emptyState.textContent = 'Todavía no hay productos en esta categoría.';

  for (const product of items) {
    grid.appendChild(buildCard(product));
  }
}

function buildCard(product) {
  const card = document.createElement('article');
  card.className = 'card' + (product.in_stock ? '' : ' is-out');

  const media = document.createElement('div');
  media.className = 'card-media';

  const img = document.createElement('img');
  img.src = `/img/${product.image_key}`;
  img.alt = product.name;
  img.loading = 'lazy';
  media.appendChild(img);

  if (!product.in_stock) {
    const stamp = document.createElement('span');
    stamp.className = 'stamp';
    stamp.textContent = 'Agotado';
    media.appendChild(stamp);
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  const cat = document.createElement('span');
  cat.className = 'card-cat';
  cat.textContent = CATEGORY_LABELS[product.category] || product.category;

  const name = document.createElement('h3');
  name.className = 'card-name';
  name.textContent = product.name;

  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = product.description;
    body.appendChild(cat);
    body.appendChild(name);
    body.appendChild(desc);
  } else {
    body.appendChild(cat);
    body.appendChild(name);
  }

  const row = document.createElement('div');
  row.className = 'card-row';

  const price = document.createElement('span');
  price.className = 'card-price';
  price.textContent = product.price ? `$${product.price}` : 'Consultar';
  row.appendChild(price);

  body.appendChild(row);

  card.appendChild(media);
  card.appendChild(body);
  return card;
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    navButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.cat;
    render();
  });
});

loadProducts();
