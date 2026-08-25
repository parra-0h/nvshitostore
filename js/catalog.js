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
let searchQuery = '';

// ---- Search bar toggle ----
const searchToggle = document.getElementById('searchToggle');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const searchClose = document.getElementById('searchClose');

if (searchToggle && searchBar && searchInput) {
  searchToggle.addEventListener('click', () => {
    searchBar.hidden = !searchBar.hidden;
    if (!searchBar.hidden) {
      searchInput.focus();
    } else {
      searchQuery = '';
      searchInput.value = '';
      render();
    }
  });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    render();
  });

  if (searchClose) {
    searchClose.addEventListener('click', () => {
      searchBar.hidden = true;
      searchQuery = '';
      searchInput.value = '';
      render();
    });
  }
}

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
  let items = activeCategory
    ? allProducts.filter((p) => p.category === activeCategory)
    : allProducts;

  if (searchQuery) {
    items = items.filter((p) =>
      p.name.toLowerCase().includes(searchQuery) ||
      (p.category && p.category.toLowerCase().includes(searchQuery))
    );
  }

  grid.innerHTML = '';
  emptyState.hidden = items.length > 0;
  emptyState.textContent = 'Todavía no hay productos en esta categoría.';

  for (const product of items) {
    grid.appendChild(buildCard(product));
  }
}

function buildCard(product) {
  const card = document.createElement('a');
  card.href = `/product.html?id=${product.id}`;
  card.className = 'card' + (product.in_stock ? '' : ' is-out');
  card.style.textDecoration = 'none';

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

  const price = document.createElement('div');
  price.className = 'card-price';
  price.textContent = product.price ? `$${product.price}` : 'Consultar';

  body.appendChild(cat);
  body.appendChild(name);
  body.appendChild(price);

  if (product.stock_qty !== null && product.stock_qty !== undefined && product.stock_qty !== '') {
    const stockTag = document.createElement('span');
    stockTag.className = 'card-stock' + (product.stock_qty > 0 ? ' stock-ok' : ' stock-low');
    stockTag.textContent = product.stock_qty > 0 ? `${product.stock_qty} disponibles` : 'Quedan pocos';
    // Optionally append stock tag
  }

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

// ---- Hero Carousel ----
const carouselTrack = document.getElementById('carouselTrack');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const carouselDots = document.querySelectorAll('#carouselDots .dot');

if (carouselTrack && carouselPrev && carouselNext && carouselDots.length > 0) {
  let currentSlide = 0;
  const slideCount = carouselDots.length;

  function updateCarousel() {
    carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    carouselDots.forEach(d => d.classList.remove('active'));
    carouselDots[currentSlide].classList.add('active');
  }

  carouselPrev.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slideCount) % slideCount;
    updateCarousel();
  });

  carouselNext.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slideCount;
    updateCarousel();
  });

  carouselDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      currentSlide = parseInt(e.target.dataset.index, 10);
      updateCarousel();
    });
  });
  
  // Auto-slide every 5 seconds
  setInterval(() => {
    currentSlide = (currentSlide + 1) % slideCount;
    updateCarousel();
  }, 5000);
}
