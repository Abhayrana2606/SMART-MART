// SmartMart Scan backend server using Express and SQLite
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Database = require('better-sqlite3');
const db = new Database('smartmart.db');

// Securely patch existing Orders schema tracking payment states natively
try {
  db.exec("ALTER TABLE Orders ADD COLUMN status TEXT DEFAULT 'pending'");
} catch (e) {
  // Column typically already exists natively executing
}

try {
  db.exec("ALTER TABLE Orders ADD COLUMN customer_contact TEXT DEFAULT ''");
} catch (e) {
  // Column safely handled
}

// Initialize statements cleanly against SQL Injection vulnerabilities
const getProductQuery = db.prepare(`
  SELECT p.name, p.brand, p.image, r.price 
  FROM Products p
  LEFT JOIN Prices r ON p.barcode = r.barcode
  WHERE p.barcode = ?
`);

const insertProductQuery = db.prepare('INSERT OR IGNORE INTO Products (barcode, name, brand, image) VALUES (@barcode, @name, @brand, @image)');
const insertPriceQuery = db.prepare('INSERT OR IGNORE INTO Prices (barcode, price) VALUES (?, ?)');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SmartMart backend safely running utilizing SQLite Engine');
});

// Scan route structurally tied right into SQLite and dynamic OFD resolution
app.get('/scan/:barcode', async (req, res) => {
  const { barcode } = req.params;
  
  try {
    // 1. Look to securely fetch existing database definitions directly
    const row = getProductQuery.get(barcode);
    if (row) {
      return res.json({
        barcode,
        name: row.name,
        brand: row.brand,
        image: row.image,
        price: row.price || 0
      });
    }

    // 2. Fetch globally outside of internal cache as fallback logic
    const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await axios.get(apiUrl);
    
    if (response.data && response.data.status === 1 && response.data.product) {
      const name = response.data.product.product_name || 'Unknown External Product';
      const brand = response.data.product.brands || '';
      const image = response.data.product.image_url || '';
      const price = 0; // Default zero-verified tracking mapping

      // Instantly inject verified offline mappings natively inside SQLite storage bounds
      insertProductQuery.run({ barcode, name, brand, image });
      insertPriceQuery.run(barcode, price);

      return res.json({ barcode, name, brand, image, price });
    }

    // Pass failure explicitly back to user interface dynamically
    return res.status(404).json({ error: 'Product not verifiable' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed external fetch routine mapping' });
  }
});

// Checkout securely configured transactional pipeline
const insertOrder = db.prepare('INSERT INTO Orders (order_id, subtotal, tax, total, customer_contact) VALUES (?, ?, ?, ?, ?)');
const insertOrderItem = db.prepare('INSERT INTO OrderItems (order_id, barcode, qty, price_at_checkout) VALUES (?, ?, ?, ?)');
const getPriceQuery = db.prepare('SELECT price FROM Prices WHERE barcode = ?');

app.post('/checkout', (req, res) => {
  const { items, customerContact } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid cart tracking schema sequence' });

  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const code = item.barcode;
    const qty = parseInt(item.qty, 10);
    if (!code || isNaN(qty) || qty <= 0) continue;

    // Utilize primary strict SQL pricing query evaluation constraints
    const row = getPriceQuery.get(code);
    const price = row ? row.price : 0;
    
    subtotal += (price * qty);
    processedItems.push({ code, qty, price });
  }

  const tax = 0;
  const total = subtotal + tax;
  const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  // Leverage structured commit transaction sequence natively holding customer identities globally
  const saveOrderTransaction = db.transaction(() => {
    insertOrder.run(orderId, subtotal, tax, total, customerContact || '');
    for (const pItem of processedItems) {
      insertOrderItem.run(orderId, pItem.code, pItem.qty, pItem.price);
    }
  });

  try {
    saveOrderTransaction();
    return res.json({ orderId, subtotal, tax, total });
  } catch (err) {
    console.error('Order serialization fault:', err);
    return res.status(500).json({ error: 'Failed transaction history save routines.' });
  }
});

const getOrderQuery = db.prepare('SELECT * FROM Orders WHERE order_id = ?');
const getOrderItemsQuery = db.prepare(`
  SELECT i.qty, i.price_at_checkout as price, p.name, p.brand 
  FROM OrderItems i 
  LEFT JOIN Products p ON i.barcode = p.barcode 
  WHERE i.order_id = ?
`);

app.get('/api/receipt/:orderId', (req, res) => {
  const { orderId } = req.params;
  try {
    const order = getOrderQuery.get(orderId);
    if (!order) return res.status(404).json({ error: 'Order signature invalid' });
    
    const items = getOrderItemsQuery.all(orderId);
    return res.json({ order, items });
  } catch (error) {
    return res.status(500).json({ error: 'Failed retrieving safe payload formatting' });
  }
});

const getAllProductsQuery = db.prepare(`
  SELECT p.barcode, p.name, p.brand, p.image, r.price 
  FROM Products p
  LEFT JOIN Prices r ON p.barcode = r.barcode
  ORDER BY p.name ASC
`);

app.get('/api/admin/products', (req, res) => {
  try {
    const products = getAllProductsQuery.all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products natively' });
  }
});

const updateProductAdminQuery = db.prepare('INSERT OR REPLACE INTO Products (barcode, name, brand, image) VALUES (@barcode, @name, @brand, @image)');
const updatePriceAdminQuery = db.prepare('INSERT OR REPLACE INTO Prices (barcode, price) VALUES (@barcode, @price)');

app.post('/api/admin/products', (req, res) => {
  const { barcode, name, brand, image, price } = req.body;
  if (!barcode || !name || isNaN(price)) {
    return res.status(400).json({ error: 'Failing core validation structure' });
  }
  
  const transaction = db.transaction(() => {
    updateProductAdminQuery.run({ barcode, name, brand, image: image || '' });
    updatePriceAdminQuery.run({ barcode, price: parseFloat(price) });
  });

  try {
    transaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed transaction execution' });
  }
});

const getOrdersQuery = db.prepare('SELECT * FROM Orders ORDER BY created_at DESC LIMIT 100');

app.get('/api/admin/orders', (req, res) => {
  try {
    const orders = getOrdersQuery.all();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to natively query log structure' });
  }
});

const updateOrderStatus = db.prepare('UPDATE Orders SET status = ? WHERE order_id = ?');

app.post('/api/payment/confirm', (req, res) => {
  const { orderId, method } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Order context missing' });

  try {
    const result = updateOrderStatus.run('paid', orderId);
    if (result.changes === 0) return res.status(404).json({ error: 'Order block not actively found' });
    
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal serialization failure' });
  }
});

// Primary Listener Binding
const PORT = 5001;
app.listen(PORT, () => console.log(`SmartMart SQLite Instance dynamically loaded actively executing on http://localhost:${PORT}`));
