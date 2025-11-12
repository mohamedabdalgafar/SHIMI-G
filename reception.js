// reception.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBAD6ShMPzY2vE_aSs6R3f8BiANMVGw5k0",
  authDomain: "shimi-gem.firebaseapp.com",
  databaseURL: "https://shimi-gem-default-rtdb.firebaseio.com",
  projectId: "shimi-gem",
  storageBucket: "shimi-gem.firebasestorage.app",
  messagingSenderId: "102001010471",
  appId: "1:102001010471:web:58e2faf4b6793d7ac32b02",
  measurementId: "G-1QXKEFKS3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const tableBody = document.getElementById("all-subscriptions-table").querySelector("tbody");
const authStatus = document.getElementById("auth-status");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-button");
const searchResult = document.getElementById("search-result");
const receiptModal = document.getElementById("receipt-modal");
const receiptImage = document.getElementById("receipt-image");
const closeModalBtn = document.getElementById("close-modal-btn");

const filterDateFrom = document.getElementById("filter-date-from");
const filterDateTo = document.getElementById("filter-date-to");
const filterStatus = document.getElementById("filter-status");
const applyFiltersBtn = document.getElementById("apply-filters-button");
const resetFiltersBtn = document.getElementById("reset-filters-button");

let allBookings = {}; // Cache all bookings for filtering

// ------------------ Load Bookings ------------------
async function loadBookings() {
    authStatus.textContent = "جاري تحميل الحجوزات...";
    tableBody.innerHTML = "<tr><td colspan='7'>جاري التحميل...</td></tr>";

    try {
        const snapshot = await get(ref(db, "bookings"));
        if (!snapshot.exists()) {
            tableBody.innerHTML = "<tr><td colspan='7'>لا توجد حجوزات حالياً.</td></tr>";
            authStatus.textContent = "تم التحميل: لا توجد حجوزات حالياً.";
            return;
        }

        allBookings = snapshot.val();
        renderTable(Object.entries(allBookings));
        authStatus.textContent = `تم التحميل: ${Object.keys(allBookings).length} حجز موجود.`;

    } catch (err) {
        console.error("خطأ في تحميل الحجوزات:", err);
        tableBody.innerHTML = "<tr><td colspan='7'>حدث خطأ أثناء تحميل البيانات.</td></tr>";
        authStatus.textContent = "فشل الاتصال بقاعدة البيانات!";
    }
}

// ------------------ Render Table ------------------
function renderTable(bookingsArray) {
    tableBody.innerHTML = "";
    if (bookingsArray.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='7'>لا توجد اشتراكات مطابقة للمعايير.</td></tr>";
        return;
    }

    bookingsArray.forEach(([key, sub]) => {
        const row = document.createElement("tr");
        const statusColor = sub.status === "Paid" ? "green" : "orange";
        const statusText = sub.status === "Paid" ? "مؤكد" : "معلّق";

        row.innerHTML = `
            <td>${sub.receiptId || key}</td>
            <td><strong>${sub.name || ""}</strong><br><small>${sub.phone || ""}</small></td>
            <td>${sub.service || ""}</td>
            <td>${sub.paymentType || ""}</td>
            <td>${sub.timestamp ? new Date(sub.timestamp).toLocaleDateString("ar-EG") : ""}</td>
            <td style="color:${statusColor}">${statusText}</td>
            <td>
                ${sub.status !== "Paid" ? `<button class="btn-confirm" data-id="${key}">تأكيد الدفع</button>` : "تم التأكيد"}
                ${sub.receiptImage ? `<button class="btn-view" data-img="${sub.receiptImage}">عرض الإيصال</button>` : ""}
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Attach modal listeners
    document.querySelectorAll(".btn-view").forEach(btn => {
        btn.addEventListener("click", () => {
            receiptImage.src = btn.dataset.img;
            receiptModal.style.display = "flex";
        });
    });

    // Attach confirm payment listeners
    document.querySelectorAll(".btn-confirm").forEach(btn => {
        btn.addEventListener("click", async () => {
            const bookingId = btn.dataset.id;
            await confirmPayment(bookingId);
        });
    });
}

// ------------------ Confirm Payment ------------------
async function confirmPayment(bookingId) {
    try {
        await update(ref(db, `bookings/${bookingId}`), { status: "Paid" });
        allBookings[bookingId].status = "Paid"; // update local cache
        renderTable(Object.entries(allBookings));
        alert("تم تأكيد الدفع بنجاح!");
    } catch (err) {
        console.error("خطأ عند تأكيد الدفع:", err);
        alert("حدث خطأ أثناء تأكيد الدفع!");
    }
}

// ------------------ Search ------------------
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return alert("من فضلك أدخل رقم الاشتراك أو رقم الهاتف.");

    const results = Object.entries(allBookings).filter(([key, sub]) => {
        return (sub.receiptId && sub.receiptId.toLowerCase().includes(query)) ||
               (sub.phone && sub.phone.includes(query));
    });
    renderTable(results);
});
// ------------------ Dynamic Search ------------------
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    const results = Object.entries(allBookings).filter(([key, sub]) => {
        return (sub.receiptId && sub.receiptId.toLowerCase().includes(query)) ||
               (sub.phone && sub.phone.includes(query)) ||
               (sub.name && sub.name.toLowerCase().includes(query));
    });

    renderTable(results);
});


// ------------------ Filters ------------------
applyFiltersBtn.addEventListener("click", () => {
    let results = Object.entries(allBookings);

    // Filter by status
    const status = filterStatus.value;
    if (status !== "All") {
        results = results.filter(([key, sub]) => sub.status === status);
    }

    // Filter by date
    const fromDate = filterDateFrom.value ? new Date(filterDateFrom.value) : null;
    const toDate = filterDateTo.value ? new Date(filterDateTo.value) : null;

    if (fromDate || toDate) {
        results = results.filter(([key, sub]) => {
            const subDate = sub.timestamp ? new Date(sub.timestamp) : null;
            if (!subDate) return false;
            if (fromDate && subDate < fromDate) return false;
            if (toDate && subDate > toDate) return false;
            return true;
        });
    }

    renderTable(results);
});

resetFiltersBtn.addEventListener("click", () => {
    filterStatus.value = "All";
    filterDateFrom.value = "";
    filterDateTo.value = "";
    renderTable(Object.entries(allBookings));
});

// ------------------ Modal ------------------
closeModalBtn.addEventListener("click", () => {
    receiptModal.style.display = "none";
});

// ------------------ Initial Load ------------------
loadBookings();
