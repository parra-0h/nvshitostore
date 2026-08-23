const CATEGORY_LABELS = {
  pantalones: 'Pantalones',
  polerones: 'Polerones',
  poleras: 'Poleras',
  zapatillas: 'Zapatillas',
  accesorios: 'Accesorios'
};

const detailContainer = document.getElementById('productDetail');

async function loadProduct() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    detailContainer.innerHTML = '<p>Producto no encontrado.</p>';
    return;
  }

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('request failed');
    const allProducts = await res.json();
    
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
      detailContainer.innerHTML = '<p>Producto no encontrado.</p>';
      return;
    }

    renderProduct(product);
  } catch (err) {
    detailContainer.innerHTML = '<p>Error al cargar el producto.</p>';
  }
}

function renderProduct(product) {
  const catLabel = CATEGORY_LABELS[product.category] || product.category;
  
  const inStockHtml = product.in_stock 
    ? (product.stock_qty > 0 ? `<p style="color:#4fd67a; font-weight: bold; font-size: 13px;">${product.stock_qty} disponibles</p>` : '')
    : '<p style="color:var(--red); font-weight: bold; font-size: 13px;">Agotado</p>';
    
  let btnHtml = product.in_stock 
    ? `<a href="https://instagram.com/nvshitostore" target="_blank" class="btn-buy">Comprar por Instagram</a>`
    : `<a href="#" class="btn-buy" style="background: #333; cursor: not-allowed; opacity: 0.7;">Agotado</a>`;

  detailContainer.innerHTML = `
    <div class="product-image-col">
      <img src="/img/${product.image_key}" alt="${product.name}">
    </div>
    <div class="product-info-col">
      <div class="prod-cat">${catLabel}</div>
      <h1 class="prod-name">${product.name}</h1>
      <div class="prod-price">${product.price ? '$' + product.price : 'Consultar'}</div>
      
      ${inStockHtml}
      
      <div class="prod-desc">${product.description || 'Sin descripción detallada.'}</div>
      
      ${btnHtml}
    </div>
  `;
  
  document.title = `${product.name} — Nvshitostore`;
}

loadProduct();
