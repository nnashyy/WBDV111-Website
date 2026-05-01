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

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.reload(); 
}

function toggleCardDetails() {
    const cardDetails = document.getElementById('card-details');
    const cardRadio = document.querySelector('input[value="card"]');
    
    if (cardDetails && cardRadio) {
        const cardInputs = cardDetails.querySelectorAll('input');
        if (cardRadio.checked) {
            cardDetails.style.display = 'block';
            cardInputs.forEach(input => input.required = true);
        } else {
            cardDetails.style.display = 'none';
            cardInputs.forEach(input => input.required = false);
        }
    }
}

function openTerms(event) {
    if(event) event.preventDefault();
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
    let accountBtn = document.querySelector(".account-btn");
    let accountMenu = document.getElementById("account-menu");
    if (accountMenu && accountMenu.classList.contains('show') && 
        accountBtn && !accountBtn.contains(event.target) && 
        !accountMenu.contains(event.target)) {
        accountMenu.classList.remove('show');
    }

    let bagSidebar = document.getElementById("bagSidebar");
    let bagButton = document.querySelector(".my-bag");

    let clickIsOutsideSidebar = (!bagSidebar || !bagSidebar.contains(event.target)) &&
        (!bagButton || !bagButton.contains(event.target)) &&
        !event.target.classList.contains('remove-item') &&
        !event.target.classList.contains('quantity-button') &&
        event.target.id !== 'empty-cart-btn';

    if (clickIsOutsideSidebar) {
        if (bagSidebar && bagSidebar.classList.contains('active')) closeBag();
    }

    let termsModal = document.getElementById('termsModal');
    if (termsModal && event.target === termsModal) {
        closeTerms();
    }

    let productModal = document.getElementById('productModal');
    if (productModal && event.target === productModal) {
        productModal.classList.remove('show');
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

    const MAX_QUANTITY = 10;
    
    let cart = JSON.parse(localStorage.getItem('userCart')) || [];

    const productModal = document.getElementById('productModal');
    const closeProductModalBtn = document.querySelector('.close-product-modal');

    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', function() {
            productModal.classList.remove('show');
        });
    }

    document.querySelectorAll('.product').forEach(product => {
        product.addEventListener('click', function (e) {
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
                    cart.push({ name: name, image: imgSrc, price: price, quantity: 1 });
                }
                updateCart();
                showToast();
                productModal.classList.remove('show');
            });

            productModal.classList.add('show');
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
                        <span class="remove-item" data-index="${index}" style="cursor: pointer; color: #F973A9; font-size: 16px;">✖</span>
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
                const indexToRemove = parseInt(event.target.dataset.index);
                cart.splice(indexToRemove, 1);
                updateCart();
            } else if (event.target.classList.contains('quantity-button')) {
                const index = parseInt(event.target.dataset.index);
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
            if(subtotalElement) subtotalElement.textContent = '₱0.00';
            if(totalElement) totalElement.textContent = '₱0.00';
            const orderBtn = document.querySelector('.place-order-btn');
            if(orderBtn) {
                orderBtn.disabled = true;
                orderBtn.style.opacity = '0.5';
                orderBtn.style.cursor = 'not-allowed';
            }
            return;
        }

        cart.forEach(item => {
            let priceStr = item.price ? String(item.price) : "₱0.00";
            let priceNumber = parseFloat(priceStr.replace(/[^\d.]/g, ''));
            if (isNaN(priceNumber)) priceNumber = 0;
            
            let itemTotal = priceNumber * item.quantity;
            subtotal += itemTotal;

            const itemRow = document.createElement('div');
            itemRow.className = 'checkout-product-row';
            itemRow.innerHTML = `
                <div class="checkout-product-title">${item.name} - ₱${priceNumber.toFixed(2)}</div>
                <div class="checkout-product-qty">x${item.quantity}</div>
                <div class="checkout-product-total">₱${itemTotal.toFixed(2)}</div>
            `;
            summaryItemsContainer.appendChild(itemRow);
        });

        if(subtotalElement) subtotalElement.textContent = `₱${subtotal.toFixed(2)}`;
        if(totalElement) totalElement.textContent = `₱${(subtotal + shippingFee).toFixed(2)}`;
    }

    updateCart();
});