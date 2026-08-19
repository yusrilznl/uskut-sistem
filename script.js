document.addEventListener("DOMContentLoaded", function () {

  /* =====================================================
     PENGATURAN TOKO, REKENING BANK, NO WA & COUNTDOWN
  ===================================================== */
  const ADMIN_CONFIG = {
    adminWaPhone: "6281234567890",
    preorderTargetDate: "Dec 30, 2026 23:59:59",
    bankAccounts: [
      { bank: "Bank BCA", number: "1234567890", holder: "USKUT" },
      { bank: "Bank Mandiri", number: "0987654321", holder: "USKUT" }
    ]
  };

  let dynamicTargetTimestamp = new Date(ADMIN_CONFIG.preorderTargetDate).getTime();

  async function loadStoreSettingsClient() {
    try {
      const firebase = await import("./Firebase/config.js");
      const firestore = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
      const { doc, getDoc } = firestore;

      const docSnap = await getDoc(doc(firebase.db, "store_settings", "general"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.adminWaPhone) ADMIN_CONFIG.adminWaPhone = data.adminWaPhone;
        if (data.bankBca) {
          ADMIN_CONFIG.bankAccounts[0] = { bank: "Bank BCA", number: data.bankBca, holder: "" };
        }
        if (data.bankMandiri) {
          ADMIN_CONFIG.bankAccounts[1] = { bank: "Bank Mandiri", number: data.bankMandiri, holder: "" };
        }
        if (data.preorderTargetDate) {
          // Parse HTML datetime-local (e.g., "2026-12-30T23:59") or date string
          const parsedDate = new Date(data.preorderTargetDate);
          if (!isNaN(parsedDate.getTime())) {
            dynamicTargetTimestamp = parsedDate.getTime();
          }
        }
      }
    } catch (err) {
      console.warn("Gagal memuat pengaturan toko dinamis:", err);
    }
  }

  loadStoreSettingsClient();

  /* =====================================================
     NAVBAR MENU SANITIZER & RENDERER
  ===================================================== */
  const navMenu = document.querySelector(".nav-menu");
  if (navMenu) {
    const path = window.location.pathname.toLowerCase();
    const isDrop = path.includes("drop.html");
    const isProgress = path.includes("progress.html");
    const isAbout = path.includes("about.html");
    const isHome = !isDrop && !isProgress && !isAbout;

    navMenu.innerHTML = `
      <a href="index.html" class="${isHome ? 'active' : ''}">Home</a>
      <a href="drop.html" class="${isDrop ? 'active' : ''}">Drop</a>
      <a href="progress.html" class="${isProgress ? 'active' : ''}">Progress</a>
      <a href="about.html" class="${isAbout ? 'active' : ''}">About Us</a>
    `;
  }

  /* =====================================================
     HAMBURGER MENU
  ===================================================== */

  const hamburgerMenu = document.getElementById("hamburger-menu");

  if (hamburgerMenu && navMenu) {

    hamburgerMenu.addEventListener("click", (e) => {
      e.preventDefault();
      navMenu.classList.toggle("active");
    });

    document.addEventListener("click", function (e) {
      if (
        !hamburgerMenu.contains(e.target) &&
        !navMenu.contains(e.target)
      ) {
        navMenu.classList.remove("active");
      }
    });

  }


  /* =====================================================
     COUNTDOWN
  ===================================================== */

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (daysEl && hoursEl && minutesEl && secondsEl) {

    function updateCountdown() {

      const now = new Date().getTime();
      const distance = dynamicTargetTimestamp - now;

      if (distance <= 0) {
        daysEl.innerHTML = "00";
        hoursEl.innerHTML = "00";
        minutesEl.innerHTML = "00";
        secondsEl.innerHTML = "00";
        return;
      }

      const days = Math.floor(
        distance / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) /
        (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) /
        (1000 * 60)
      );

      const seconds = Math.floor(
        (distance % (1000 * 60)) /
        1000
      );

      daysEl.innerHTML = days;
      hoursEl.innerHTML = String(hours).padStart(2, "0");
      minutesEl.innerHTML = String(minutes).padStart(2, "0");
      secondsEl.innerHTML = String(seconds).padStart(2, "0");
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

  }


  /* =====================================================
     FAQ
  ===================================================== */

  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {

    const btn = item.querySelector(".faq-question");

    if (!btn) return;

    btn.addEventListener("click", () => {
      item.classList.toggle("active");
    });

  });


  /* =====================================================
     PRODUCT CARD SLIDER
  ===================================================== */

  function initializeProductSliders() {

    document.querySelectorAll(".product-slider").forEach(slider => {

      if (slider.dataset.sliderInitialized === "true") {
        return;
      }

      const images = slider.querySelector(".slider-images");
      const slides = slider.querySelectorAll("img");
      const nextBtn = slider.querySelector(".next");
      const prevBtn = slider.querySelector(".prev");

      if (
        !images ||
        slides.length === 0 ||
        !nextBtn ||
        !prevBtn
      ) {
        return;
      }

      slider.dataset.sliderInitialized = "true";

      let index = 0;

      function updateSlider() {
        images.style.transform =
          `translateX(-${index * 100}%)`;
      }

      nextBtn.addEventListener("click", () => {

        index = (index + 1) % slides.length;

        updateSlider();

      });

      prevBtn.addEventListener("click", () => {

        index =
          (index - 1 + slides.length) %
          slides.length;

        updateSlider();

      });

    });

  }

  initializeProductSliders();


  /* =====================================================
     PRODUCT MODAL
  ===================================================== */

  const modal = document.getElementById("productModal");

  if (!modal) {
    return;
  }

  const modalTitle =
    document.getElementById("modalTitle");

  const modalPrice =
    document.getElementById("modalPrice");

  const modalDesc =
    document.getElementById("modalDesc");

  const modalImage1 =
    document.getElementById("modalImage1");

  const modalImage2 =
    document.getElementById("modalImage2");

  const modalImage3 =
    document.getElementById("modalImage3");

  const closeModal =
    modal.querySelector(".close-modal");

  let selectedSize = "";
  let selectedProduct = "";
  let selectedPrice = 0;

  let selectedImages = [];


  /* =====================================================
     CHECKOUT MODAL
  ===================================================== */

  function createCheckoutModal() {

    if (document.getElementById("checkoutModal")) {
      return;
    }

    const checkoutModal =
      document.createElement("div");

    checkoutModal.id = "checkoutModal";

    checkoutModal.innerHTML = `

      <div class="checkout-content">

        <button
          type="button"
          class="checkout-close"
          id="checkoutClose"
        >
          &times;
        </button>

        <div class="checkout-header">

          <p>PRE-ORDER</p>

          <h2>Data Pemesanan & Pembayaran</h2>

          <span>
            Lengkapi data diri, pilih wilayah pengiriman, dan upload bukti transfer.
          </span>

        </div>


        <!-- INFORMASI REKENING BANK -->
        <div class="bank-info-card" style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:18px; padding:18px; margin-bottom:25px;">
          <h4 style="margin:0 0 10px 0; font-size:14px; color:#111; display:flex; align-items:center; gap:6px;">
            <i class="bx bx-credit-card-front" style="font-size:18px;"></i> Rekening Pembayaran Transfer
          </h4>
          <div style="font-size:13px; color:#444; line-height:1.7;">
            ${ADMIN_CONFIG.bankAccounts.map(acc => `<div>🏦 <strong>${acc.bank}:</strong> ${acc.number} (a.n. ${acc.holder})</div>`).join("")}
          </div>
          <small style="display:block; margin-top:8px; color:#777; font-size:11px;">Silakan lakukan transfer sesuai Total Tagihan di bawah, lalu upload foto/screenshot bukti transfer.</small>
        </div>


        <form id="checkoutForm">

          <div class="checkout-product">

            <div>

              <small>Produk</small>

              <strong id="checkoutProduct">
                -
              </strong>

            </div>

            <div>

              <small>Size</small>

              <strong id="checkoutSize">
                -
              </strong>

            </div>

            <div>

              <small>Harga Satuan</small>

              <strong id="checkoutPrice">
                -
              </strong>

            </div>

          </div>


          <div class="checkout-field">

            <label for="customerName">
              Nama Lengkap
            </label>

            <input
              type="text"
              id="customerName"
              placeholder="Masukkan nama lengkap Anda"
              required
            >

          </div>


          <div class="checkout-field">

            <label for="phone">
              Nomor WhatsApp
            </label>

            <input
              type="tel"
              id="phone"
              placeholder="Contoh: 08123456789"
              required
            >

          </div>


          <div class="checkout-field">

            <label for="address">
              Alamat Lengkap Pengiriman
            </label>

            <textarea
              id="address"
              rows="3"
              placeholder="Jalan, No. Rumah, RT/RW, Kecamatan, Kota/Kabupaten, Kode Pos"
              required
            ></textarea>

          </div>


          <div class="checkout-field">

            <label for="quantity">
              Jumlah Pesanan
            </label>

            <input
              type="number"
              id="quantity"
              value="1"
              min="1"
              required
            >

          </div>


          <!-- WILAYAH ONGKIR -->
          <div class="checkout-field">

            <label for="shippingRegionSelect">
              Wilayah Pengiriman (Ongkir)
            </label>

            <select id="shippingRegionSelect" required style="width:100%; padding:12px 14px; border:1px solid #ddd; border-radius:12px; font-size:14px; background:#fff; cursor:pointer;">
              <option value="">-- Memuat opsi pengiriman... --</option>
            </select>

          </div>


          <!-- UPLOAD BUKTI TRANSFER -->
          <div class="checkout-field">

            <label for="paymentProofInput">
              Upload Bukti Transfer (Foto/Screenshot)
            </label>

            <input type="file" id="paymentProofInput" accept="image/*" required style="display:none;">

            <label for="paymentProofInput" style="display:flex; align-items:center; justify-content:center; gap:8px; background:#f4f4f4; border:2px dashed #ccc; border-radius:14px; padding:16px; cursor:pointer; font-size:13px; font-weight:600; color:#444; transition: 0.2s;">
              <i class="bx bx-cloud-upload" style="font-size:22px;"></i> Pilih Foto Bukti Transfer
            </label>

            <div id="paymentProofPreviewBox" style="margin-top:10px; display:none; text-align:center;">
              <img id="paymentProofPreviewImg" src="" alt="Bukti Transfer" style="max-width:140px; max-height:140px; object-fit:cover; border-radius:12px; border:1px solid #ddd;">
              <p style="margin:6px 0 0 0; font-size:12px; color:#198754; font-weight:600;"><i class="bx bx-check-circle"></i> Foto Bukti Transfer Terpilih</p>
            </div>

          </div>


          <!-- RINCIAN TOTAL TAGIHAN -->
          <div class="checkout-summary-box" style="background:#f8f9fa; border-radius:18px; padding:20px; margin:25px 0 20px;">

            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; color:#666;">
              <span>Subtotal Produk</span>
              <strong id="summarySubtotal" style="color:#111;">Rp 0</strong>
            </div>

            <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:13px; color:#666;">
              <span>Ongkos Kirim</span>
              <strong id="summaryShipping" style="color:#111;">Rp 0</strong>
            </div>

            <div style="display:flex; justify-content:space-between; border-top:1px solid #e0e0e0; padding-top:12px; font-size:16px; font-weight:700; color:#111;">
              <span>TOTAL DITRANSFER</span>
              <strong id="checkoutTotal" style="color:#111;">Rp 0</strong>
            </div>

          </div>


          <button
            type="submit"
            class="confirm-order-btn"
            id="confirmOrderBtn"
          >
            Kirim Pesanan & Konfirmasi
          </button>

        </form>

      </div>

    `;

    document.body.appendChild(checkoutModal);


    /* CLOSE */

    document
      .getElementById("checkoutClose")
      .addEventListener("click", closeCheckout);


    checkoutModal.addEventListener(
      "click",
      function (e) {

        if (e.target === checkoutModal) {
          closeCheckout();
        }

      }
    );


    /* QUANTITY */

    document
      .getElementById("quantity")
      .addEventListener("input", updateTotal);


    /* FORM */

    document
      .getElementById("checkoutForm")
      .addEventListener(
        "submit",
        submitOrder
      );

  }


  /* =====================================================
     CHECKOUT CSS
  ===================================================== */

  const checkoutStyle =
    document.createElement("style");

  checkoutStyle.innerHTML = `

    #checkoutModal {

      position: fixed;
      inset: 0;

      background: rgba(0,0,0,0.65);

      display: none;

      align-items: center;
      justify-content: center;

      padding: 20px;

      z-index: 10000;

      overflow-y: auto;

    }


    #checkoutModal.show {
      display: flex;
    }


    .checkout-content {

      width: 100%;
      max-width: 600px;

      max-height: 90vh;

      overflow-y: auto;

      background: #fff;

      border-radius: 28px;

      padding: 40px;

      position: relative;

      animation: checkoutFade 0.25s ease;

    }


    @keyframes checkoutFade {

      from {

        opacity: 0;
        transform: translateY(20px);

      }

      to {

        opacity: 1;
        transform: translateY(0);

      }

    }


    .checkout-close {

      position: absolute;

      top: 15px;
      right: 20px;

      border: none;

      background: none;

      font-size: 32px;

      cursor: pointer;

      color: #111;

    }


    .checkout-header {

      margin-bottom: 30px;

    }


    .checkout-header p {

      font-size: 11px;

      letter-spacing: 4px;

      color: #777;

      margin-bottom: 10px;

    }


    .checkout-header h2 {

      font-size: 2rem;

      margin-bottom: 8px;

    }


    .checkout-header span {

      color: #777;

      font-size: 14px;

    }


    .checkout-product {

      background: #f5f5f3;

      border-radius: 18px;

      padding: 20px;

      display: grid;

      grid-template-columns:
        1fr 80px 1fr;

      gap: 15px;

      margin-bottom: 25px;

    }


    .checkout-product div {

      display: flex;

      flex-direction: column;

      gap: 6px;

    }


    .checkout-product small {

      color: #888;

      font-size: 11px;

    }


    .checkout-product strong {

      font-size: 14px;

    }


    .checkout-field {

      margin-bottom: 20px;

    }


    .checkout-field label {

      display: block;

      margin-bottom: 8px;

      font-size: 13px;

      font-weight: 600;

    }


    .checkout-field input,
    .checkout-field textarea {

      width: 100%;

      border: 1px solid #ddd;

      border-radius: 14px;

      padding: 14px;

      font-family: inherit;

      font-size: 14px;

      outline: none;

      transition: 0.2s;

    }


    .checkout-field input:focus,
    .checkout-field textarea:focus {

      border-color: #111;

    }


    .checkout-field textarea {

      resize: vertical;

    }


    .checkout-total {

      display: flex;

      justify-content: space-between;

      align-items: center;

      border-top: 1px solid #eee;

      padding-top: 20px;

      margin-top: 10px;

      margin-bottom: 20px;

    }


    .checkout-total span {

      color: #777;

    }


    .checkout-total strong {

      font-size: 1.2rem;

    }


    .confirm-order-btn {

      width: 100%;

      padding: 16px;

      border: none;

      border-radius: 16px;

      background: #111;

      color: #fff;

      font-weight: 600;

      cursor: pointer;

      transition: 0.3s;

    }


    .confirm-order-btn:hover {

      opacity: 0.85;

    }


    .confirm-order-btn:disabled {

      opacity: 0.5;

      cursor: not-allowed;

    }


    @media(max-width:600px) {

      .checkout-content {

        padding: 30px 20px;

        border-radius: 22px;

      }


      .checkout-product {

        grid-template-columns: 1fr 1fr;

      }


      .checkout-product div:last-child {

        grid-column: 1 / -1;

      }

    }

  `;

  document.head.appendChild(checkoutStyle);


  /* =====================================================
     OPEN PRODUCT
  ===================================================== */

  function openProduct(button) {

    modal.classList.add("show");

    selectedProduct =
      button.dataset.name || "";

    selectedPrice =
      Number(
        String(button.dataset.price || "0")
          .replace(/[^\d]/g, "")
      );

    const img1 = button.dataset.image1 || "";
    const img2 = button.dataset.image2 || img1;
    const img3 = button.dataset.image3 || img1;

    selectedImages = [img1, img2, img3];

    if (modalTitle) {
      modalTitle.innerText = selectedProduct;
    }

    if (modalPrice) {
      modalPrice.innerText = `Rp ${selectedPrice.toLocaleString("id-ID")}`;
    }

    if (modalDesc) {
      modalDesc.innerText = button.dataset.desc || "";
    }

    if (modalImage1) {
      modalImage1.src = img1;
    }

    if (modalImage2) {
      modalImage2.src = img2 || img1;
      modalImage2.onerror = function() {
        if (img1) this.src = img1;
      };
    }

    if (modalImage3) {
      modalImage3.src = img3 || img1;
      modalImage3.onerror = function() {
        if (img1) this.src = img1;
      };
    }


    selectedSize = "";


    document
      .querySelectorAll(".size-btn")
      .forEach(btn => {
        btn.classList.remove("active");
      });

  }


  /* =====================================================
     DETAIL BUTTON
     EVENT DELEGATION
  ===================================================== */

  document.addEventListener("click", function (e) {

    const button =
      e.target.closest(".view-btn");

    if (!button) return;

    openProduct(button);

  });


  /* =====================================================
     CLOSE PRODUCT MODAL
  ===================================================== */

  if (closeModal) {

    closeModal.addEventListener(
      "click",
      () => {
        modal.classList.remove("show");
      }
    );

  }


  window.addEventListener("click", function (e) {

    if (e.target === modal) {

      modal.classList.remove("show");

    }

  });


  /* =====================================================
     SIZE SELECT
  ===================================================== */

  document.addEventListener("click", function (e) {

    const btn =
      e.target.closest(".size-btn");

    if (!btn) return;

    document
      .querySelectorAll(".size-btn")
      .forEach(b => {
        b.classList.remove("active");
      });

    btn.classList.add("active");

    selectedSize =
      btn.innerText.trim();

  });


  /* =====================================================
     CREATE CHECKOUT MODAL
  ===================================================== */

  createCheckoutModal();


  /* =====================================================
     OPEN CHECKOUT
  ===================================================== */

  /* =====================================================
     OPEN CHECKOUT & SHIPPING RATES
  ===================================================== */

  let activeShippingRates = [
    { region: "Jabodetabek", fee: 10000, estimate: "1-2 Hari Kerja" },
    { region: "Pulau Jawa (Luar Jabodetabek)", fee: 15000, estimate: "2-3 Hari Kerja" },
    { region: "Sumatera, Bali, NTB / NTT", fee: 25000, estimate: "3-5 Hari Kerja" },
    { region: "Kalimantan & Sulawesi", fee: 35000, estimate: "3-5 Hari Kerja" },
    { region: "Papua & Maluku", fee: 45000, estimate: "5-7 Hari Kerja" }
  ];

  let selectedPaymentProofData = "";

  async function loadShippingRatesCheckout() {
    const selectEl = document.getElementById("shippingRegionSelect");
    if (!selectEl) return;

    try {
      const firebase = await import("./Firebase/config.js");
      const firestore = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
      const { collection, getDocs } = firestore;

      const snapshot = await getDocs(collection(firebase.db, "shipping_rates"));
      if (!snapshot.empty) {
        activeShippingRates = [];
        snapshot.forEach((docSnap) => {
          activeShippingRates.push(docSnap.data());
        });
      }
    } catch (err) {
      console.warn("Gagal memuat ongkir dinamis, menggunakan tarif standar:", err);
    }

    selectEl.innerHTML = `<option value="">-- Pilih Wilayah Pengiriman --</option>`;
    activeShippingRates.forEach((item, index) => {
      const opt = document.createElement("option");
      opt.value = index;
      opt.textContent = `${item.region} (Rp ${Number(item.fee).toLocaleString("id-ID")})`;
      selectEl.appendChild(opt);
    });

    if (activeShippingRates.length > 0) {
      selectEl.selectedIndex = 1; // Default select 1st option
    }

    updateTotal();
  }

  // Setup Payment Proof File Upload Listener
  function setupPaymentProofListener() {
    const proofInput = document.getElementById("paymentProofInput");
    const previewBox = document.getElementById("paymentProofPreviewBox");
    const previewImg = document.getElementById("paymentProofPreviewImg");

    if (proofInput) {
      proofInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            selectedPaymentProofData = evt.target.result;
            if (previewImg) previewImg.src = selectedPaymentProofData;
            if (previewBox) previewBox.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  const preorderBtn = document.getElementById("preorderBtn");
  if (preorderBtn) {
    preorderBtn.addEventListener("click", function () {
      if (selectedSize === "") {
        alert("Silakan pilih size terlebih dahulu.");
        return;
      }

      const checkoutModal = document.getElementById("checkoutModal");
      document.getElementById("checkoutProduct").innerText = selectedProduct;
      document.getElementById("checkoutSize").innerText = selectedSize;
      document.getElementById("checkoutPrice").innerText = `Rp ${selectedPrice.toLocaleString("id-ID")}`;
      document.getElementById("quantity").value = 1;

      // Reset Payment Proof
      selectedPaymentProofData = "";
      const proofInput = document.getElementById("paymentProofInput");
      const previewBox = document.getElementById("paymentProofPreviewBox");
      if (proofInput) proofInput.value = "";
      if (previewBox) previewBox.style.display = "none";

      setupPaymentProofListener();
      loadShippingRatesCheckout();

      checkoutModal.classList.add("show");
    });
  }


  /* =====================================================
     CLOSE CHECKOUT
  ===================================================== */
  function closeCheckout() {
    const checkoutModal = document.getElementById("checkoutModal");
    if (checkoutModal) {
      checkoutModal.classList.remove("show");
    }
  }


  /* =====================================================
     UPDATE TOTAL & ONGKIR
  ===================================================== */
  function updateTotal() {
    const quantityInput = document.getElementById("quantity");
    const selectEl = document.getElementById("shippingRegionSelect");

    if (!quantityInput) return;

    let quantity = Number(quantityInput.value);
    if (quantity < 1) {
      quantity = 1;
      quantityInput.value = 1;
    }

    const subtotal = selectedPrice * quantity;
    let shippingFee = 0;

    if (selectEl && selectEl.value !== "") {
      const selectedIndex = Number(selectEl.value);
      if (activeShippingRates[selectedIndex]) {
        shippingFee = Number(activeShippingRates[selectedIndex].fee || 0);
      }
    }

    const totalPrice = subtotal + shippingFee;

    const subtotalEl = document.getElementById("summarySubtotal");
    const shippingEl = document.getElementById("summaryShipping");
    const totalEl = document.getElementById("checkoutTotal");

    if (subtotalEl) subtotalEl.innerText = `Rp ${subtotal.toLocaleString("id-ID")}`;
    if (shippingEl) shippingEl.innerText = `Rp ${shippingFee.toLocaleString("id-ID")}`;
    if (totalEl) totalEl.innerText = `Rp ${totalPrice.toLocaleString("id-ID")}`;
  }

  // Bind change listener to shipping dropdown
  document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "shippingRegionSelect") {
      updateTotal();
    }
  });


  /* =====================================================
     HELPER: NORMALIZE PHONE NUMBER
  ===================================================== */
  function normalizePhone(input) {
    if (!input) return "";
    let clean = input.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    return clean;
  }

  /* =====================================================
     SUBMIT ORDER TO FIREBASE & REDIRECT TO WHATSAPP
  ===================================================== */
  async function submitOrder(e) {
    e.preventDefault();

    const customerName = document.getElementById("customerName").value.trim();
    const rawPhone = document.getElementById("phone").value.trim();
    const phone = normalizePhone(rawPhone);
    const address = document.getElementById("address").value.trim();
    const quantity = Number(document.getElementById("quantity").value);
    const selectEl = document.getElementById("shippingRegionSelect");

    if (!customerName || !phone || !address || !quantity) {
      alert("Mohon lengkapi semua data diri Anda.");
      return;
    }

    if (selectedSize === "") {
      alert("Silakan pilih size terlebih dahulu.");
      return;
    }

    if (!selectEl || selectEl.value === "") {
      alert("Silakan pilih Wilayah Pengiriman terlebih dahulu.");
      return;
    }

    if (!selectedPaymentProofData) {
      alert("Mohon upload Foto/Screenshot Bukti Transfer terlebih dahulu.");
      return;
    }

    const selectedIndex = Number(selectEl.value);
    const shippingRateItem = activeShippingRates[selectedIndex] || { region: "Standard", fee: 0 };
    const shippingRegion = shippingRateItem.region;
    const shippingFee = Number(shippingRateItem.fee || 0);

    const subtotal = selectedPrice * quantity;
    const totalPrice = subtotal + shippingFee;

    const confirmButton = document.getElementById("confirmOrderBtn");
    confirmButton.disabled = true;
    confirmButton.innerText = "Menyimpan & Memproses...";

    try {
      const firebase = await import("./Firebase/config.js");
      const firestore = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
      const { collection, addDoc, serverTimestamp } = firestore;
      const db = firebase.db;

      // Save Order to Firestore
      const docRef = await addDoc(collection(db, "orders"), {
        productName: selectedProduct,
        productPrice: selectedPrice,
        productImage: (selectedImages && selectedImages[0]) ? selectedImages[0] : "",
        size: selectedSize,
        quantity: quantity,
        subtotal: subtotal,
        shippingRegion: shippingRegion,
        shippingFee: shippingFee,
        totalPrice: totalPrice,
        customerName: customerName,
        phone: phone,
        address: address,
        paymentProofImage: selectedPaymentProofData,
        status: "menunggu_verifikasi",
        createdAt: serverTimestamp()
      });

      alert("Pesanan & Bukti Transfer berhasil dikirim! 🚀 Admin akan memverifikasi pembayaran Anda.");

      document.getElementById("checkoutForm").reset();
      closeCheckout();

      const modal = document.getElementById("productModal");
      if (modal) modal.classList.remove("show");

      confirmButton.disabled = false;
      confirmButton.innerText = "Kirim Pesanan & Konfirmasi";

      // WhatsApp Admin Redirect
      const adminWaPhone = ADMIN_CONFIG.adminWaPhone || "6281234567890";
      const waMessage = encodeURIComponent(
        `Halo Admin USKUT, saya baru saja melakukan Pemesanan & Upload Bukti Transfer:\n\n` +
        `📦 Produk: ${selectedProduct}\n` +
        `📏 Size: ${selectedSize}\n` +
        `🔢 Jumlah: ${quantity} pcs (Subtotal: Rp ${subtotal.toLocaleString("id-ID")})\n` +
        `🚚 Ongkir (${shippingRegion}): Rp ${shippingFee.toLocaleString("id-ID")}\n` +
        `💰 TOTAL TRANSFER: Rp ${totalPrice.toLocaleString("id-ID")}\n\n` +
        `👤 Nama: ${customerName}\n` +
        `📱 No HP: ${rawPhone}\n` +
        `📍 Alamat: ${address}\n\n` +
        `📎 Bukti transfer telah di-upload ke sistem dengan ID Order: #${docRef.id.substring(0,8).toUpperCase()}\n` +
        `Mohon diperiksa ya kak, terima kasih!`
      );

      window.open(`https://wa.me/${adminWaPhone}?text=${waMessage}`, "_blank");

    } catch (error) {
      console.error("Gagal menyimpan pesanan:", error);
      alert("Gagal menyimpan pesanan. Silakan coba lagi.");
      confirmButton.disabled = false;
      confirmButton.innerText = "Kirim Pesanan & Konfirmasi";
    }
  }


});