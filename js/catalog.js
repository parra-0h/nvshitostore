const CATEGORY_LABELS = {
  pantalones: 'Pantalones',
  polerones: 'Polerones',
  poleras: 'Poleras',
  zapatillas: 'Zapatillas',
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
    const LIMIT = 80;
    const isLong = product.description.length > LIMIT;

    const desc = document.createElement('p');
    desc.className = 'card-desc expanded';
    desc.textContent = isLong
      ? product.description.slice(0, LIMIT).trimEnd() + '…'
      : product.description;

    body.appendChild(cat);
    body.appendChild(name);
    body.appendChild(desc);

    if (isLong) {
      const toggle = document.createElement('button');
      toggle.className = 'desc-toggle';
      toggle.textContent = 'Ver más';
      let open = false;
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        open = !open;
        desc.textContent = open
          ? product.description
          : product.description.slice(0, LIMIT).trimEnd() + '…';
        toggle.textContent = open ? 'Ver menos' : 'Ver más';
      });
      body.appendChild(toggle);
    }
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

  if (product.stock_qty !== null && product.stock_qty !== undefined && product.stock_qty !== '') {
    const stockTag = document.createElement('span');
    stockTag.className = 'card-stock' + (product.stock_qty > 0 ? ' stock-ok' : ' stock-low');
    stockTag.textContent = product.stock_qty > 0 ? `${product.stock_qty} disponibles` : 'Quedan pocos';
    row.appendChild(stockTag);
  }

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
