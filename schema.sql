CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT,
  description TEXT,
  image_key TEXT NOT NULL,
  in_stock INTEGER NOT NULL DEFAULT 1,
  stock_qty INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
