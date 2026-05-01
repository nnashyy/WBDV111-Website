function openBag() {
    const bag = document.getElementById("bagSidebar");
    if (bag) bag.classList.add("active");
}

function closeBag() {
    const bag = document.getElementById("bagSidebar");
    if (bag) bag.classList.remove("active");
}

function toggleAccountMenu() {
    const menu = document.getElementById("account-menu");
    if (menu) {
        menu.classList.toggle("show");
    }
}

function openOrdersModal() {
    const ordersModal = document.getElementById('ordersModal');
    const accountMenu = document.getElementById('account-menu');

    if (accountMenu) accountMenu.classList.remove('show');
    renderOrders();

    if (ordersModal) {
        ordersModal.classList.add('show');
    }
}

function closeOrdersModal() {
    const ordersModal = document.getElementById('ordersModal');
    if (ordersModal) {
        ordersModal.classList.remove('show');
    }
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function getCurrentUserEmail() {
    return normalizeEmail(localStorage.getItem('currentUserEmail'));
}

function setLoggedInUser(email) {
    const normalizedEmail = normalizeEmail(email);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUserEmail', normalizedEmail);

    const allOrders = getAllOrdersByEmail();
    if (!allOrders[normalizedEmail]) {
        allOrders[normalizedEmail] = [];
        saveAllOrdersByEmail(allOrders);
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUserEmail');
    window.location.reload();
}

function getAllOrdersByEmail() {
    const storedOrders = JSON.parse(localStorage.getItem('userOrdersByEmail')) || {};
    return storedOrders;
}

function saveAllOrdersByEmail(ordersByEmail) {
    localStorage.setItem('userOrdersByEmail', JSON.stringify(ordersByEmail));
}

function migrateLegacyOrders() {
    const legacyOrders = JSON.parse(localStorage.getItem('userOrders'));
    const currentUserEmail = getCurrentUserEmail();

    if (!Array.isArray(legacyOrders) || legacyOrders.length === 0 || !currentUserEmail) {
        return;
    }

    const ordersByEmail = getAllOrdersByEmail();
    if (!Array.isArray(ordersByEmail[currentUserEmail]) || ordersByEmail[currentUserEmail].length === 0) {
        ordersByEmail[currentUserEmail] = legacyOrders;
        saveAllOrdersByEmail(ordersByEmail);
    }

    localStorage.removeItem('userOrders');
}

function getStoredOrders() {
    migrateLegacyOrders();
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) return [];

    const ordersByEmail = getAllOrdersByEmail();
    return Array.isArray(ordersByEmail[currentUserEmail]) ? ordersByEmail[currentUserEmail] : [];
}

function saveStoredOrders(orders) {
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) return;

    const ordersByEmail = getAllOrdersByEmail();
    ordersByEmail[currentUserEmail] = orders;
    saveAllOrdersByEmail(ordersByEmail);
}

function formatCurrency(amount) {
    return `₱${Number(amount || 0).toFixed(2)}`;
}

function formatOrderDate(dateValue) {
    if (!dateValue) return 'Date unavailable';

    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
        return dateValue;
    }

    return parsedDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function parsePrice(value) {
    const numericValue = parseFloat(String(value || '').replace(/[^\d.]/g, ''));
    return Number.isNaN(numericValue) ? 0 : numericValue;
}

function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    const orders = getStoredOrders();

    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="empty-orders">No orders yet for this account. Once you place an order, it will appear here.</p>';
        return;
    }

    ordersList.innerHTML = orders
        .slice()
        .reverse()
        .map(order => {
            const itemsMarkup = (order.items || [])
                .map(item => `
                    <div class="order-item">
                        <div class="order-item-details">
                            <div class="order-item-name">${item.name}</div>
                            <div class="order-item-meta">${formatCurrency(item.price)} each | Qty ${item.quantity}</div>
                        </div>
                        <div class="order-item-total">${formatCurrency(item.total)}</div>
                    </div>
                `)
                .join('');
            
            const orderId = order.orderId || 'BBPT-' + new Date(order.datePlaced).getTime().toString().slice(-5);

            return `
                <div class="order-card">
                    <div class="order-card-header">
                        <div>
                            <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                Order: ${orderId}
                                <button class="copy-id-btn" onclick="copyOrderId('${orderId}')" title="Copy Order ID">📋</button>
                            </h3>
                            <div class="order-meta">Customer: ${order.customerName}</div>
                            <div class="order-meta">Date: ${formatOrderDate(order.datePlaced)}</div>
                            <div class="order-meta">Payment: ${order.paymentMethod}</div>
                        </div>
                        <div class="order-total">${formatCurrency(order.total)}</div>
                    </div>
                    <div class="order-items">${itemsMarkup}</div>
                </div>
            `;
        })
        .join('');
}

function openTerms(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('termsModal');
    if (modal) modal.classList.add('show');
}

function closeTerms() {
    const modal = document.getElementById('termsModal');
    if (modal) modal.classList.remove('show');
}

function acceptTerms() {
    const checkbox = document.getElementById('terms-checkbox');
    if (checkbox) checkbox.checked = true;
    closeTerms();
}

document.addEventListener("click", function (event) {
    const accountBtn = document.querySelector(".account-btn");
    const accountMenu = document.getElementById("account-menu");
    if (accountMenu && accountMenu.classList.contains('show') &&
        accountBtn && !accountBtn.contains(event.target) &&
        !accountMenu.contains(event.target)) {
        accountMenu.classList.remove('show');
    }

    const bagSidebar = document.getElementById("bagSidebar");
    const bagButton = document.querySelector(".my-bag");

    const clickIsOutsideSidebar = (!bagSidebar || !bagSidebar.contains(event.target)) &&
        (!bagButton || !bagButton.contains(event.target)) &&
        !event.target.classList.contains('remove-item') &&
        !event.target.classList.contains('quantity-button') &&
        event.target.id !== 'empty-cart-btn';

    if (clickIsOutsideSidebar) {
        if (bagSidebar && bagSidebar.classList.contains('active')) closeBag();
    }

    const termsModal = document.getElementById('termsModal');
    if (termsModal && event.target === termsModal) {
        closeTerms();
    }

    const productModal = document.getElementById('productModal');
    if (productModal && event.target === productModal) {
        productModal.classList.remove('show');
    }

    const ordersModal = document.getElementById('ordersModal');
    if (ordersModal && event.target === ordersModal) {
        closeOrdersModal();
    }
});

function showToast() {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.classList.add("show");
        setTimeout(function() {
            toast.classList.remove("show");
        }, 2500);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    migrateLegacyOrders();

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const accountDropdown = document.getElementById('account-dropdown');
    const loginBtnNav = document.getElementById('login-btn-nav');

    if (isLoggedIn) {
        if (accountDropdown) accountDropdown.style.display = 'inline-block';
        if (loginBtnNav) loginBtnNav.style.display = 'none';
    } else {
        if (accountDropdown) accountDropdown.style.display = 'none';
        if (loginBtnNav) loginBtnNav.style.display = 'flex';
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (!loginForm.reportValidity()) return;

            const emailInput = document.getElementById('email');
            setLoggedInUser(emailInput ? emailInput.value : '');
            window.location.href = 'shop.html';
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (!signupForm.reportValidity()) return;

            const emailInput = document.getElementById('email');
            setLoggedInUser(emailInput ? emailInput.value : '');
            window.location.href = 'shop.html';
        });
    }

    const footer = document.getElementById('footer-credits');
    if (footer) {
        footer.style.display = 'none';

        function checkScrollPosition() {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;

            if (scrollPosition + windowHeight >= scrollHeight - 10) {
                footer.style.display = 'block';
            } else {
                footer.style.display = 'none';
            }
        }

        window.addEventListener('scroll', checkScrollPosition);
        window.addEventListener('resize', checkScrollPosition);
        checkScrollPosition();
    }

    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardDetails = document.getElementById('card-details');

    if (paymentRadios.length > 0 && cardDetails) {
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const cardInputs = cardDetails.querySelectorAll('input');
                if (this.value === 'card') {
                    cardDetails.style.display = 'block';
                    cardInputs.forEach(input => input.required = true);
                } else {
                    cardDetails.style.display = 'none';
                    cardInputs.forEach(input => input.required = false);
                }
            });
        });
    }

    const MAX_QUANTITY = 10;
    let cart = JSON.parse(localStorage.getItem('userCart')) || [];

    function placeOrder() {
        const checkoutForm = document.getElementById('checkout-form');
        if (!checkoutForm) return;

        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        const checkoutEmail = normalizeEmail(document.getElementById('email')?.value);
        if (checkoutEmail) {
            setLoggedInUser(checkoutEmail);
        }

        const paymentField = document.querySelector('input[name="payment"]:checked');
        let selectedPayment = 'Credit/Debit Card';
        if (paymentField) {
            if (paymentField.value === 'cod') selectedPayment = 'Cash on Delivery';
            else if (paymentField.value === 'gcash') selectedPayment = 'GCash/E-Wallet';
        }

        const shippingFee = 50;
        let subtotal = 0;

        const orderItems = cart.map(item => {
            const price = parsePrice(item.price);
            const total = price * item.quantity;
            subtotal += total;

            return {
                name: item.name,
                price,
                quantity: item.quantity,
                total
            };
        });

        const orders = getStoredOrders();
        orders.push({
            orderId: 'BBPT-' + Math.floor(10000 + Math.random() * 90000),
            customerName: document.getElementById('fname')?.value.trim() || 'Customer',
            customerEmail: checkoutEmail || getCurrentUserEmail(),
            shippingAddress: document.getElementById('address')?.value.trim() || '',
            city: document.getElementById('city')?.value.trim() || '',
            zipCode: document.getElementById('zip')?.value.trim() || '',
            paymentMethod: selectedPayment,
            datePlaced: new Date().toISOString(),
            subtotal,
            shippingFee,
            total: subtotal + shippingFee,
            items: orderItems
        });

        saveStoredOrders(orders);
        localStorage.removeItem('userCart');
        alert('Order placed successfully!');
        window.location.href = 'shop.html';
    }

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(event) {
            event.preventDefault();

            if (!checkoutForm.reportValidity()) return;

            placeOrder();
        });
    }

    const productModal = document.getElementById('productModal');
    const closeProductModalBtn = document.querySelector('.close-product-modal');

    if (closeProductModalBtn && productModal) {
        closeProductModalBtn.addEventListener('click', function() {
            productModal.classList.remove('show');
        });
    }

    document.querySelectorAll('.product').forEach(product => {
        product.addEventListener('click', function () {
            const name = this.dataset.name;
            const description = this.dataset.description || "No description available.";
            const sizes = this.dataset.sizes || "Standard";
            const imgSrc = this.querySelector('img').src;

            let price = "₱0.00";
            const priceElement = this.querySelector('.product-price');
            if (priceElement) {
                price = priceElement.textContent;
            }

            document.getElementById('modal-product-image').src = imgSrc;
            document.getElementById('modal-product-title').textContent = name;
            document.getElementById('modal-product-price').textContent = price;
            document.getElementById('modal-product-description').textContent = description;
            document.getElementById('modal-product-sizes').textContent = sizes;

            const modalAddToCartBtn = document.getElementById('modal-add-to-cart');
            const newBtn = modalAddToCartBtn.cloneNode(true);
            modalAddToCartBtn.parentNode.replaceChild(newBtn, modalAddToCartBtn);

            newBtn.addEventListener('click', function() {
                const existingItem = cart.find(item => item.name === name);

                if (existingItem) {
                    if (existingItem.quantity < MAX_QUANTITY) {
                        existingItem.quantity++;
                    } else {
                        alert("Maximum limit of " + MAX_QUANTITY + " items reached for this product.");
                        return;
                    }
                } else {
                    cart.push({ name, image: imgSrc, price, quantity: 1 });
                }
                updateCart();
                showToast();
                if (productModal) productModal.classList.remove('show');
            });

            if (productModal) productModal.classList.add('show');
        });
    });

    const emptyCartBtn = document.getElementById('empty-cart-btn');
    if (emptyCartBtn) {
        emptyCartBtn.addEventListener('click', function() {
            cart = [];
            updateCart();
        });
    }

    function updateCart() {
        const cartItemsList = document.getElementById('cart-items');
        const emptyCartMessage = document.getElementById('empty-cart');
        const checkoutButton = document.getElementById('checkout-button');
        const emptyButton = document.getElementById('empty-cart-btn');

        localStorage.setItem('userCart', JSON.stringify(cart));

        if (cartItemsList) {
            cartItemsList.innerHTML = '';

            if (cart.length === 0) {
                if (emptyCartMessage) emptyCartMessage.style.display = 'block';
                if (checkoutButton) checkoutButton.style.display = 'none';
                if (emptyButton) emptyButton.style.display = 'none';
            } else {
                if (emptyCartMessage) emptyCartMessage.style.display = 'none';
                if (checkoutButton) checkoutButton.style.display = 'block';
                if (emptyButton) emptyButton.style.display = 'block';

                cart.forEach((item, index) => {
                    const listItem = document.createElement('li');
                    listItem.style.display = 'flex';
                    listItem.style.alignItems = 'center';
                    listItem.style.marginBottom = '15px';

                    listItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; border-radius: 5px; margin-right: 10px; object-fit: cover;">
                        <span style="flex: 1; font-size: 14px; font-weight: bold; color: #1B3A57; line-height: 1.2; padding-right: 10px;">${item.name}</span>
                        <div style="display: flex; align-items: center; margin-right: 10px;">
                            <button class="quantity-button" data-index="${index}" data-action="decrease" style="background-color: #A1DDF3; border: none; padding: 5px 8px; cursor: pointer; border-radius: 5px; color: #1B3A57; font-weight: bold;">-</button>
                            <span style="margin: 0 8px; color: #1B3A57; font-weight: bold;">${item.quantity}</span>
                            <button class="quantity-button" data-index="${index}" data-action="increase" style="background-color: #F973A9; border: none; padding: 5px 8px; cursor: pointer; border-radius: 5px; color: white; font-weight: bold;">+</button>
                        </div>
                        <span class="remove-item" data-index="${index}" style="cursor: pointer; color: #F973A9; font-size: 16px;">x</span>
                    `;
                    cartItemsList.appendChild(listItem);
                });
            }
        }

        renderCheckout();
    }

    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-item')) {
                const indexToRemove = parseInt(event.target.dataset.index, 10);
                cart.splice(indexToRemove, 1);
                updateCart();
            } else if (event.target.classList.contains('quantity-button')) {
                const index = parseInt(event.target.dataset.index, 10);
                const action = event.target.dataset.action;
                if (action === 'increase') {
                    if (cart[index].quantity < MAX_QUANTITY) {
                        cart[index].quantity++;
                    } else {
                        alert("Maximum limit of " + MAX_QUANTITY + " items reached for this product.");
                    }
                } else if (action === 'decrease') {
                    if (cart[index].quantity > 1) {
                        cart[index].quantity--;
                    } else {
                        cart.splice(index, 1);
                    }
                }
                updateCart();
            }
        });
    }

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('mouseover', function () {
            this.style.transform = 'scale(1.05)';
        });
        checkoutButton.addEventListener('mouseout', function () {
            this.style.transform = 'scale(1)';
        });
        checkoutButton.addEventListener('mousedown', function () {
            this.style.transform = 'scale(0.95)';
        });
        checkoutButton.addEventListener('mouseup', function () {
            this.style.transform = 'scale(1.05)';
        });
        checkoutButton.addEventListener('click', function () {
            if (localStorage.getItem('isLoggedIn') === 'true') {
                window.location.href = 'checkout.html';
            } else {
                alert("Please log in or sign up to proceed to checkout.");
                window.location.href = 'login.html';
            }
        });
    }

    function renderCheckout() {
        const summaryItemsContainer = document.getElementById('summary-items');
        const subtotalElement = document.getElementById('summary-subtotal');
        const totalElement = document.getElementById('summary-total');

        if (!summaryItemsContainer) return;

        const shippingFee = 50.00;
        summaryItemsContainer.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            summaryItemsContainer.innerHTML = '<p style="text-align: center; color: #888;">Your cart is empty.</p>';
            if (subtotalElement) subtotalElement.textContent = formatCurrency(0);
            if (totalElement) totalElement.textContent = formatCurrency(0);
            const orderBtn = document.querySelector('.place-order-btn');
            if (orderBtn) {
                orderBtn.disabled = true;
                orderBtn.style.opacity = '0.5';
                orderBtn.style.cursor = 'not-allowed';
            }
            return;
        }

        const orderBtn = document.querySelector('.place-order-btn');
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.style.opacity = '1';
            orderBtn.style.cursor = 'pointer';
        }

        cart.forEach(item => {
            const priceNumber = parsePrice(item.price);
            const itemTotal = priceNumber * item.quantity;
            subtotal += itemTotal;

            const itemRow = document.createElement('div');
            itemRow.className = 'checkout-product-row';
            itemRow.innerHTML = `
                <div class="checkout-product-title">${item.name} - ${formatCurrency(priceNumber)}</div>
                <div class="checkout-product-qty">x${item.quantity}</div>
                <div class="checkout-product-total">${formatCurrency(itemTotal)}</div>
            `;
            summaryItemsContainer.appendChild(itemRow);
        });

        if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
        if (totalElement) totalElement.textContent = formatCurrency(subtotal + shippingFee);
    }

    updateCart();
    renderOrders();
});