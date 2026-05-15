const Database = require('better-sqlite3');
const fs = require('fs');

console.log("Starting SQLite connection...");
const db = new Database('smartmart.db');

console.log("Defining Relational Schema...");
db.exec(`
  CREATE TABLE IF NOT EXISTS Products (
    barcode TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS Prices (
    barcode TEXT PRIMARY KEY,
    price REAL NOT NULL,
    FOREIGN KEY(barcode) REFERENCES Products(barcode)
  );

  CREATE TABLE IF NOT EXISTS Orders (
    order_id TEXT PRIMARY KEY,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS OrderItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    barcode TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price_at_checkout REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES Orders(order_id),
    FOREIGN KEY(barcode) REFERENCES Products(barcode)
  );
`);

console.log("Reading old JSON datasets...");
const products = require('./products.json');
const prices = require('./prices.json');

const insertProduct = db.prepare('INSERT OR IGNORE INTO Products (barcode, name, brand, image) VALUES (@barcode, @name, @brand, @image)');
const insertPrice = db.prepare('INSERT OR IGNORE INTO Prices (barcode, price) VALUES (@barcode, @price)');

const insertTransaction = db.transaction(() => {
  // First dynamically insert all known products
  for (const [code, pData] of Object.entries(products)) {
    insertProduct.run({
      barcode: code,
      name: pData.name || 'Unknown Product',
      brand: pData.brand || '',
      image: pData.image || ''
    });

    let price = 0;
    if (typeof prices[code] === 'number') {
      price = prices[code];
    } else if (typeof pData.price === 'number') {
      price = pData.price;
    }
    
    // Safely configure and bind the native foreign price key mapping
    insertPrice.run({ barcode: code, price: price });
  }

  // Cover any hanging items remaining strictly inside the prices.json flat array that weren't inside products
  for (const [code, priceVal] of Object.entries(prices)) {
    if (!products[code]) {
      insertProduct.run({
        barcode: code,
        name: 'Unknown External Product',
        brand: '',
        image: ''
      });
      insertPrice.run({ barcode: code, price: priceVal });
    }
  }
});

console.log("Executing transaction...");
insertTransaction();
console.log("Migration sequence completed successfully! All items securely ported to SQLite.");
