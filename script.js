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

function formatPdfCurrency(amount) {
    return `PHP ${Number(amount || 0).toFixed(2)}`;
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

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parsePrice(value) {
    const numericValue = parseFloat(String(value || '').replace(/[^\d.]/g, ''));
    return Number.isNaN(numericValue) ? 0 : numericValue;
}

function getOrderId(order) {
    return order.orderId || 'BBPT-' + new Date(order.datePlaced).getTime().toString().slice(-5);
}

function getInvoiceNumber(order) {
    const orderId = getOrderId(order);
    return order.invoiceNumber || `INV-${orderId.replace(/^BBPT-/, '')}`;
}

function getInvoiceHtml(order) {
    const orderId = getOrderId(order);
    const invoiceNumber = getInvoiceNumber(order);
    const items = Array.isArray(order.items) ? order.items : [];
    const subtotal = Number(order.subtotal || items.reduce((sum, item) => sum + Number(item.total || 0), 0));
    const shippingFee = Number(order.shippingFee || 0);
    const total = Number(order.total || subtotal + shippingFee);
    const fullAddress = [order.shippingAddress, order.city, order.zipCode].filter(Boolean).join(', ');
    const itemRows = items.map(item => `
        <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${formatPdfCurrency(item.price)}</td>
            <td>${escapeHtml(item.quantity)}</td>
            <td>${formatPdfCurrency(item.total)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Invoice ${escapeHtml(invoiceNumber)}</title>
            <style>
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 32px;
                    color: #1b3a57;
                    font-family: Arial, sans-serif;
                    background: #ffffff;
                }
                .invoice {
                    max-width: 820px;
                    margin: 0 auto;
                    border: 1px solid #d9e9ef;
                    padding: 34px;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 24px;
                    border-bottom: 3px solid #48c6c4;
                    padding-bottom: 22px;
                    margin-bottom: 24px;
                }
                h1, h2, h3, p { margin: 0; }
                h1 { color: #f973a9; font-size: 30px; }
                .brand { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
                .muted { color: #5d7186; line-height: 1.5; }
                .meta { text-align: right; line-height: 1.7; }
                .billing {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin-bottom: 26px;
                }
                .panel {
                    border: 1px solid #e5f1f4;
                    padding: 16px;
                    background: #fdfefe;
                }
                .panel h3 { font-size: 15px; margin-bottom: 10px; color: #48c6c4; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 24px;
                }
                th {
                    background: #eefbff;
                    color: #1b3a57;
                    text-align: left;
                    padding: 12px;
                    border-bottom: 1px solid #d9e9ef;
                }
                td {
                    padding: 12px;
                    border-bottom: 1px solid #eef5f8;
                    vertical-align: top;
                }
                th:nth-child(2), th:nth-child(3), th:nth-child(4),
                td:nth-child(2), td:nth-child(3), td:nth-child(4) {
                    text-align: right;
                    white-space: nowrap;
                }
                .totals {
                    width: 300px;
                    margin-left: auto;
                    line-height: 2;
                }
                .totals div {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #eef5f8;
                }
                .totals .grand-total {
                    color: #f973a9;
                    font-weight: 700;
                    font-size: 18px;
                    border-bottom: 0;
                }
                .thank-you {
                    margin-top: 32px;
                    padding-top: 18px;
                    border-top: 1px solid #d9e9ef;
                    color: #5d7186;
                }
                @media print {
                    body { padding: 0; }
                    .invoice { border: 0; }
                }
            </style>
        </head>
        <body>
            <main class="invoice">
                <section class="invoice-header">
                    <div>
                        <p class="brand">Babies Baby Products Trading</p>
                        <p class="muted">Baby essentials, comfort items, and family care products</p>
                    </div>
                    <div class="meta">
                        <h1>Invoice</h1>
                        <p><strong>${escapeHtml(invoiceNumber)}</strong></p>
                        <p>Order: ${escapeHtml(orderId)}</p>
                        <p>${escapeHtml(formatOrderDate(order.datePlaced))}</p>
                    </div>
                </section>

                <section class="billing">
                    <div class="panel">
                        <h3>Billed To</h3>
                        <p>${escapeHtml(order.customerName || 'Customer')}</p>
                        <p class="muted">${escapeHtml(order.customerEmail || '')}</p>
                    </div>
                    <div class="panel">
                        <h3>Shipping Details</h3>
                        <p>${escapeHtml(fullAddress || 'Address unavailable')}</p>
                        <p class="muted">Payment: ${escapeHtml(order.paymentMethod || 'Payment unavailable')}</p>
                    </div>
                </section>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>

                <section class="totals">
                    <div><span>Subtotal</span><strong>${formatPdfCurrency(subtotal)}</strong></div>
                    <div><span>Shipping</span><strong>${formatPdfCurrency(shippingFee)}</strong></div>
                    <div class="grand-total"><span>Total</span><strong>${formatPdfCurrency(total)}</strong></div>
                </section>

                <p class="thank-you">Thank you for shopping with Babies Baby Products Trading.</p>
            </main>
        </body>
        </html>
    `;
}

function getInvoiceFileName(order) {
    return `${getInvoiceNumber(order)}-${getOrderId(order)}.pdf`.replace(/[^a-z0-9_.-]/gi, '-');
}

function drawInvoicePdf(doc, order) {
    const orderId = getOrderId(order);
    const invoiceNumber = getInvoiceNumber(order);
    const items = Array.isArray(order.items) ? order.items : [];
    const subtotal = Number(order.subtotal || items.reduce((sum, item) => sum + Number(item.total || 0), 0));
    const shippingFee = Number(order.shippingFee || 0);
    const total = Number(order.total || subtotal + shippingFee);
    const fullAddress = [order.shippingAddress, order.city, order.zipCode].filter(Boolean).join(', ') || 'Address unavailable';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    let y = 18;

    function addWrappedText(text, x, startY, maxWidth, lineHeight) {
        const lines = doc.splitTextToSize(String(text || ''), maxWidth);
        doc.text(lines, x, startY);
        return startY + (lines.length * lineHeight);
    }

    function addPageIfNeeded(nextBlockHeight) {
        if (y + nextBlockHeight <= pageHeight - margin) return;
        doc.addPage();
        y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(249, 115, 169);
    doc.text('Babies Baby Products Trading', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(91, 109, 125);
    doc.text('Baby essentials, comfort items, and family care products', margin, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(27, 58, 87);
    doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(invoiceNumber, pageWidth - margin, y + 8, { align: 'right' });
    doc.text(`Order: ${orderId}`, pageWidth - margin, y + 14, { align: 'right' });
    doc.text(formatOrderDate(order.datePlaced), pageWidth - margin, y + 20, { align: 'right' });

    y += 30;
    doc.setDrawColor(72, 198, 196);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(72, 198, 196);
    doc.text('Billed To', margin, y);
    doc.text('Shipping Details', pageWidth / 2 + 6, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(27, 58, 87);
    y += 7;
    const leftY = addWrappedText(order.customerName || 'Customer', margin, y, 76, 5);
    doc.setTextColor(91, 109, 125);
    const emailY = addWrappedText(order.customerEmail || '', margin, leftY, 76, 5);

    doc.setTextColor(27, 58, 87);
    const rightY = addWrappedText(fullAddress, pageWidth / 2 + 6, y, 76, 5);
    doc.setTextColor(91, 109, 125);
    const paymentY = addWrappedText(`Payment: ${order.paymentMethod || 'Payment unavailable'}`, pageWidth / 2 + 6, rightY, 76, 5);
    y = Math.max(emailY, paymentY) + 8;

    const columns = [
        { title: 'Item', x: margin, width: 78, align: 'left' },
        { title: 'Price', x: 112, width: 24, align: 'right' },
        { title: 'Qty', x: 142, width: 16, align: 'right' },
        { title: 'Total', x: pageWidth - margin, width: 28, align: 'right' }
    ];

    addPageIfNeeded(24);
    doc.setFillColor(238, 251, 255);
    doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(27, 58, 87);
    columns.forEach(column => doc.text(column.title, column.x, y + 7, { align: column.align }));
    y += 14;

    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
        const nameLines = doc.splitTextToSize(String(item.name || 'Item'), columns[0].width);
        const rowHeight = Math.max(10, nameLines.length * 5 + 5);
        addPageIfNeeded(rowHeight + 4);

        doc.setTextColor(27, 58, 87);
        doc.text(nameLines, columns[0].x, y);
        doc.text(formatPdfCurrency(item.price), columns[1].x, y, { align: 'right' });
        doc.text(String(item.quantity || 0), columns[2].x, y, { align: 'right' });
        doc.text(formatPdfCurrency(item.total), columns[3].x, y, { align: 'right' });

        y += rowHeight;
        doc.setDrawColor(238, 245, 248);
        doc.line(margin, y - 4, pageWidth - margin, y - 4);
    });

    y += 4;
    addPageIfNeeded(32);
    const labelX = pageWidth - 72;
    const valueX = pageWidth - margin;
    doc.setFontSize(10);
    doc.setTextColor(27, 58, 87);
    doc.text('Subtotal', labelX, y);
    doc.text(formatPdfCurrency(subtotal), valueX, y, { align: 'right' });
    y += 7;
    doc.text('Shipping', labelX, y);
    doc.text(formatPdfCurrency(shippingFee), valueX, y, { align: 'right' });
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(249, 115, 169);
    doc.text('Total', labelX, y);
    doc.text(formatPdfCurrency(total), valueX, y, { align: 'right' });

    y += 16;
    doc.setDrawColor(217, 233, 239);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(91, 109, 125);
    doc.text('Thank you for shopping with Babies Baby Products Trading.', margin, y);
}

function createInvoicePdfDocument(order) {
    const jsPdfLibrary = window.jspdf && window.jspdf.jsPDF;

    if (!jsPdfLibrary) {
        return null;
    }

    const doc = new jsPdfLibrary({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    drawInvoicePdf(doc, order);
    return doc;
}

function downloadInvoicePdf(order) {
    const doc = createInvoicePdfDocument(order);
    if (!doc) return false;

    doc.save(getInvoiceFileName(order));
    return true;
}

function previewInvoicePdf(order) {
    const doc = createInvoicePdfDocument(order);
    if (!doc) return false;

    const pdfUrl = URL.createObjectURL(doc.output('blob'));
    const previewWindow = window.open(pdfUrl, '_blank');

    if (!previewWindow) {
        URL.revokeObjectURL(pdfUrl);
        return false;
    }

    return true;
}

function openPrintableInvoice(order) {
    const invoiceWindow = window.open('', '_blank', 'width=900,height=700');
    if (!invoiceWindow) return false;

    invoiceWindow.document.open();
    invoiceWindow.document.write(getInvoiceHtml(order));
    invoiceWindow.document.close();
    invoiceWindow.focus();
    setTimeout(function() {
        invoiceWindow.print();
    }, 300);
    return true;
}

function generateInvoicePdf(orderId) {
    const order = getStoredOrders().find(storedOrder => getOrderId(storedOrder) === orderId);
    if (!order) {
        alert('Invoice details could not be found for this order.');
        return;
    }

    if (!downloadInvoicePdf(order) && !openPrintableInvoice(order)) {
        alert('Invoice could not be opened. Please allow pop-ups or check your connection and try again.');
        return;
    }
}

function previewInvoicePdfById(orderId) {
    const order = getStoredOrders().find(storedOrder => getOrderId(storedOrder) === orderId);
    if (!order) {
        alert('Invoice details could not be found for this order.');
        return;
    }

    if (!previewInvoicePdf(order) && !openPrintableInvoice(order)) {
        alert('Invoice preview could not be opened. Please allow pop-ups or check your connection and try again.');
    }
}

function downloadInvoicePdfById(orderId) {
    const order = getStoredOrders().find(storedOrder => getOrderId(storedOrder) === orderId);
    if (!order) {
        alert('Invoice details could not be found for this order.');
        return;
    }

    if (!downloadInvoicePdf(order) && !openPrintableInvoice(order)) {
        alert('Invoice download could not be started. Please allow pop-ups or check your connection and try again.');
    }
}

function generateInvoicePdfFromOrder(order) {
    return previewInvoicePdf(order) || openPrintableInvoice(order);
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
                            <div class="order-item-name">${escapeHtml(item.name)}</div>
                            <div class="order-item-meta">${formatCurrency(item.price)} each | Qty ${item.quantity}</div>
                        </div>
                        <div class="order-item-total">${formatCurrency(item.total)}</div>
                    </div>
                `)
                .join('');
            
            const orderId = getOrderId(order);

            return `
                <div class="order-card">
                    <div class="order-card-header">
                        <div>
                            <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                Order: ${escapeHtml(orderId)}
                                <button class="copy-id-btn" onclick="copyOrderId('${orderId}')" title="Copy Order ID">📋</button>
                            </h3>
                            <div class="order-meta">Invoice: ${escapeHtml(getInvoiceNumber(order))}</div>
                            <div class="order-meta">Customer: ${escapeHtml(order.customerName)}</div>
                            <div class="order-meta">Date: ${formatOrderDate(order.datePlaced)}</div>
                            <div class="order-meta">Payment: ${escapeHtml(order.paymentMethod)}</div>
                        </div>
                        <div class="order-total">${formatCurrency(order.total)}</div>
                    </div>
                    <div class="order-items">${itemsMarkup}</div>
                    <div class="order-actions">
                        <button type="button" class="invoice-btn invoice-preview-btn" onclick="previewInvoicePdfById('${orderId}')">Preview PDF</button>
                        <button type="button" class="invoice-btn" onclick="downloadInvoicePdfById('${orderId}')">Download PDF</button>
                    </div>
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
function openPrivacy(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('privacyModal');
    if (modal) modal.classList.add('show');
}

function closePrivacy() {
    const modal = document.getElementById('privacyModal');
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
    const privacyModal = document.getElementById('privacyModal');
    if (privacyModal && event.target === privacyModal) {
    closePrivacy();
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
        const orderId = 'BBPT-' + Math.floor(10000 + Math.random() * 90000);
        const newOrder = {
            orderId,
            invoiceNumber: `INV-${orderId.replace(/^BBPT-/, '')}`,
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
        };

        orders.push(newOrder);
        saveStoredOrders(orders);
        localStorage.removeItem('userCart');
        const invoicePreviewOpened = generateInvoicePdfFromOrder(newOrder);
        alert(invoicePreviewOpened
            ? 'Order placed successfully! Your invoice preview is open, and you can download it from My Orders.'
            : 'Order placed successfully! You can preview or download the invoice PDF from My Orders.');
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
