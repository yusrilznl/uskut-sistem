import { db } from "../Firebase/config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


/* =====================================================
   ELEMENT
===================================================== */

const searchPhone =
  document.getElementById("searchPhone");

const searchOrderBtn =
  document.getElementById("searchOrderBtn");

const orderResult =
  document.getElementById("orderResult");


/* =====================================================
   STATUS ORDER
===================================================== */

const statusList = [

  {
    key: "menunggu_verifikasi",
    label: "Menunggu Verifikasi Pembayaran",
    icon: "bx-receipt"
  },

  {
    key: "confirmed",
    label: "Pembayaran Dikonfirmasi",
    icon: "bx-check-circle"
  },

  {
    key: "processing",
    label: "Sedang Diproduksi",
    icon: "bx-loader-circle"
  },

  {
    key: "shipped",
    label: "Pesanan Dikirim",
    icon: "bx-package"
  },

  {
    key: "completed",
    label: "Pesanan Selesai",
    icon: "bx-check-double"
  }

];


function normalizePhone(input) {
  if (!input) return "";
  let clean = input.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  return clean;
}

/* =====================================================
   SEARCH ORDER
===================================================== */

async function searchOrder() {

  const rawPhone = searchPhone.value.trim();
  const normalizedPhone = normalizePhone(rawPhone);

  /* =================================================
     VALIDASI
  ================================================= */

  if (!rawPhone) {

    alert(
      "Silakan masukkan nomor WhatsApp terlebih dahulu."
    );

    searchPhone.focus();

    return;

  }


  /* =================================================
     LOADING BUTTON
  ================================================= */

  searchOrderBtn.disabled = true;

  searchOrderBtn.innerHTML = `
    <i class="bx bx-loader-alt bx-spin"></i>
    Mencari...
  `;


  /* =================================================
     LOADING RESULT
  ================================================= */

  orderResult.innerHTML = `

    <div class="loading-order">

      <i class="bx bx-loader-alt bx-spin"></i>

      <p>
        Sedang mencari pesanan...
      </p>

    </div>

  `;


  try {

    /* =================================================
       FIRESTORE QUERY (Search both raw and normalized)
    ================================================= */

    const phoneOptions = Array.from(new Set([rawPhone, normalizedPhone].filter(Boolean)));

    const ordersQuery = query(

      collection(db, "orders"),

      where(
        "phone",
        "in",
        phoneOptions
      )

    );


    const querySnapshot =
      await getDocs(ordersQuery);


    console.log(
      "Jumlah pesanan ditemukan:",
      querySnapshot.size
    );


    /* =================================================
       JIKA TIDAK ADA PESANAN
    ================================================= */

    if (querySnapshot.empty) {

      orderResult.innerHTML = `

        <div class="empty-order">

          <i class="bx bx-search-alt"></i>

          <h3>
            Pesanan Tidak Ditemukan
          </h3>

          <p>
            Tidak ditemukan pesanan dengan nomor
            WhatsApp tersebut.
          </p>

        </div>

      `;

      return;

    }


    /* =================================================
       BERSIHKAN HASIL LAMA
    ================================================= */

    orderResult.innerHTML = "";


    /* =================================================
       TAMPILKAN SEMUA PESANAN
    ================================================= */

    querySnapshot.forEach((doc) => {

      const order =
        doc.data();


      displayOrder(
        order,
        doc.id
      );

    });


  } catch (error) {

    console.error(
      "Gagal mencari pesanan:",
      error
    );


    orderResult.innerHTML = `

      <div class="error-order">

        <i class="bx bx-error-circle"></i>

        <h3>
          Terjadi Kesalahan
        </h3>

        <p>
          Pesanan tidak dapat dimuat.
          Silakan coba lagi.
        </p>

        <small>
          ${escapeHTML(error.message)}
        </small>

      </div>

    `;

  }


  /* =================================================
     RESET BUTTON
  ================================================= */

  searchOrderBtn.disabled = false;

  searchOrderBtn.innerHTML = `

    <i class="bx bx-search"></i>

    Cari Pesanan

  `;

}


/* =====================================================
   DISPLAY ORDER
===================================================== */

function displayOrder(
  order,
  orderId
) {


  /* =================================================
     STATUS
  ================================================= */

  const currentStatus =
    order.status || "pending";


  const currentIndex =
    getStatusIndex(
      currentStatus
    );


  /* =================================================
     PRICE & SHIPPING BREAKDOWN
  ================================================= */

  const productPrice = Number(order.productPrice || order.price || 0);
  const shippingFee = Number(order.shippingFee || 0);
  const totalPrice = Number(order.totalPrice || (productPrice + shippingFee));
  const shippingRegion = order.shippingRegion || "Standard";

  const formattedTotal = `Rp ${totalPrice.toLocaleString("id-ID")}`;
  const formattedSubtotal = `Rp ${productPrice.toLocaleString("id-ID")}`;
  const formattedShipping = `Rp ${shippingFee.toLocaleString("id-ID")}`;


  /* =================================================
     DATE
  ================================================= */

  let orderDate = "Tanggal tidak tersedia";

  if (order.createdAt && typeof order.createdAt.toDate === "function") {
    orderDate = order.createdAt.toDate().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }


  /* =================================================
     CREATE CARD
  ================================================= */

  const card = document.createElement("div");
  card.className = "order-card";

  card.innerHTML = `

    <!-- ORDER HEADER -->

    <div class="order-card-header">

      <div>

        <p class="order-label">
          ORDER
        </p>

        <strong>
          #${orderId.substring(0, 8).toUpperCase()}
        </strong>

      </div>


      <span class="
        order-status
        ${currentStatus}
      ">

        ${getStatusLabel(currentStatus)}

      </span>

    </div>



    <!-- PRODUCT -->

    <div class="order-product">

      <div class="order-product-icon">

        <i class="bx bx-t-shirt"></i>

      </div>


      <div class="order-product-info">

        <h3>
          ${escapeHTML(order.productName || "Product")}
        </h3>

        <p>
          Size ${escapeHTML(order.size || "-")} · ${order.quantity || 1} pcs
        </p>

      </div>


      <strong class="order-price">
        ${formattedTotal}
      </strong>

    </div>



    <!-- CUSTOMER & SHIPPING BREAKDOWN -->

    <div class="order-customer">

      <div>

        <span>
          Pemesan
        </span>

        <strong>
          ${escapeHTML(order.customerName || "-")}
        </strong>

      </div>


      <div>

        <span>
          Nomor WhatsApp
        </span>

        <strong>
          ${escapeHTML(order.phone || "-")}
        </strong>

      </div>


      <div>

        <span>
          Wilayah Pengiriman
        </span>

        <strong>
          ${escapeHTML(shippingRegion)} (${formattedShipping})
        </strong>

      </div>


      <div>

        <span>
          Tanggal Pesanan
        </span>

        <strong>
          ${orderDate}
        </strong>

      </div>

    </div>



    <!-- TIMELINE -->

    <div class="order-timeline">

      ${statusList.map(
        (status, index) => {

          const completed =
            index <= currentIndex
              ? "completed"
              : "";


          const active =
            index === currentIndex
              ? "active"
              : "";


          return `

            <div class="
              timeline-item
              ${completed}
              ${active}
            ">

              <div class="timeline-icon">

                <i class="
                  bx
                  ${status.icon}
                "></i>

              </div>


              <div class="timeline-text">

                <strong>
                  ${status.label}
                </strong>


                ${
                  index === currentIndex
                    ? `
                      <span>
                        Status saat ini
                      </span>
                    `
                    : ""
                }

              </div>

            </div>

          `;

        }
      ).join("")}

    </div>

  `;


  /* =================================================
     ADD CARD
  ================================================= */

  orderResult.appendChild(card);

}


/* =====================================================
   GET STATUS INDEX
===================================================== */

function getStatusIndex(status) {
  if (status === "pending" || status === "menunggu_verifikasi") return 0;
  if (status === "confirmed" || status === "pembayaran_dikonfirmasi") return 1;
  if (status === "processing") return 2;
  if (status === "shipped") return 3;
  if (status === "completed") return 4;
  return 0;
}


/* =====================================================
   STATUS LABEL
===================================================== */

function getStatusLabel(status) {
  if (status === "pending" || status === "menunggu_verifikasi") return "Menunggu Verifikasi Pembayaran";
  if (status === "confirmed" || status === "pembayaran_dikonfirmasi") return "Pembayaran Dikonfirmasi";
  if (status === "rejected" || status === "pembayaran_ditolak") return "Pembayaran Ditolak";
  if (status === "processing") return "Sedang Diproduksi";
  if (status === "shipped") return "Pesanan Dikirim";
  if (status === "completed") return "Pesanan Selesai";
  return "Menunggu Verifikasi Pembayaran";
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


/* =====================================================
   SEARCH BUTTON
===================================================== */

if (searchOrderBtn) {

  searchOrderBtn.addEventListener(
    "click",
    searchOrder
  );

}


/* =====================================================
   ENTER KEY
===================================================== */

if (searchPhone) {

  searchPhone.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {

        searchOrder();

      }

    }
  );

}


/* =====================================================
   DEBUG
===================================================== */

console.log(
  "progress.js berhasil dimuat."
);