const API_BASE = 'http://localhost:5001/api/admin';

let allProducts = [];

// Fallback configuration handling explicitly identical visually to checkout rendering
const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%25' height='100%25' fill='%23f8fafc'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='12' font-family='Arial' font-weight='bold'>MOCKUP</text></svg>";

async function fetchDashboardData() {
  try {
    const pRes = await fetch(`${API_BASE}/products`);
    allProducts = await pRes.json();
    renderProducts(allProducts);

    const oRes = await fetch(`${API_BASE}/orders`);
    const orders = await oRes.json();
    renderOrders(orders);
  } catch (err) {
    console.error('Failed to securely fetch dashboard context bindings:', err);
  }
}

function renderProducts(products) {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = products.map(p => `
    <tr class="hover:bg-slate-50 transition-colors group cursor-pointer border-b border-slate-50" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
      <td class="p-4 align-middle">
        <div class="h-14 w-14 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex items-center justify-center p-1 relative">
          <img src="${p.image || FALLBACK_IMAGE}" onerror="this.src='${FALLBACK_IMAGE}'" class="max-h-full object-cover rounded-lg absolute inset-0 w-full h-full">
        </div>
      </td>
      <td class="p-4 align-middle">
        <p class="font-extrabold text-slate-900 mb-0.5 line-clamp-1">${p.name}</p>
        <div class="flex items-center gap-2 text-xs">
            <span class="font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold">${p.barcode}</span>
            <span class="text-slate-400 font-semibold">• ${p.brand || 'Unbranded'}</span>
        </div>
      </td>
      <td class="p-4 text-right align-middle">
        <span class="inline-block bg-primary/10 text-primary px-3 py-1 font-extrabold rounded-lg ring-1 ring-primary/20">₹${p.price.toFixed(2)}</span>
      </td>
      <td class="p-4 text-right align-middle">
        <button class="text-slate-400 hover:text-slate-900 bg-white border border-slate-200 shadow-sm transition-colors rounded-full p-2 opacity-0 group-hover:opacity-100">
          <span class="material-symbols-outlined text-[18px]">edit</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderOrders(orders) {
  const list = document.getElementById('ordersList');
  if (orders.length === 0) {
    list.innerHTML = `<div class="text-center text-slate-400 py-12 font-bold flex flex-col items-center gap-2"><span class="material-symbols-outlined text-4xl">inbox</span> No Live Transactions</div>`;
    return;
  }
  
  list.innerHTML = orders.map(o => {
    // Format timezone sequence directly against UTC baseline standard cleanly
    const date = new Date(o.created_at + 'Z'); 
    return `
    <div class="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group hover:border-slate-300">
      <div class="absolute top-0 right-0 w-12 h-12 bg-primary/10 rounded-bl-full flex items-start justify-end p-2 opacity-50 group-hover:opacity-100 transition-opacity">
         <span class="material-symbols-outlined text-primary text-sm font-bold">receipt_long</span>
      </div>
      <div class="flex flex-col gap-1 z-10 relative">
        <span class="font-mono font-bold text-slate-400 text-[10px] tracking-wider uppercase">TXN ID: <span class="text-slate-800">${o.order_id}</span></span>
        <span class="font-extrabold text-2xl text-slate-900 tracking-tight">₹${o.total.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-end text-xs text-slate-500 mt-3 font-semibold border-t border-slate-50 pt-2 z-10 relative">
        <span class="flex items-center gap-1 text-primary"><span class="material-symbols-outlined text-[14px]">check_circle</span> Settled</span>
        <span>${date.toLocaleTimeString()}</span>
      </div>
    </div>
  `}).join('');
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allProducts.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.barcode.toLowerCase().includes(term) || 
    (p.brand && p.brand.toLowerCase().includes(term))
  );
  renderProducts(filtered);
});

function editProduct(p) {
  document.getElementById('modalTitle').innerHTML = '<span class="material-symbols-outlined text-primary">edit_square</span> Update Pricing Strategy';
  document.getElementById('p_barcode').value = p.barcode;
  document.getElementById('p_barcode').readOnly = true;
  document.getElementById('p_barcode').classList.add('opacity-60', 'cursor-not-allowed');
  document.getElementById('p_name').value = p.name;
  document.getElementById('p_brand').value = p.brand || '';
  document.getElementById('p_price').value = p.price;
  document.getElementById('p_image').value = p.image || '';
  document.getElementById('productModal').classList.remove('hidden');
  document.getElementById('productModal').classList.add('flex');
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
  document.getElementById('productModal').classList.remove('flex');
  document.getElementById('productForm').reset();
  document.getElementById('modalTitle').innerHTML = '<span class="material-symbols-outlined text-primary">qr_code</span> Add Catalog Entry';
  document.getElementById('p_barcode').readOnly = false;
  document.getElementById('p_barcode').classList.remove('opacity-60', 'cursor-not-allowed');
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    barcode: document.getElementById('p_barcode').value.trim(),
    name: document.getElementById('p_name').value.trim(),
    brand: document.getElementById('p_brand').value.trim(),
    price: parseFloat(document.getElementById('p_price').value),
    image: document.getElementById('p_image').value.trim()
  };

  const btn = e.target.querySelector('button[type="submit"]');
  const org = btn.innerHTML;
  btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">autorenew</span> Establishing Sync...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Security or processing fault during grid synchronization');
    closeProductModal();
    fetchDashboardData();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.innerHTML = org;
    btn.disabled = false;
  }
});

// Primary trigger
fetchDashboardData();
// Maintain visual sync loop updating timeline efficiently every strictly bound interval
setInterval(fetchDashboardData, 8000);
