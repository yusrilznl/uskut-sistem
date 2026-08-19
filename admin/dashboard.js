import { auth, db } from "../Firebase/config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// =====================================================
// ELEMENT
// =====================================================

const adminEmail =
  document.getElementById("adminEmail");

const totalOrders =
  document.getElementById("totalOrders");

const pendingOrders =
  document.getElementById("pendingOrders");

const processingOrders =
  document.getElementById("processingOrders");

const completedOrders =
  document.getElementById("completedOrders");

const orderTableBody =
  document.getElementById("orderTableBody");

const logoutBtn =
  document.getElementById("logoutBtn");

// TABS & SECTIONS
const tabOrders = document.getElementById("tabOrders");
const tabProducts = document.getElementById("tabProducts");
const tabShipping = document.getElementById("tabShipping");
const tabStoreSettings = document.getElementById("tabStoreSettings");

const sectionOrders = document.getElementById("sectionOrders");
const sectionProducts = document.getElementById("sectionProducts");
const sectionShipping = document.getElementById("sectionShipping");
const sectionStoreSettings = document.getElementById("sectionStoreSettings");
const pageTitle = document.getElementById("pageTitle");

// PRODUCT MANAGEMENT ELEMENTS
const productTableBody = document.getElementById("productTableBody");
const productAdminModal = document.getElementById("productAdminModal");
const addProductBtn = document.getElementById("addProductBtn");
const closeProductModalBtn = document.getElementById("closeProductModalBtn");
const productForm = document.getElementById("productForm");

// SHIPPING MANAGEMENT ELEMENTS
const shippingTableBody = document.getElementById("shippingTableBody");
const shippingAdminModal = document.getElementById("shippingAdminModal");
const addShippingBtn = document.getElementById("addShippingBtn");
const closeShippingModalBtn = document.getElementById("closeShippingModalBtn");
const shippingForm = document.getElementById("shippingForm");

// STORE SETTINGS ELEMENTS
const storeSettingsForm = document.getElementById("storeSettingsForm");
const adminWaPhoneInput = document.getElementById("adminWaPhoneInput");
const preorderTargetDateInput = document.getElementById("preorderTargetDateInput");
const bankBcaInput = document.getElementById("bankBcaInput");
const bankMandiriInput = document.getElementById("bankMandiriInput");
const saveStoreSettingsBtn = document.getElementById("saveStoreSettingsBtn");

// TAB SWITCHING NAVIGATION
if (tabOrders && tabProducts && tabShipping) {
  tabOrders.addEventListener("click", (e) => {
    e.preventDefault();
    tabOrders.classList.add("active");
    tabProducts.classList.remove("active");
    tabShipping.classList.remove("active");
    if (tabStoreSettings) tabStoreSettings.classList.remove("active");
    if (sectionOrders) sectionOrders.style.display = "block";
    if (sectionProducts) sectionProducts.style.display = "none";
    if (sectionShipping) sectionShipping.style.display = "none";
    if (sectionStoreSettings) sectionStoreSettings.style.display = "none";
    if (pageTitle) pageTitle.textContent = "Dashboard Pesanan";
  });

  tabProducts.addEventListener("click", (e) => {
    e.preventDefault();
    tabProducts.classList.add("active");
    tabOrders.classList.remove("active");
    tabShipping.classList.remove("active");
    if (tabStoreSettings) tabStoreSettings.classList.remove("active");
    if (sectionProducts) sectionProducts.style.display = "block";
    if (sectionOrders) sectionOrders.style.display = "none";
    if (sectionShipping) sectionShipping.style.display = "none";
    if (sectionStoreSettings) sectionStoreSettings.style.display = "none";
    if (pageTitle) pageTitle.textContent = "Kelola Produk";
    loadProductsAdmin();
  });

  tabShipping.addEventListener("click", (e) => {
    e.preventDefault();
    tabShipping.classList.add("active");
    tabOrders.classList.remove("active");
    tabProducts.classList.remove("active");
    if (tabStoreSettings) tabStoreSettings.classList.remove("active");
    if (sectionShipping) sectionShipping.style.display = "block";
    if (sectionOrders) sectionOrders.style.display = "none";
    if (sectionProducts) sectionProducts.style.display = "none";
    if (sectionStoreSettings) sectionStoreSettings.style.display = "none";
    if (pageTitle) pageTitle.textContent = "Pengaturan Ongkir";
    loadShippingRatesAdmin();
  });

  if (tabStoreSettings) {
    tabStoreSettings.addEventListener("click", (e) => {
      e.preventDefault();
      tabStoreSettings.classList.add("active");
      tabOrders.classList.remove("active");
      tabProducts.classList.remove("active");
      tabShipping.classList.remove("active");
      if (sectionStoreSettings) sectionStoreSettings.style.display = "block";
      if (sectionOrders) sectionOrders.style.display = "none";
      if (sectionProducts) sectionProducts.style.display = "none";
      if (sectionShipping) sectionShipping.style.display = "none";
      if (pageTitle) pageTitle.textContent = "Pengaturan Toko & Pre-Order";
      loadStoreSettingsAdmin();
    });
  }
}


// =====================================================
// CHECK LOGIN
// =====================================================

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "login.html";

    return;

  }


  // Tampilkan email admin

  if (adminEmail) {

    adminEmail.textContent =
      user.email || "Admin";

  }


  // Ambil data pesanan

  loadOrders();

});


// =====================================================
// LOAD ORDERS
// =====================================================

// =====================================================
// LOAD ORDERS (WITH BUKTI TRANSFER & CONFIRMATION)
// =====================================================

async function loadOrders() {

  try {

    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(ordersQuery);

    let total = 0;
    let pending = 0;
    let processing = 0;
    let completed = 0;

    orderTableBody.innerHTML = "";

    if (snapshot.empty) {
      orderTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:50px 20px; color:#888;">
            Belum ada pesanan.
          </td>
        </tr>
      `;
      updateStatistics(0, 0, 0, 0);
      return;
    }

    snapshot.forEach((docSnap) => {
      const order = docSnap.data();
      const docId = docSnap.id;

      total++;

      const status = order.status || "pending";
      if (status === "pending" || status === "menunggu_verifikasi") {
        pending++;
      } else if (status === "confirmed" || status === "pembayaran_dikonfirmasi" || status === "processing") {
        processing++;
      } else if (status === "completed" || status === "shipped") {
        completed++;
      }

      const orderId = docId.substring(0, 8).toUpperCase();
      const productPrice = Number(order.productPrice || order.price || 0);
      const shippingFee = Number(order.shippingFee || 0);
      const totalPrice = Number(order.totalPrice || (productPrice + shippingFee));

      // Status Badge
      let badgeClass = "pending";
      let badgeText = "Menunggu Verifikasi";

      if (status === "confirmed" || status === "pembayaran_dikonfirmasi" || status === "processing") {
        badgeClass = "confirmed";
        badgeText = "Dikonfirmasi";
      } else if (status === "rejected" || status === "pembayaran_ditolak") {
        badgeClass = "rejected";
        badgeText = "Ditolak";
      } else if (status === "completed") {
        badgeClass = "confirmed";
        badgeText = "Selesai";
      }

      // Bukti Transfer
      let proofHtml = `<span style="color:#aaa; font-size:12px;">Tanpa Bukti</span>`;
      if (order.paymentProofImage) {
        proofHtml = `<img src="${order.paymentProofImage}" class="proof-thumb" onclick="openPaymentProofModal('${order.paymentProofImage}', '${docId}', '${status}')" title="Klik untuk memperbesar">`;
      }

      // Action Buttons
      let actionButtonsHtml = ``;
      if (status === "pending" || status === "menunggu_verifikasi") {
        actionButtonsHtml = `
          <button type="button" class="btn-confirm-admin" onclick="confirmOrderPayment('${docId}')" title="Konfirmasi Pembayaran">
            <i class="bx bx-check-circle"></i> Konfirmasi
          </button>
          <button type="button" class="btn-reject-admin" onclick="rejectOrderPayment('${docId}')" title="Tolak Pembayaran" style="margin-top: 4px;">
            <i class="bx bx-x-circle"></i> Tolak
          </button>
        `;
      } else if (status === "confirmed" || status === "pembayaran_dikonfirmasi") {
        actionButtonsHtml = `<span style="color: #198754; font-size: 12px; font-weight: 600;"><i class="bx bx-check-double"></i> Terverifikasi</span>`;
      } else if (status === "rejected" || status === "pembayaran_ditolak") {
        actionButtonsHtml = `<span style="color: #dc3545; font-size: 12px; font-weight: 600;"><i class="bx bx-x-circle"></i> Ditolak</span>`;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong class="order-id">#${orderId}</strong></td>
        <td>
          <strong>${escapeHTML(order.productName || "Product")}</strong>
        </td>
        <td>
          <strong>${escapeHTML(order.customerName || "-")}</strong><br>
          <small style="color:#666;">${escapeHTML(order.phone || "-")}</small>
        </td>
        <td>${escapeHTML(order.size || "-")} (${order.quantity || 1} pcs)</td>
        <td>
          <small style="color:#555;">${escapeHTML(order.shippingRegion || "Standard")}</small><br>
          <strong>Rp ${shippingFee.toLocaleString("id-ID")}</strong>
        </td>
        <td><strong style="color:#111;">Rp ${totalPrice.toLocaleString("id-ID")}</strong></td>
        <td>${proofHtml}</td>
        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        <td>${actionButtonsHtml}</td>
      `;

      orderTableBody.appendChild(row);
    });

    updateStatistics(total, pending, processing, completed);

  } catch (error) {
    console.error("Gagal mengambil pesanan:", error);
    orderTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:50px 20px; color:#888;">
          Gagal mengambil data pesanan.
        </td>
      </tr>
    `;
  }
}

// Payment Action Functions
window.confirmOrderPayment = async function(orderId) {
  if (!confirm("Konfirmasi bahwa pembayaran untuk pesanan ini telah DITERIMA?")) return;
  try {
    await updateDoc(doc(db, "orders", orderId), { status: "confirmed" });
    alert("Pembayaran berhasil dikonfirmasi! Pesanan lanjut diproses 🎉");
    loadOrders();
  } catch (err) {
    console.error("Gagal konfirmasi pembayaran:", err);
    alert("Gagal konfirmasi pembayaran. Silakan coba lagi.");
  }
};

window.rejectOrderPayment = async function(orderId) {
  if (!confirm("Apakah Anda yakin ingin MENOLAK bukti transfer pesanan ini?")) return;
  try {
    await updateDoc(doc(db, "orders", orderId), { status: "rejected" });
    alert("Pembayaran ditolak.");
    loadOrders();
  } catch (err) {
    console.error("Gagal menolak pembayaran:", err);
    alert("Gagal menolak pembayaran. Silakan coba lagi.");
  }
};

window.openPaymentProofModal = function(imgUrl, orderId, status) {
  const proofModal = document.getElementById("paymentProofModal");
  const proofImg = document.getElementById("proofModalImg");
  const actionsDiv = document.getElementById("proofModalActions");

  if (proofModal && proofImg) {
    proofImg.src = imgUrl;
    if (actionsDiv) {
      if (status === "pending" || status === "menunggu_verifikasi") {
        actionsDiv.innerHTML = `
          <button type="button" class="btn-confirm-admin" style="padding: 10px 20px; font-size: 14px;" onclick="confirmOrderPayment('${orderId}'); document.getElementById('paymentProofModal').classList.remove('show');">
            <i class="bx bx-check-circle"></i> Konfirmasi Pembayaran Ini
          </button>
          <button type="button" class="btn-reject-admin" style="padding: 10px 20px; font-size: 14px;" onclick="rejectOrderPayment('${orderId}'); document.getElementById('paymentProofModal').classList.remove('show');">
            <i class="bx bx-x-circle"></i> Tolak Pembayaran
          </button>
        `;
      } else {
        actionsDiv.innerHTML = `<span style="color: #666; font-size: 13px;">Bukti transfer telah ditinjau (${status}).</span>`;
      }
    }
    proofModal.classList.add("show");
  }
};

const closeProofModalBtn = document.getElementById("closeProofModalBtn");
if (closeProofModalBtn) {
  closeProofModalBtn.addEventListener("click", () => {
    document.getElementById("paymentProofModal").classList.remove("show");
  });
}

// Shipping Rates Management

// Default Shipping Rates Data
const DEFAULT_SHIPPING_RATES = [
  { region: "Jabodetabek", fee: 10000, estimate: "1-2 Hari Kerja" },
  { region: "Pulau Jawa (Luar Jabodetabek)", fee: 15000, estimate: "2-3 Hari Kerja" },
  { region: "Sumatera, Bali, NTB / NTT", fee: 25000, estimate: "3-5 Hari Kerja" },
  { region: "Kalimantan & Sulawesi", fee: 35000, estimate: "3-5 Hari Kerja" },
  { region: "Papua & Maluku", fee: 45000, estimate: "5-7 Hari Kerja" }
];

async function loadShippingRatesAdmin() {
  if (!shippingTableBody) return;
  shippingTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px;"><i class="bx bx-loader-alt bx-spin"></i> Memuat data ongkir...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "shipping_rates"));
    if (snapshot.empty) {
      for (const rate of DEFAULT_SHIPPING_RATES) {
        await addDoc(collection(db, "shipping_rates"), rate);
      }
      return loadShippingRatesAdmin();
    }

    shippingTableBody.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${escapeHTML(data.region || "-")}</strong></td>
        <td><strong style="color: #198754;">Rp ${Number(data.fee || 0).toLocaleString("id-ID")}</strong></td>
        <td>${escapeHTML(data.estimate || "-")}</td>
        <td>
          <button type="button" class="btn-edit-admin" onclick="openShippingModal('${id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">
            <i class="bx bx-edit"></i> Edit
          </button>
          <button type="button" class="btn-reject-admin" onclick="deleteShippingRate('${id}', '${escapeHTML(data.region || '')}')" style="margin-left: 6px;">
            <i class="bx bx-trash"></i> Hapus
          </button>
        </td>
      `;
      shippingTableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Gagal memuat ongkir:", err);
    shippingTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888;">Gagal memuat data ongkir.</td></tr>`;
  }
}

window.openShippingModal = function(id = "", data = null) {
  const modalTitle = document.getElementById("shippingModalTitle");
  const shippingId = document.getElementById("adminShippingId");
  const regionInput = document.getElementById("adminShippingRegion");
  const feeInput = document.getElementById("adminShippingFee");
  const estimateInput = document.getElementById("adminShippingEstimate");

  if (id && data) {
    modalTitle.textContent = "Edit Wilayah Ongkir";
    shippingId.value = id;
    regionInput.value = data.region || "";
    feeInput.value = data.fee || 0;
    estimateInput.value = data.estimate || "";
  } else {
    modalTitle.textContent = "Tambah Wilayah Ongkir";
    shippingId.value = "";
    if (shippingForm) shippingForm.reset();
  }
  if (shippingAdminModal) shippingAdminModal.classList.add("show");
};

if (addShippingBtn) {
  addShippingBtn.addEventListener("click", () => openShippingModal());
}

if (closeShippingModalBtn) {
  closeShippingModalBtn.addEventListener("click", () => {
    shippingAdminModal.classList.remove("show");
  });
}

if (shippingForm) {
  shippingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("adminShippingId").value;
    const region = document.getElementById("adminShippingRegion").value.trim();
    const fee = Number(document.getElementById("adminShippingFee").value);
    const estimate = document.getElementById("adminShippingEstimate").value.trim();
    const submitBtn = document.getElementById("saveShippingSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";

    try {
      const payload = { region, fee, estimate };
      if (id) {
        await updateDoc(doc(db, "shipping_rates", id), payload);
        alert("Wilayah & tarif ongkir berhasil diperbarui! 🎉");
      } else {
        await addDoc(collection(db, "shipping_rates"), payload);
        alert("Wilayah & tarif ongkir baru berhasil ditambahkan! 🎉");
      }
      shippingAdminModal.classList.remove("show");
      shippingForm.reset();
      loadShippingRatesAdmin();
    } catch (err) {
      console.error("Gagal menyimpan ongkir:", err);
      alert("Gagal menyimpan ongkir. Silakan coba lagi.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Simpan Tarif Ongkir";
    }
  });
}

window.deleteShippingRate = async function(id, regionName) {
  if (!confirm(`Hapus tarif ongkir wilayah "${regionName}"?`)) return;
  try {
    await deleteDoc(doc(db, "shipping_rates", id));
    alert("Wilayah ongkir berhasil dihapus! 🗑️");
    loadShippingRatesAdmin();
  } catch (err) {
    console.error("Gagal menghapus ongkir:", err);
    alert("Gagal menghapus ongkir.");
  }
};


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStatistics(
  total,
  pending,
  processing,
  completed
) {

  if (totalOrders) {

    totalOrders.textContent =
      total;

  }


  if (pendingOrders) {

    pendingOrders.textContent =
      pending;

  }


  if (processingOrders) {

    processingOrders.textContent =
      processing;

  }


  if (completedOrders) {

    completedOrders.textContent =
      completed;

  }

}


// =====================================================
// STATUS LABEL
// =====================================================

function getStatusLabel(status) {

  const labels = {

    pending:
      "Pending",

    confirmed:
      "Dikonfirmasi",

    processing:
      "Produksi",

    shipped:
      "Dikirim",

    completed:
      "Selesai"

  };


  return (
    labels[status] ||
    "Pending"
  );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        window.location.href =
          "login.html";

      } catch (error) {

        console.error(
          "Gagal logout:",
          error
        );

        alert(
          "Gagal logout. Silakan coba lagi."
        );

      }

    }
  );

}

// =====================================================
// DETAIL ORDER MODAL
// =====================================================

document.addEventListener("click", async (event) => {

  const detailBtn =
    event.target.closest(".admin-detail-btn");

  if (!detailBtn) {
    return;
  }


  const orderId =
    detailBtn.dataset.id;


  if (!orderId) {
    return;
  }


  // Cari data order berdasarkan ID
  try {

    const {
      doc,
      getDoc
    } = await import(
      "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js"
    );


    const orderRef =
      doc(
        db,
        "orders",
        orderId
      );


    const orderSnapshot =
      await getDoc(orderRef);


    if (!orderSnapshot.exists()) {

      alert(
        "Pesanan tidak ditemukan."
      );

      return;

    }


    const order =
      orderSnapshot.data();


    showOrderDetail(
      order,
      orderId
    );


  } catch (error) {

    console.error(
      "Gagal mengambil detail pesanan:",
      error
    );


    alert(
      "Gagal mengambil detail pesanan."
    );

  }

});


// =====================================================
// SHOW ORDER DETAIL
// =====================================================

function showOrderDetail(
  order,
  orderId
) {

  // Hapus modal lama jika ada

  const oldModal =
    document.getElementById(
      "adminOrderModal"
    );


  if (oldModal) {

    oldModal.remove();

  }


  // Format harga

  const price =
    Number(order.price || 0);


  const formattedPrice =
    `Rp ${price.toLocaleString("id-ID")}`;


  // Format tanggal

  let orderDate =
    "Tidak tersedia";


  if (
    order.createdAt &&
    typeof order.createdAt.toDate === "function"
  ) {

    orderDate =
      order.createdAt
        .toDate()
        .toLocaleString(
          "id-ID",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }
        );

  }


  // Status

  const status =
    order.status || "pending";


  // ===================================================
  // CREATE MODAL
  // ===================================================

  const modal =
    document.createElement("div");


  modal.id =
    "adminOrderModal";


  modal.innerHTML = `

    <div class="admin-order-overlay">

      <div class="admin-order-modal">


        <!-- CLOSE -->

        <button
          type="button"
          class="admin-modal-close"
          id="adminModalClose"
        >

          &times;

        </button>


        <!-- HEADER -->

        <div class="admin-modal-header">

          <p>
            ORDER DETAIL
          </p>

          <h2>
            #${orderId
              .substring(0, 8)
              .toUpperCase()}
          </h2>

        </div>


        <!-- PRODUCT -->

        <div class="admin-detail-section">

          <h3>
            Informasi Produk
          </h3>


          <div class="admin-detail-grid">

            <div>

              <span>
                Produk
              </span>

              <strong>
                ${escapeHTML(
                  order.productName ||
                  "-"
                )}
              </strong>

            </div>


            <div>

              <span>
                Size
              </span>

              <strong>
                ${escapeHTML(
                  order.size ||
                  "-"
                )}
              </strong>

            </div>


            <div>

              <span>
                Jumlah
              </span>

              <strong>
                ${order.quantity || 1}
                pcs
              </strong>

            </div>


            <div>

              <span>
                Total Harga
              </span>

              <strong>
                ${formattedPrice}
              </strong>

            </div>

          </div>

        </div>


        <!-- CUSTOMER -->

        <div class="admin-detail-section">

          <h3>
            Informasi Pemesan
          </h3>


          <div class="admin-detail-grid">

            <div>

              <span>
                Nama
              </span>

              <strong>
                ${escapeHTML(
                  order.customerName ||
                  "-"
                )}
              </strong>

            </div>


            <div>

              <span>
                WhatsApp
              </span>

              <strong>
                ${escapeHTML(
                  order.phone ||
                  "-"
                )}
              </strong>

            </div>


            <div class="full">

              <span>
                Alamat
              </span>

              <strong>
                ${escapeHTML(
                  order.address ||
                  "-"
                )}
              </strong>

            </div>


            <div class="full">

              <span>
                Tanggal Pesanan
              </span>

              <strong>
                ${orderDate}
              </strong>

            </div>

          </div>

        </div>


        <!-- STATUS -->

        <!-- STATUS -->

<div class="admin-detail-section">

  <h3>
    Status Pesanan
  </h3>


  <div class="
    admin-current-status
    status-${status}
  ">

    Status Saat Ini:

    <strong>
      ${getStatusLabel(status)}
    </strong>

  </div>


  <label
    for="adminStatusSelect"
    class="admin-status-label"
  >
    Ubah Status Pesanan
  </label>


  <select
    id="adminStatusSelect"
    class="admin-status-select"
  >

    <option
      value="pending"
      ${status === "pending" ? "selected" : ""}
    >
      Pesanan Diterima
    </option>


    <option
      value="confirmed"
      ${status === "confirmed" ? "selected" : ""}
    >
      Pesanan Dikonfirmasi
    </option>


    <option
      value="processing"
      ${status === "processing" ? "selected" : ""}
    >
      Sedang Diproduksi
    </option>


    <option
      value="shipped"
      ${status === "shipped" ? "selected" : ""}
    >
      Pesanan Dikirim
    </option>


    <option
      value="completed"
      ${status === "completed" ? "selected" : ""}
    >
      Pesanan Selesai
    </option>

  </select>


  <button
    type="button"
    id="saveOrderStatusBtn"
    class="save-order-status-btn"
  >
    Simpan Status
  </button>

</div>


      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // ===================================================
  // CLOSE BUTTON
  // ===================================================

  const closeBtn =
    document.getElementById(
      "adminModalClose"
    );


  if (closeBtn) {

    closeBtn.addEventListener(
      "click",
      () => {

        modal.remove();

      }
    );

  }


  // ===================================================
  // CLICK OUTSIDE
  // ===================================================

  modal.addEventListener(
    "click",
    (event) => {

      if (
        event.target.classList
          .contains(
            "admin-order-overlay"
          )
      ) {

        modal.remove();

      }

    }
  );

}


// =====================================================
// PRODUCT MANAGEMENT HELPERS & FUNCTIONS
// =====================================================

// Helper gambar admin
function getImagePathAdmin(image) {
  if (!image) return "";
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("./") ||
    image.startsWith("/") ||
    image.startsWith("../")
  ) {
    return image;
  }
  return `../${image}`;
}

// Load Products Admin
async function loadProductsAdmin() {
  if (!productTableBody) return;

  productTableBody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align:center; padding:30px; color:#888;">
        <i class="bx bx-loader-alt bx-spin" style="font-size:24px;"></i><br>Memuat produk...
      </td>
    </tr>
  `;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    productTableBody.innerHTML = "";

    if (querySnapshot.empty) {
      productTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:40px; color:#888;">
            Belum ada produk di Firestore. Klik "Tambah Produk Baru" untuk membuat produk.
          </td>
        </tr>
      `;
      return;
    }

    querySnapshot.forEach((docSnapshot) => {
      const p = docSnapshot.data();
      const id = docSnapshot.id;
      const imgPath = getImagePathAdmin(p.image1);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <img src="${imgPath}" alt="${escapeHTML(p.name || 'Produk')}" class="admin-product-thumb" onerror="this.src='https://via.placeholder.com/50?text=No+Img'">
        </td>
        <td><strong>${escapeHTML(p.name || '-')}</strong></td>
        <td>Rp ${Number(p.price || 0).toLocaleString("id-ID")}</td>
        <td>
          <span class="status-badge ${p.status === 'open' ? 'status-confirmed' : 'status-pending'}">
            ${p.status === 'open' ? 'OPEN PRE-ORDER' : 'CLOSED'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-edit-admin edit-prod-btn" data-id="${id}">
              <i class="bx bx-edit"></i> Edit
            </button>
            <button type="button" class="btn-danger-admin delete-prod-btn" data-id="${id}">
              <i class="bx bx-trash"></i> Hapus
            </button>
          </div>
        </td>
      `;
      productTableBody.appendChild(tr);

      const editBtn = tr.querySelector(".edit-prod-btn");
      editBtn.addEventListener("click", () => openProductModal(id, p));

      const deleteBtn = tr.querySelector(".delete-prod-btn");
      deleteBtn.addEventListener("click", () => deleteProductAdmin(id, p.name));
    });
  } catch (error) {
    console.error("Gagal mengambil data produk admin:", error);
    productTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:30px; color:#c62828;">
          Gagal mengambil data produk.
        </td>
      </tr>
    `;
  }
}

// Image File Picker Setup Helper
function setupImageUploader(fileInputId, textInputId, previewBoxId, previewImgId, removeBtnId) {
  const fileInput = document.getElementById(fileInputId);
  const textInput = document.getElementById(textInputId);
  const previewBox = document.getElementById(previewBoxId);
  const previewImg = document.getElementById(previewImgId);
  const removeBtn = document.getElementById(removeBtnId);

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const base64Data = evt.target.result;
          textInput.value = base64Data;
          previewImg.src = base64Data;
          previewBox.style.display = "inline-block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (textInput) {
    textInput.addEventListener("input", () => {
      const val = textInput.value.trim();
      if (val) {
        previewImg.src = getImagePathAdmin(val);
        previewBox.style.display = "inline-block";
      } else {
        previewBox.style.display = "none";
      }
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      textInput.value = "";
      if (fileInput) fileInput.value = "";
      previewBox.style.display = "none";
      previewImg.src = "";
    });
  }
}

function updateImagePreviewDisplay(textInputId, previewBoxId, previewImgId) {
  const textInput = document.getElementById(textInputId);
  const previewBox = document.getElementById(previewBoxId);
  const previewImg = document.getElementById(previewImgId);

  if (textInput && previewBox && previewImg) {
    const val = textInput.value.trim();
    if (val) {
      previewImg.src = getImagePathAdmin(val);
      previewBox.style.display = "inline-block";
    } else {
      previewBox.style.display = "none";
      previewImg.src = "";
    }
  }
}

// Initialize Image Uploaders
setupImageUploader("fileImage1", "adminProductImage1", "previewBox1", "previewImg1", "removeImg1Btn");
setupImageUploader("fileImage2", "adminProductImage2", "previewBox2", "previewImg2", "removeImg2Btn");
setupImageUploader("fileImage3", "adminProductImage3", "previewBox3", "previewImg3", "removeImg3Btn");

// Open Product Modal (Add or Edit)
function openProductModal(id = "", data = null) {
  const modalTitle = document.getElementById("productModalTitle");
  const productId = document.getElementById("adminProductId");
  const productName = document.getElementById("adminProductName");
  const productPrice = document.getElementById("adminProductPrice");
  const productStatus = document.getElementById("adminProductStatus");
  const productDesc = document.getElementById("adminProductDesc");
  const productImage1 = document.getElementById("adminProductImage1");
  const productImage2 = document.getElementById("adminProductImage2");
  const productImage3 = document.getElementById("adminProductImage3");

  if (id && data) {
    modalTitle.textContent = "Edit Produk";
    productId.value = id;
    productName.value = data.name || "";
    productPrice.value = data.price || 0;
    productStatus.value = data.status || "open";
    productDesc.value = data.description || "";
    productImage1.value = data.image1 || "";
    productImage2.value = data.image2 || "";
    productImage3.value = data.image3 || "";
  } else {
    modalTitle.textContent = "Tambah Produk Baru";
    productId.value = "";
    if (productForm) productForm.reset();
  }

  updateImagePreviewDisplay("adminProductImage1", "previewBox1", "previewImg1");
  updateImagePreviewDisplay("adminProductImage2", "previewBox2", "previewImg2");
  updateImagePreviewDisplay("adminProductImage3", "previewBox3", "previewImg3");

  if (productAdminModal) productAdminModal.classList.add("show");
}

// Close Product Modal
if (closeProductModalBtn) {
  closeProductModalBtn.addEventListener("click", () => {
    productAdminModal.classList.remove("show");
  });
}

if (productAdminModal) {
  productAdminModal.addEventListener("click", (e) => {
    if (e.target === productAdminModal) {
      productAdminModal.classList.remove("show");
    }
  });
}

if (addProductBtn) {
  addProductBtn.addEventListener("click", () => openProductModal());
}

// Submit Form (Save/Update Product)
if (productForm) {
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("adminProductId").value;
    const name = document.getElementById("adminProductName").value.trim();
    const price = Number(document.getElementById("adminProductPrice").value);
    const status = document.getElementById("adminProductStatus").value;
    const description = document.getElementById("adminProductDesc").value.trim();
    const image1 = document.getElementById("adminProductImage1").value.trim();
    const image2 = document.getElementById("adminProductImage2").value.trim();
    const image3 = document.getElementById("adminProductImage3").value.trim();

    const submitBtn = document.getElementById("saveProductSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";

    try {
      const productPayload = {
        name,
        price,
        status,
        description,
        image1,
        image2,
        image3
      };

      if (id) {
        await updateDoc(doc(db, "products", id), productPayload);
        alert("Produk berhasil diperbarui! 🎉");
      } else {
        await addDoc(collection(db, "products"), productPayload);
        alert("Produk baru berhasil ditambahkan! 🎉");
      }

      productAdminModal.classList.remove("show");
      productForm.reset();
      loadProductsAdmin();
    } catch (error) {
      console.error("Gagal menyimpan produk:", error);
      alert("Gagal menyimpan produk. Silakan coba lagi.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Simpan Produk";
    }
  });
}

// Delete Product
async function deleteProductAdmin(id, productName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus produk "${productName || 'ini'}"?`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "products", id));
    alert("Produk berhasil dihapus! 🗑️");
    loadProductsAdmin();
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
    alert("Gagal menghapus produk. Silakan coba lagi.");
  }
}
window.deleteProductAdmin = deleteProductAdmin;


// =====================================================
// STORE SETTINGS (WA, COUNTDOWN, BANK ACCOUNTS)
// =====================================================
async function loadStoreSettingsAdmin() {
  if (!adminWaPhoneInput) return;

  try {
    const docSnap = await getDoc(doc(db, "store_settings", "general"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (adminWaPhoneInput) adminWaPhoneInput.value = data.adminWaPhone || "6281234567890";
      if (preorderTargetDateInput && data.preorderTargetDate) {
        preorderTargetDateInput.value = data.preorderTargetDate;
      }
      if (bankBcaInput) bankBcaInput.value = data.bankBca || "1234567890 a.n. USKUTLAB";
      if (bankMandiriInput) bankMandiriInput.value = data.bankMandiri || "0987654321 a.n. USKUTLAB";
    } else {
      if (adminWaPhoneInput) adminWaPhoneInput.value = "6281234567890";
      if (preorderTargetDateInput) preorderTargetDateInput.value = "2026-12-30T23:59";
      if (bankBcaInput) bankBcaInput.value = "1234567890 a.n. USKUTLAB";
      if (bankMandiriInput) bankMandiriInput.value = "0987654321 a.n. USKUTLAB";
    }
  } catch (err) {
    console.error("Gagal memuat pengaturan toko:", err);
  }
}

if (storeSettingsForm) {
  storeSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const adminWaPhone = adminWaPhoneInput.value.trim();
    const preorderTargetDate = preorderTargetDateInput.value;
    const bankBca = bankBcaInput.value.trim();
    const bankMandiri = bankMandiriInput.value.trim();

    if (!adminWaPhone || !preorderTargetDate || !bankBca || !bankMandiri) {
      alert("Mohon isi semua bidang pengaturan toko.");
      return;
    }

    if (saveStoreSettingsBtn) {
      saveStoreSettingsBtn.disabled = true;
      saveStoreSettingsBtn.innerHTML = `<i class="bx bx-loader-alt bx-spin"></i> Menyimpan...`;
    }

    try {
      await setDoc(doc(db, "store_settings", "general"), {
        adminWaPhone,
        preorderTargetDate,
        bankBca,
        bankMandiri,
        updatedAt: new Date()
      }, { merge: true });

      alert("Pengaturan Toko & Pre-Order berhasil disimpan! 🎉");
    } catch (err) {
      console.error("Gagal menyimpan pengaturan toko:", err);
      alert("Gagal menyimpan pengaturan toko. Silakan coba lagi.");
    } finally {
      if (saveStoreSettingsBtn) {
        saveStoreSettingsBtn.disabled = false;
        saveStoreSettingsBtn.innerHTML = `<i class="bx bx-save"></i> Simpan Pengaturan Toko`;
      }
    }
  });
}