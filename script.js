/* script.js
   Logique de panier en localStorage, gestion du code promo CCA15 (-15%).
   Clés localStorage utilisées :
     - 'panier' : JSON.stringify(array d'items {id, name, price, qty, image})
     - 'promoCode' : string ou null (optionnel)
*/

// Formate un nombre en prix français: "199,00 €"
function formatPrice(value) {
  const fixed = (Math.round(value * 100) / 100).toFixed(2);
  return fixed.replace('.', ',') + ' €';
}

function getCart() {
  try {
    const raw = localStorage.getItem('panier');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erreur lecture panier:', e);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('panier', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product) {
  const cart = getCart();
  const idx = cart.findIndex(item => item.id === product.id);
  if (idx >= 0) {
    cart[idx].qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      qty: 1,
      image: product.image || ''
    });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  if (document.getElementById('cart-container')) {
    renderCartPage();
  }
}

function clearCart() {
  localStorage.removeItem('panier');
  localStorage.removeItem('promoCode');
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, it) => sum + (it.qty || 0), 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

function calculateSubtotal(cart) {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function computePromo(cart, code) {
  const subtotal = calculateSubtotal(cart);
  if (!code) {
    return { valid: false, discountAmount: 0, newTotal: subtotal, message: 'Aucun code appliqué' };
  }
  const normalized = code.trim().toUpperCase();
  if (normalized === 'CCA15') {
    const discountAmount = Math.round(subtotal * 0.15 * 100) / 100;
    const newTotal = Math.round((subtotal - discountAmount) * 100) / 100;
    return { valid: true, discountAmount, newTotal, message: 'Code appliqué : -15%' };
  } else {
    return { valid: false, discountAmount: 0, newTotal: subtotal, message: "Code invalide" };
  }
}

function applyPromo(code) {
  const cart = getCart();
  if (cart.length === 0) {
    showPromoMessage('Votre panier est vide', false);
    return;
  }
  const result = computePromo(cart, code);
  if (result.valid) {
    localStorage.setItem('promoCode', code.toUpperCase());
    showPromoMessage(result.message + ` — économie: ${formatPrice(result.discountAmount)}`, true);
  } else {
    localStorage.removeItem('promoCode');
    showPromoMessage(result.message, false);
  }
  renderCartPage();
}

function showPromoMessage(text, success) {
  const el = document.getElementById('promo-message');
  if (!el) return;
  el.textContent = text;
  el.style.color = success ? '#0b6b4f' : '#bb3b3b';
}

function renderCartPage() {
  const cartContainer = document.getElementById('cart-container');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');
  if (!cartContainer || !subtotalEl || !totalEl) return;
  const cart = getCart();
  cartContainer.innerHTML = '';
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p>Votre panier est vide.</p>';
    subtotalEl.textContent = formatPrice(0);
    totalEl.textContent = formatPrice(0);
    showPromoMessage('', false);
    return;
  }
  cart.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    const img = document.createElement('img');
    img.src = item.image || 'https://via.placeholder.com/200x200?text=Produit';
    img.alt = item.name;
    const details = document.createElement('div');
    details.className = 'item-details';
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = item.name;
    const price = document.createElement('div');
    price.className = 'item-price';
    price.textContent = formatPrice(item.price);
    const qty = document.createElement('div');
    qty.className = 'item-qty';
    qty.textContent = `Quantité : ${item.qty}`;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-outline';
    removeBtn.textContent = 'Retirer';
    removeBtn.onclick = () => {
      removeFromCart(item.id);
    };
    details.appendChild(title);
    details.appendChild(price);
    details.appendChild(qty);
    details.appendChild(removeBtn);
    itemEl.appendChild(img);
    itemEl.appendChild(details);
    cartContainer.appendChild(itemEl);
  });
  const subtotal = calculateSubtotal(cart);
  subtotalEl.textContent = formatPrice(subtotal);
  const storedPromo = (localStorage.getItem('promoCode') || '').toUpperCase();
  if (storedPromo) {
    const result = computePromo(cart, storedPromo);
    if (result.valid) {
      totalEl.textContent = formatPrice(result.newTotal);
      showPromoMessage(`Code actif: ${storedPromo} — économie : ${formatPrice(result.discountAmount)}`, true);
      const input = document.getElementById('promo-input');
      if (input) input.value = storedPromo;
    } else {
      localStorage.removeItem('promoCode');
      totalEl.textContent = formatPrice(subtotal);
      showPromoMessage('', false);
    }
  } else {
    totalEl.textContent = formatPrice(subtotal);
    const input = document.getElementById('promo-input');
    if (input) input.value = '';
  }
}

window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.formatPrice = formatPrice;
window.renderCartPage = renderCartPage;
window.applyPromo = applyPromo;
window.clearCart = clearCart;
document.addEventListener('DOMContentLoaded', updateCartCount);
