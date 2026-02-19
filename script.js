/********************
 * LOGIN
 ********************/
function login() {
    if (username.value === "admin" && password.value === "1234") {
        loginBox.classList.add("hidden");
        system.classList.remove("hidden");
        render();
    } else {
        loginMsg.innerText = "Username หรือ Password ไม่ถูกต้อง";
    }
}

function logout() {
    location.reload();
}

/********************
 * DATA
 ********************/
let products = JSON.parse(localStorage.getItem("products")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

let showManage = [];
let cart = [];

/********************
 * STORAGE
 ********************/
function saveData() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("history", JSON.stringify(history));
}

/********************
 * PRODUCT
 ********************/
function addProduct() {
    if (!pname.value || pprice.value <= 0 || pstock.value <= 0) return;

    const barcode = prompt("กรอกบาร์โค้ดสินค้า (ห้ามซ้ำ)");
    if (!barcode) return;

    if (products.find(p => p.barcode === barcode)) {
        alert("บาร์โค้ดซ้ำ");
        return;
    }

    products.push({
        name: pname.value.trim(),
        price: Number(pprice.value),
        stock: Number(pstock.value),
        barcode: barcode.trim()
    });

    pname.value = pprice.value = pstock.value = "";
    saveData();
    render();
}

function checkAddProductForm() {
    addBtn.disabled =
        pname.value.trim() === "" ||
        pprice.value <= 0 ||
        pstock.value <= 0;
}

/********************
 * SELL (NORMAL)
 ********************/
function sell(index) {
    const qty = Number(prompt("กรอกจำนวนที่ต้องการขาย"));
    if (qty <= 0 || products[index].stock < qty) return;

    products[index].stock -= qty;
    history.push(createHistory(products[index], qty));

    saveData();
    render();
}

/********************
 * MANAGE PRODUCT
 ********************/
function toggleManage(i) {
    showManage[i] = !showManage[i];
    render();
}

function updateProductName(i) {
    const v = prompt("ชื่อใหม่");
    if (!v) return;
    products[i].name = v.trim();
    saveData();
    render();
}

function updatePrice(i) {
    const v = Number(prompt("ราคาใหม่"));
    if (v <= 0) return;
    products[i].price = v;
    saveData();
    render();
}

function updateStock(i, type) {
    const qty = Number(prompt("จำนวน"));
    if (qty <= 0) return;

    if (type === "add") products[i].stock += qty;
    else {
        if (products[i].stock < qty) return;
        products[i].stock -= qty;
    }
    saveData();
    render();
}

function deleteProduct(i) {
    if (!confirm("ยืนยันลบสินค้า")) return;
    products.splice(i, 1);
    saveData();
    render();
}

/********************
 * POS MODE
 ********************/
function openPOS() {
    renderPOSProducts();
}

function renderPOSProducts() {
    posProducts.innerHTML = "";
    products.forEach((p, i) => {
        posProducts.innerHTML += `
            <button onclick="addToCart(${i})">
                ${p.name}<br>${p.price} บาท
            </button>
        `;
    });
}

function addToCart(i) {
    let item = cart.find(c => c.index === i);
    if (item) item.qty++;
    else cart.push({ index: i, qty: 1 });
    renderCart();
}

function renderCart() {
    cartList.innerHTML = "";
    let total = 0;

    cart.forEach((c, index) => {
        const p = products[c.index];
        const sum = p.price * c.qty;
        total += sum;

        cartList.innerHTML += `
            <div class="cart-item">

                <div class="cart-name">
                    ${p.name} x ${c.qty}
                </div>

                <div class="cart-controls">
                    <button class="btn-minus"
                        onclick="decreaseCartQty(${index})">➖</button>

                    <button class="btn-delete"
                        onclick="removeFromCart(${index})">🗑</button>
                </div>

                <div class="cart-price">
                    ${sum}
                </div>

            </div>
        `;
    });

    posTotal.innerText = total;
}


function checkout() {
    const cashValue = Number(cash.value);
    const total = Number(posTotal.innerText);
    if (cashValue < total) return alert("เงินไม่พอ");

    cart.forEach(c => {
        products[c.index].stock -= c.qty;
        history.push(createHistory(products[c.index], c.qty));
    });

    change.innerText = "เงินทอน: " + (cashValue - total) + " บาท";
    cart = [];
    cash.value = "";

    saveData();
    render();
}

/********************
 * HISTORY
 ********************/
function createHistory(p, qty) {
    return {
        time: new Date().toLocaleString("th-TH"),
        name: p.name,
        price: p.price,
        qty: qty,
        total: p.price * qty
    };
}

/********************
 * PAGINATION
 ********************/
let productPage = 1;
let historyPage = 1;
const perPage = 5;

/********************
 * RENDER
 ********************/
function render() {
    renderProducts();
    renderHistory();
    productCount.innerText = products.length;
    totalRevenue.innerText = history.reduce((s, h) => s + h.total, 0);
}

function renderProducts() {
    productList.innerHTML = "";
    const start = (productPage - 1) * perPage;
    products.slice(start, start + perPage).forEach((p, i) => {
        const idx = start + i;
        productList.innerHTML += `
        <tr>
            <td>${idx + 1}</td>
            <td>${p.name}</td>
            <td>${p.price}</td>
            <td>${p.stock}</td>
            <td>
                <button onclick="toggleManage(${idx})">จัดการ</button>
                ${showManage[idx] ? `
                <div>
                    <button onclick="updateProductName(${idx})">ชื่อ</button>
                    <button onclick="updatePrice(${idx})">ราคา</button>
                    <button onclick="updateStock(${idx},'add')">+</button>
                    <button onclick="updateStock(${idx},'remove')">-</button>
                    <button onclick="deleteProduct(${idx})">ลบ</button>
                </div>` : ""}
            </td>
        </tr>`;
    });
    renderPagination(products.length, productPage, "productPagination", p => {
        productPage = p;
        render();
    });
}

function renderHistory() {
    historyList.innerHTML = "";
    const start = (historyPage - 1) * perPage;
    history.slice(start, start + perPage).forEach(h => {
        historyList.innerHTML += `
        <tr>
            <td>${h.time}</td>
            <td>${h.name}</td>
            <td>${h.price}</td>
            <td>${h.qty}</td>
            <td>${h.total}</td>
        </tr>`;
    });
    renderPagination(history.length, historyPage, "historyPagination", p => {
        historyPage = p;
        render();
    });
}

function renderPagination(total, page, id, cb) {
    const box = document.getElementById(id);
    box.innerHTML = "";
    const pages = Math.ceil(total / perPage);
    for (let i = 1; i <= pages; i++) {
        box.innerHTML += `
        <button class="${i === page ? 'active' : ''}"
            onclick="(${cb})(${i})">${i}</button>`;
    }
}

/********************
 * EXPORT EXCEL
 ********************/
function exportExcel() {

    if (history.length === 0) {
        alert("ไม่มีข้อมูลสำหรับ Export");
        return;
    }

    const data = history.map(h => ({
        เวลา: h.time,
        สินค้า: h.name,
        ราคา: h.price,
        จำนวน: h.qty,
        รวม: h.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "SalesHistory");

    XLSX.writeFile(workbook, "sales_history.xlsx");
}

function decreaseCartQty(i) {
    if (!confirm("ลดจำนวนสินค้า 1 ชิ้น ?")) return;

    cart[i].qty--;

    if (cart[i].qty <= 0) {
        cart.splice(i, 1);
    }

    renderCart();
}

function removeFromCart(i) {
    if (!confirm("ลบสินค้านี้ออกจากตะกร้า ?")) return;

    cart.splice(i, 1);
    renderCart();
}

function confirmOrder() {
    if (cart.length === 0) {
        alert("ยังไม่มีสินค้าในตะกร้า");
        return;
    }

    payTotal.innerText = posTotal.innerText;
    payCash.value = "";
    payChange.innerText = "";

    paymentModal.classList.remove("hidden");
}

function closePayment() {
    paymentModal.classList.add("hidden");
}

function confirmPayment() {
    const cash = Number(payCash.value);
    const total = Number(payTotal.innerText);

    if (cash < total) {
        alert("เงินไม่พอ");
        return;
    }

    // หักสต็อก + บันทึกประวัติ
    cart.forEach(c => {
        products[c.index].stock -= c.qty;
        history.push({
            time: new Date().toLocaleString("th-TH"),
            name: products[c.index].name,
            price: products[c.index].price,
            qty: c.qty,
            total: products[c.index].price * c.qty
        });
    });

    saveData();
    render();

    const changeAmount = cash - total;

    // ปิด modal รับเงิน
    paymentModal.classList.add("hidden");

    // เปิด modal เงินทอน
    document.getElementById("finalChange").innerText = changeAmount + " บาท";
    document.getElementById("changeModal").classList.remove("hidden");
}

window.onload = function() {
    const modal = document.getElementById("paymentModal");
    if (modal) modal.classList.add("hidden");
};

function finishTransaction() {

    // ปิด modal เงินทอน
    document.getElementById("changeModal").classList.add("hidden");

    // ล้างตะกร้า
    cart = [];
    renderCart();

    // รีเซ็ตเงินรวม
    document.getElementById("posTotal").innerText = 0;

    alert("ทำรายการสำเร็จ ✅");
}

/********************
 * BARCODE SCANNER
 ********************/

let html5QrCode;

function openScanner() {
    document.getElementById("scannerModal").classList.remove("hidden");

    html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: 250
                },
                (decodedText) => {
                    const index = products.findIndex(p => p.barcode === decodedText);

                    if (index !== -1) {
                        addToCart(index);
                        renderCart();
                        closeScanner();
                        alert("เพิ่มสินค้าแล้ว");
                    } else {
                        alert("ไม่พบสินค้า");
                    }
                }
            );
        }
    });
}

function closeScanner() {
    document.getElementById("scannerModal").classList.add("hidden");
    if (html5QrCode) {
        html5QrCode.stop().catch(err => console.log(err));
    }
}

function simulateScan() {
    const code = prompt("จำลองกรอกบาร์โค้ด");
    if (!code) return;

    const index = products.findIndex(p => p.barcode === code);

    if (index === -1) {
        alert("ไม่พบสินค้า");
        return;
    }

    addToCart(index);
    renderCart();
}



