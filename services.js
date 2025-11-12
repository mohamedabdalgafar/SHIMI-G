// services.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyBAD6ShMPzY2vE_aSs6R3f8BiANMVGw5k0",
  authDomain: "shimi-gem.firebaseapp.com",
  databaseURL: "https://shimi-gem-default-rtdb.firebaseio.com",
  projectId: "shimi-gem",
  storageBucket: "shimi-gem.firebasestorage.app",
  messagingSenderId: "102001010471",
  appId: "1:102001010471:web:58e2faf4b6793d7ac32b02"
};

// ===== Initialize Firebase =====
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
  // ===== Elements =====
  const servicesContainer = document.getElementById("dynamic-services");

  const bookingSection = document.getElementById("booking-section");
  const selectedServiceDisplay = document.getElementById("selected-service-display");
  const selectedServicePrice = document.getElementById("selected-service-price");

  const fullNameInput = document.getElementById("full-name");
  const phoneNumberInput = document.getElementById("phone-number");

  const cashBtn = document.getElementById("btn-cash");
  const vodafoneBtn = document.getElementById("btn-vodafone");
  const instapayBtn = document.getElementById("btn-instapay");

  const cashDetails = document.getElementById("cash-details");
  const vodafoneDetails = document.getElementById("vodafone-details");
  const instapayDetails = document.getElementById("instapay-details");

  const checkBookingBtn = document.getElementById("check-booking-btn");
  const checkReceiptInput = document.getElementById("check-receipt-id");
  const checkResultDiv = document.getElementById("check-booking-result");

  // ===== Popup Modal =====
  const popupModal = document.getElementById("popup-modal");
  const popupTitle = document.getElementById("popup-title");
  const popupMessage = document.getElementById("popup-message");
  const popupClose = document.getElementById("popup-close");

  function showPopup(title, message) {
    popupTitle.textContent = title;
    popupMessage.innerHTML = message;
    popupModal.style.display = "flex";
  }

  popupClose.addEventListener("click", () => {
    popupModal.style.display = "none";
  });

  popupModal.addEventListener("click", (e) => {
    if (e.target === popupModal) popupModal.style.display = "none";
  });

  // ===== Payment Selection =====
  function hideAllPaymentDetails() {
    cashDetails.style.display = "none";
    vodafoneDetails.style.display = "none";
    instapayDetails.style.display = "none";
  }

  cashBtn?.addEventListener("click", () => {
    hideAllPaymentDetails();
    cashDetails.style.display = "block";
  });
  vodafoneBtn?.addEventListener("click", () => {
    hideAllPaymentDetails();
    vodafoneDetails.style.display = "block";
  });
  instapayBtn?.addEventListener("click", () => {
    hideAllPaymentDetails();
    instapayDetails.style.display = "block";
  });

  // ===== Load Services / Offers =====
  async function loadServices() {
    const servicesRef = ref(db, "offers"); // get offers from DB
    try {
      const snapshot = await get(servicesRef);
      const servicesData = snapshot.val();

      servicesContainer.innerHTML = "";

      if (!servicesData) {
        servicesContainer.innerHTML = "<p>لا توجد خدمات أو عروض حالياً.</p>";
        return;
      }

      Object.keys(servicesData).forEach(key => {
        const service = servicesData[key];
        if (!service.active) return; // only show active offers

        const div = document.createElement("div");
        div.className = "service-item";
        div.innerHTML = `
          <h4>${service.name}</h4>
          <p>${service.description || service.desc || "لا توجد وصف"}</p>
          <p><strong>السعر: ${service.price} جنيه مصري</strong></p>
          <button class="btn btn-primary" data-service="${service.name}" data-price="${service.price}">حجز هذه الخدمة</button>
        `;
        servicesContainer.appendChild(div);
      });

      attachServiceButtons();

    } catch (err) {
      console.error("خطأ أثناء تحميل الخدمات:", err);
      showPopup("خطأ", "حدث خطأ أثناء تحميل الخدمات. حاول مرة أخرى.");
    }
  }

  // ===== Attach Event Listeners to Service Buttons =====
  function attachServiceButtons() {
    const buttons = servicesContainer.querySelectorAll("button");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        selectedServiceDisplay.value = btn.dataset.service;
        selectedServicePrice.value = btn.dataset.price;
        bookingSection.style.display = "block";
        window.scrollTo({ top: bookingSection.offsetTop - 20, behavior: 'smooth' });
      });
    });
  }

  // ===== Helper to read file as Base64 =====
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // ===== Confirm Booking =====
  async function confirmBooking(paymentType) {
    const name = fullNameInput.value.trim();
    const phone = phoneNumberInput.value.trim();
    const service = selectedServiceDisplay.value;
    const price = selectedServicePrice.value;
    let receiptImage = "";

    if (!name || !phone) {
      showPopup("خطأ", "من فضلك املأ الاسم ورقم الهاتف.");
      return;
    }

    if (paymentType === "vodafone") {
      const fileInput = document.getElementById("vodafone-receipt");
      if (!fileInput || fileInput.files.length === 0) {
        showPopup("خطأ", "يرجى رفع إيصال الدفع.");
        return;
      }
      receiptImage = await fileToBase64(fileInput.files[0]);
    } else if (paymentType === "instapay") {
      const fileInput = document.getElementById("instapay-receipt");
      if (!fileInput || fileInput.files.length === 0) {
        showPopup("خطأ", "يرجى رفع إيصال الدفع.");
        return;
      }
      receiptImage = await fileToBase64(fileInput.files[0]);
    }

    const receiptId = "SH-" + Math.floor(1000 + Math.random() * 9000);

    const bookingData = {
      receiptId,
      service,
      name,
      phone,
      price,
      paymentType,
      status: paymentType === "cash" ? "قيد الانتظار" : "قيد المراجعة",
      receiptImage: receiptImage || null,
      timestamp: Date.now()
    };

    try {
      const bookingsRef = ref(db, "bookings");
      const newBookingRef = push(bookingsRef);
      await set(newBookingRef, bookingData);

      showPopup("تم الحجز بنجاح", `
        <strong>رقم الإيصال:</strong> ${receiptId} <br>
        <strong>الخدمة:</strong> ${service} <br>
        <strong>الاسم:</strong> ${name} <br>
        <strong>المبلغ:</strong> ${price} جنيه <br>
        <strong>طريقة الدفع:</strong> ${paymentType === "cash" ? "الدفع كاش" : paymentType === "vodafone" ? "فودافون كاش" : "إنستا باي"}
      `);

      document.getElementById("payment-form")?.reset();
      hideAllPaymentDetails();
      bookingSection.style.display = "none";

    } catch (err) {
      console.error("حدث خطأ أثناء حفظ الحجز:", err);
      showPopup("خطأ", "حدث خطأ أثناء حفظ الحجز. حاول مرة أخرى.");
    }
  }

  // ===== Attach Confirm Buttons =====
  document.querySelectorAll('[data-payment-type]').forEach(btn => {
    btn.addEventListener("click", () => confirmBooking(btn.dataset.paymentType));
  });

  // ===== Check Booking =====
  checkBookingBtn?.addEventListener("click", async () => {
    const receiptId = checkReceiptInput.value.trim();
    if (!receiptId) {
      showPopup("خطأ", "من فضلك أدخل رقم الإيصال أو الاشتراك.");
      return;
    }

    const bookingsRef = ref(db, "bookings");
    try {
      const snapshot = await get(bookingsRef);
      if (!snapshot.exists()) {
        showPopup("نتيجة", "لا توجد حجوزات حالياً.");
        return;
      }

      const bookings = snapshot.val();
      let found = false;

      for (const key in bookings) {
        if (bookings[key].receiptId === receiptId) {
          found = true;
          const status = bookings[key].status;
          const statusColor = status === "مؤكد" ? "green" :
                              status === "قيد الانتظار" ? "orange" :
                              "red";
          const imgHTML = bookings[key].receiptImage
                          ? `<br><img src="${bookings[key].receiptImage}" alt="إيصال الدفع" style="max-width:100%;">`
                          : "";
          showPopup("نتيجة الحجز", `
            <div style="border:2px solid ${statusColor}; padding:15px; border-radius:8px; text-align:right;">
              <p><strong>رقم الإيصال / الاشتراك:</strong> ${bookings[key].receiptId}</p>
              <p><strong>الخدمة:</strong> ${bookings[key].service}</p>
              <p><strong>الاسم:</strong> ${bookings[key].name}</p>
              <p><strong>الهاتف:</strong> ${bookings[key].phone}</p>
              <p><strong>المبلغ:</strong> ${bookings[key].price} جنيه</p>
              <p><strong>حالة الدفع:</strong> ${status}</p>
              ${imgHTML}
            </div>
          `);
          break;
        }
      }

      if (!found) {
        showPopup("نتيجة", "لم يتم العثور على هذا الرقم.");
      }

    } catch (err) {
      console.error("خطأ أثناء استعلام الحجز:", err);
      showPopup("خطأ", "حدث خطأ أثناء استعلام الحجز. حاول مرة أخرى.");
    }
  });

  // ===== Initial Load =====
  loadServices();
});
