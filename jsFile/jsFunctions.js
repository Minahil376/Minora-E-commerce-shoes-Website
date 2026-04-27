// =========================================================
// HAMBURGER MENU TOGGLE
// =========================================================
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navMenu.classList.toggle('open');
            menuToggle.classList.toggle('active');
        });

        navMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navMenu.classList.remove('open');
                menuToggle.classList.remove('active');
            });
        });

        document.addEventListener('click', function (e) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target) && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                menuToggle.classList.remove('active');
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                menuToggle.classList.remove('active');
            }
        });
    }

    const currentLocation = location.pathname;
    document.querySelectorAll('.nav-menu a').forEach(function (link) {
        if (
            link.getAttribute('href') === currentLocation ||
            link.getAttribute('href') === currentLocation.split('/').pop() ||
            (currentLocation === '/' && link.getAttribute('href') === 'index.html')
        ) {
            link.classList.add('active');
        }
    });
});

// =========================================================
// SHOPPING CART MANAGEMENT
// =========================================================

const CartManager = {
    getCart: function () {
        const cart = localStorage.getItem('minora_cart');
        return cart ? JSON.parse(cart) : [];
    },

    saveCart: function (cart) {
        localStorage.setItem('minora_cart', JSON.stringify(cart));
    },

    addToCart: function (product) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: parseFloat(product.price),
                image: product.image,
                quantity: product.quantity || 1
            });
        }

        this.saveCart(cart);
        this.updateCartBadge();
        this.showToast(product.title + ' added to cart!');
        return true;
    },

    removeFromCart: function (productId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== productId);
        this.saveCart(cart);
        this.updateCartBadge();
    },

    updateQuantity: function (productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart(cart);
                this.updateCartBadge();
            }
        }
    },

    updateCartBadge: function () {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = totalItems;
        });
    },

    calculateTotals: function () {
        const cart = this.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = subtotal * (typeof appliedDiscount !== 'undefined' ? appliedDiscount : 0);
        const discountedSubtotal = subtotal - discount;
        const tax = discountedSubtotal * 0.1;
        const shipping = discountedSubtotal > 50 ? 0 : 10;
        const total = discountedSubtotal + tax + shipping;
        return {
            subtotal: subtotal.toFixed(2),
            discount: discount.toFixed(2),
            tax: tax.toFixed(2),
            shipping: shipping.toFixed(2),
            total: total.toFixed(2)
        };
    },

    showToast: function (message) {
        let toast = document.getElementById('cart-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cart-toast';
            toast.style.cssText = [
                'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
                'background:var(--brand-primary-color,#111)', 'color:#fff',
                'padding:12px 20px', 'border-radius:8px', 'font-size:0.9rem',
                'box-shadow:0 4px 16px rgba(0,0,0,0.2)', 'transition:opacity 0.3s',
                'opacity:0', 'pointer-events:none'
            ].join(';');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    }
};

// =========================================================
// ADD TO CART — event delegation for all product pages
// =========================================================
document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="add-to-cart"]');
    if (!btn) return;

    const product = {
        id: parseInt(btn.dataset.id),
        title: btn.dataset.title,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image
    };

    CartManager.addToCart(product);

    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
    }, 1200);
});

// =========================================================
// CART PAGE RENDER
// =========================================================
document.addEventListener('DOMContentLoaded', function () {
    CartManager.updateCartBadge();
    renderCartPage();
});

function renderCartPage() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (!cartItemsContainer) return;

    const cart = CartManager.getCart();
    const cartTable = document.getElementById('cart-table');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        if (cartTable) cartTable.style.display = 'none';
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (taxEl) taxEl.textContent = '$0.00';
        if (shippingEl) shippingEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00';
        return;
    }

    if (cartTable) cartTable.style.display = 'table';
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';

    cart.forEach(function (item) {
        var row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-secondary-color)';
        row.innerHTML =
            '<td style="padding:20px;text-align:center;vertical-align:middle;">' +
                '<button class="remove-btn" data-id="' + item.id + '" ' +
                        'style="background:transparent;border:none;cursor:pointer;color:var(--text-muted-color);font-size:1.4rem;line-height:1;transition:color 0.2s;" ' +
                        'title="Remove item">' +
                    '<i class="fa-regular fa-circle-xmark"></i>' +
                '</button>' +
            '</td>' +
            '<td style="padding:20px;vertical-align:middle;">' +
                '<img src="../sources/' + (item.image || 'placeholder.png') + '" alt="' + item.title + '" ' +
                     'style="width:80px;height:80px;object-fit:contain;background:transparent;border-radius:var(--radius-md);padding:6px;display:block;">' +
            '</td>' +
            '<td style="padding:20px;vertical-align:middle;">' +
                '<span style="font-weight:600;color:var(--brand-primary-color);display:block;margin-bottom:4px;">' + item.title + '</span>' +
                '<span style="font-size:0.8rem;color:var(--text-muted-color);">ID: #' + item.id + '</span>' +
            '</td>' +
            '<td style="padding:20px;text-align:center;vertical-align:middle;font-weight:600;color:var(--text-primary-color);">' +
                '$' + parseFloat(item.price).toFixed(2) +
            '</td>' +
            '<td style="padding:20px;text-align:center;vertical-align:middle;">' +
                '<div style="display:inline-flex;align-items:center;background:#eef0f3;border-radius:12px;padding:4px;gap:4px;">' +
                    '<button class="qty-btn" data-id="' + item.id + '" data-action="decrease" ' +
                            'style="width:36px;height:36px;background:#e2e5ea;border:none;cursor:pointer;color:#333;font-size:1.1rem;font-weight:700;border-radius:8px;transition:background 0.2s;">&#8722;</button>' +
                    '<input type="number" class="qty-input" data-id="' + item.id + '" value="' + item.quantity + '" min="1" ' +
                           'style="width:48px;height:36px;text-align:center;border:none;background:#fff;font-weight:600;color:#333;font-size:0.95rem;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">' +
                    '<button class="qty-btn" data-id="' + item.id + '" data-action="increase" ' +
                            'style="width:36px;height:36px;background:#e2e5ea;border:none;cursor:pointer;color:#333;font-size:1.1rem;font-weight:700;border-radius:8px;transition:background 0.2s;">+</button>' +
                '</div>' +
            '</td>' +
            '<td style="padding:20px;text-align:center;vertical-align:middle;font-weight:700;color:var(--brand-secondary-color);">' +
                '$' + (item.price * item.quantity).toFixed(2) +
            '</td>';
        cartItemsContainer.appendChild(row);
    });

    var totals = CartManager.calculateTotals();
    if (subtotalEl) subtotalEl.textContent = '$' + totals.subtotal;
    if (taxEl) taxEl.textContent = '$' + totals.tax;
    if (shippingEl) {
        shippingEl.textContent = totals.shipping === '0.00' ? 'FREE' : '$' + totals.shipping;
        shippingEl.style.color = totals.shipping === '0.00' ? 'var(--brand-third-color)' : '';
    }
    if (totalEl) totalEl.textContent = '$' + totals.total;

    var discountRow = document.getElementById('discount-row');
    var discountAmountEl = document.getElementById('discount-amount');
    if (discountRow && discountAmountEl) {
        if (parseFloat(totals.discount) > 0) {
            discountRow.style.display = 'flex';
            discountAmountEl.textContent = '-$' + totals.discount;
        } else {
            discountRow.style.display = 'none';
        }
    }

    attachCartEventListeners();
}

function attachCartEventListeners() {
    document.querySelectorAll('.remove-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            CartManager.removeFromCart(parseInt(this.dataset.id));
            renderCartPage();
        });
    });

    document.querySelectorAll('.qty-input').forEach(function (input) {
        input.addEventListener('change', function () {
            var qty = parseInt(this.value);
            if (qty > 0) {
                CartManager.updateQuantity(parseInt(this.dataset.id), qty);
                renderCartPage();
            }
        });
    });

    document.querySelectorAll('.qty-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var productId = parseInt(this.dataset.id);
            var action = this.dataset.action;
            var cart = CartManager.getCart();
            var item = cart.find(function (i) { return i.id === productId; });
            if (item) {
                if (action === 'increase') {
                    CartManager.updateQuantity(productId, item.quantity + 1);
                } else if (action === 'decrease' && item.quantity > 1) {
                    CartManager.updateQuantity(productId, item.quantity - 1);
                }
                renderCartPage();
            }
        });
    });

    // Hover effect on remove buttons
    document.querySelectorAll('.remove-btn').forEach(function (btn) {
        btn.addEventListener('mouseover', function () {
            this.style.color = 'var(--brand-secondary-color)';
        });
        btn.addEventListener('mouseout', function () {
            this.style.color = 'var(--text-muted-color)';
        });
    });
}

// =========================================================
// CHECKOUT BUTTON
// =========================================================
document.addEventListener('DOMContentLoaded', function () {
    var checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            var cart = CartManager.getCart();
            if (cart.length === 0) {
                alert('Your cart is empty');
                return;
            }
            alert('Thank you for your order! This is a demo — payment processing would happen here.');
        });
    }
});

// =========================================================
// COUPON CODE
// =========================================================
var COUPONS = {
    'SAVE10':  0.10,
    'MINORA20': 0.20,
    'WELCOME15': 0.15
};

var appliedDiscount = 0;

document.addEventListener('DOMContentLoaded', function () {
    var couponBtn = document.getElementById('coupon-btn');
    if (!couponBtn) return;

    couponBtn.addEventListener('click', function () {
        var input = document.getElementById('coupon-input');
        var msg   = document.getElementById('coupon-msg');
        var code  = input.value.trim().toUpperCase();

        if (!code) {
            showCouponMsg(msg, 'Please enter a coupon code.', '#e74c3c');
            return;
        }

        if (COUPONS[code] !== undefined) {
            appliedDiscount = COUPONS[code];
            showCouponMsg(msg, 'Coupon applied! ' + (appliedDiscount * 100) + '% discount.', 'var(--brand-third-color)');
            input.disabled = true;
            couponBtn.textContent = 'Applied';
            couponBtn.style.opacity = '0.6';
            couponBtn.disabled = true;
            renderCartPage();
        } else {
            appliedDiscount = 0;
            showCouponMsg(msg, 'Invalid coupon code. Try SAVE10, MINORA20 or WELCOME15.', '#e74c3c');
            renderCartPage();
        }
    });
});

function showCouponMsg(el, text, color) {
    el.textContent = text;
    el.style.color = color;
    el.style.display = 'block';
}
