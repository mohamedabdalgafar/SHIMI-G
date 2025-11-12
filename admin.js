// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBAD6ShMPzY2vE_aSs6R3f8BiANMVGw5k0",
  authDomain: "shimi-gem.firebaseapp.com",
  databaseURL: "https://shimi-gem-default-rtdb.firebaseio.com",
  projectId: "shimi-gem",
  storageBucket: "shimi-gem.appspot.com",
  messagingSenderId: "102001010471",
  appId: "1:102001010471:web:58e2faf4b6793d7ac32b02",
  measurementId: "G-1QXKEFKS3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== References =====
const bookingsRef = ref(db, "bookings");
const offersRef = ref(db, "offers");

// ===== Elements =====
const loginModal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const adminContent = document.getElementById("admin-content");

const bookingsTableBody = document.querySelector("#admin-subscriptions-table tbody");
const searchBookingsInput = document.getElementById("search-bookings");

const offersTableBody = document.querySelector("#admin-offers-table tbody");
const addOfferBtn = document.getElementById("add-offer-btn");
const offerModal = document.getElementById("offer-modal");
const offerModalTitle = document.getElementById("offer-modal-title");
const offerNameInput = document.getElementById("offer-name");
const offerDescInput = document.getElementById("offer-desc");
const offerPriceInput = document.getElementById("offer-price");
const offerActiveInput = document.getElementById("offer-active");
const saveOfferBtn = document.getElementById("save-offer-btn");
const closeOfferModalBtn = document.getElementById("close-offer-modal-btn");

let editingOfferKey = null;

// ===== Login =====
loginBtn.addEventListener("click", () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();
  
  if (username === "SHadmin" && password === "SH@123") {
    loginModal.style.display = "none";
    adminContent.style.display = "block";
    loadBookings();
    loadOffers();
  } else {
    alert("اسم المستخدم أو كلمة المرور غير صحيحة!");
  }
});

// ===== Load Bookings (read-only) =====
function loadBookings() {
  onValue(bookingsRef, (snapshot) => {
    const bookings = snapshot.val() || {};
    displayBookings(bookings);
  });
}

// ===== Display Bookings =====
function displayBookings(bookings) {
  bookingsTableBody.innerHTML = "";
  Object.keys(bookings).forEach(key => {
    const b = bookings[key];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.receiptId}</td>
      <td>${b.name} - ${b.phone}</td>
      <td>${b.service}</td>
      <td>${b.paymentType}</td>
      <td>${b.timestamp ? new Date(b.timestamp).toLocaleString() : ""}</td>
      <td>${b.status}</td>
    `;
    bookingsTableBody.appendChild(tr);
  });
}

// ===== Dynamic Search for Bookings =====
searchBookingsInput.addEventListener("input", () => {
  const filter = searchBookingsInput.value.trim().toLowerCase();
  Array.from(bookingsTableBody.querySelectorAll("tr")).forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(filter) ? "" : "none";
  });
});

// ===== Load Offers =====
function loadOffers() {
  onValue(offersRef, (snapshot) => {
    const offers = snapshot.val() || {};
    displayOffers(offers);
  });
}

// ===== Display Offers =====
function displayOffers(offers) {
  offersTableBody.innerHTML = "";
  Object.keys(offers).forEach(key => {
    const o = offers[key];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.name}</td>
      <td>${o.desc}</td>
      <td>${o.price}</td>
      <td class="checkbox-center"><input type="checkbox" class="offer-active-checkbox" ${o.active ? "checked" : ""}></td>
      <td>
        <button class="btn btn-primary btn-edit-offer">تعديل</button>
        <button class="btn btn-danger btn-delete-offer">حذف</button>
      </td>
    `;
    offersTableBody.appendChild(tr);

    // Toggle active
    tr.querySelector(".offer-active-checkbox").addEventListener("change", (e) => {
      update(ref(db, `offers/${key}`), { active: e.target.checked });
    });

    // Edit offer
    tr.querySelector(".btn-edit-offer").addEventListener("click", () => {
      editingOfferKey = key;
      offerModalTitle.textContent = "تعديل عرض";
      offerNameInput.value = o.name;
      offerDescInput.value = o.desc;
      offerPriceInput.value = o.price;
      offerActiveInput.checked = o.active || false;
      offerModal.style.display = "flex";
    });

    // Delete offer
    tr.querySelector(".btn-delete-offer").addEventListener("click", () => {
      if (confirm("هل أنت متأكد من حذف العرض؟")) {
        remove(ref(db, `offers/${key}`));
      }
    });
  });
}

// ===== Add New Offer =====
addOfferBtn.addEventListener("click", () => {
  editingOfferKey = null;
  offerModalTitle.textContent = "إضافة عرض جديد";
  offerNameInput.value = "";
  offerDescInput.value = "";
  offerPriceInput.value = "";
  offerActiveInput.checked = true;
  offerModal.style.display = "flex";
});

// ===== Save Offer =====
saveOfferBtn.addEventListener("click", () => {
  const name = offerNameInput.value.trim();
  const desc = offerDescInput.value.trim();
  const price = parseFloat(offerPriceInput.value);
  const active = offerActiveInput.checked;

  if (!name || !desc || isNaN(price)) {
    alert("يرجى إدخال جميع البيانات بشكل صحيح");
    return;
  }

  const offerData = { name, desc, price, active };

  if (editingOfferKey) {
    update(ref(db, `offers/${editingOfferKey}`), offerData);
  } else {
    push(offersRef, offerData);
  }

  offerModal.style.display = "none";
});

// ===== Close Modal =====
closeOfferModalBtn.addEventListener("click", () => {
  offerModal.style.display = "none";
});
