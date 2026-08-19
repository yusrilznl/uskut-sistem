import { db } from "../Firebase/config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


/* =====================================================
   PRODUCT GRID
===================================================== */

const productGrid = document.querySelector(".product-grid");


/* =====================================================
   FUNGSI GAMBAR
===================================================== */

function getImagePath(image) {

  if (!image) {
    return "";
  }

  /*
    Jika Firebase berisi:
    uskut-product-1.png

    maka browser menggunakan:
    ./uskut-product-1.png
  */

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("./") ||
    image.startsWith("/")
  ) {
    return image;
  }

  return `./${image}`;
}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

  try {

    const querySnapshot = await getDocs(
      collection(db, "products")
    );


    /* Bersihkan grid */

    productGrid.innerHTML = "";


    /* Jika produk kosong */

    if (querySnapshot.empty) {

      productGrid.innerHTML = `
        <p style="
          text-align:center;
          width:100%;
          color:#777;
        ">
          Belum ada produk tersedia.
        </p>
      `;

      return;
    }


    /* =================================================
       LOOP PRODUCT
    ================================================= */

    querySnapshot.forEach((doc) => {

      const product = doc.data();


      /* =================================================
         GAMBAR
      ================================================= */

      const image1 = (product.image1 && product.image1.trim()) ? getImagePath(product.image1.trim()) : "";
      const image2 = (product.image2 && product.image2.trim()) ? getImagePath(product.image2.trim()) : image1;
      const image3 = (product.image3 && product.image3.trim()) ? getImagePath(product.image3.trim()) : image1;


      console.log("Produk:", product.name);
      console.log("Image 1:", image1);
      console.log("Image 2:", image2);
      console.log("Image 3:", image3);


      /* =================================================
         PRODUCT CARD
      ================================================= */

      const card = document.createElement("div");

      card.className = "product-card";


      card.innerHTML = `

        <!-- PRODUCT IMAGE -->

        <div class="product-slider">

          <div class="slider-images">

            <img
              src="${image1}"
              alt="${product.name || "Product"}"
            >

            <img
              src="${image2}"
              alt="${product.name || "Product"}"
            >

            <img
              src="${image3}"
              alt="${product.name || "Product"}"
            >

          </div>


          <!-- PREVIOUS -->

          <button
            class="slider-btn prev"
            type="button"
          >
            <i class="bx bx-chevron-left"></i>
          </button>


          <!-- NEXT -->

          <button
            class="slider-btn next"
            type="button"
          >
            <i class="bx bx-chevron-right"></i>
          </button>

        </div>


        <!-- PRODUCT INFO -->

        <div class="product-info">

          <p class="badge">

            ${
              product.status === "open"
                ? "OPEN PRE-ORDER"
                : "CLOSED"
            }

          </p>


          <div class="product-row">

            <h3>
              ${product.name || "Unnamed Product"}
            </h3>

            <p class="price">

              Rp ${
                Number(product.price || 0)
                  .toLocaleString("id-ID")
              }

            </p>

          </div>


          <button
            class="view-btn"
            type="button"
          >
            <i class="bx bx-show"></i> Lihat Detail
          </button>

        </div>

      `;


      /* =================================================
         MASUKKAN KE GRID
      ================================================= */

      productGrid.appendChild(card);


      /* =================================================
         CLICK CARD TO OPEN PRODUCT DETAIL MODAL
      ================================================= */

      card.addEventListener("click", (e) => {
        if (e.target.closest(".slider-btn")) {
          return; // Don't trigger modal when clicking slider arrow buttons
        }
        openProductModal(product);
      });


      /* =================================================
         PRODUCT SLIDER
      ================================================= */

      const images =
        card.querySelector(".slider-images");

      const slides =
        card.querySelectorAll(".slider-images img");

      const nextBtn =
        card.querySelector(".next");

      const prevBtn =
        card.querySelector(".prev");


      let currentIndex = 0;


      function updateSlider() {

        images.style.transform =
          `translateX(-${currentIndex * 100}%)`;

      }


      nextBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        currentIndex =
          (currentIndex + 1) % slides.length;

        updateSlider();

      });


      prevBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        currentIndex =
          (currentIndex - 1 + slides.length)
          % slides.length;

        updateSlider();

      });


      /* =================================================
         DETAIL PRODUCT BUTTON DATA
      ================================================= */

      const viewBtn =
        card.querySelector(".view-btn");

      viewBtn.dataset.name =
        product.name || "";

      viewBtn.dataset.price =
        product.price || 0;

      viewBtn.dataset.desc =
        product.description || "";

      viewBtn.dataset.image1 =
        image1;

      viewBtn.dataset.image2 =
        image2;

      viewBtn.dataset.image3 =
        image3;

    });


  } catch (error) {

    console.error(
      "Gagal mengambil produk dari Firebase:",
      error
    );


    productGrid.innerHTML = `
      <p style="
        text-align:center;
        width:100%;
        color:#777;
      ">
        Gagal mengambil data produk.
      </p>
    `;

  }

}


/* =====================================================
   OPEN PRODUCT MODAL
===================================================== */

function openProductModal(product) {

  const modal =
    document.getElementById("productModal");

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


  /* =================================================
     DATA PRODUK
  ================================================= */

  const image1 = (product.image1 && product.image1.trim()) ? getImagePath(product.image1.trim()) : "";
  const image2 = (product.image2 && product.image2.trim()) ? getImagePath(product.image2.trim()) : image1;
  const image3 = (product.image3 && product.image3.trim()) ? getImagePath(product.image3.trim()) : image1;

  if (modalTitle) {
    modalTitle.textContent = product.name || "Product";
  }

  if (modalPrice) {
    modalPrice.textContent = `Rp ${Number(product.price || 0).toLocaleString("id-ID")}`;
  }

  if (modalDesc) {
    modalDesc.textContent = product.description || "Tidak ada deskripsi produk.";
  }

  /* GAMBAR MODAL DENGAN FALLBACK AUTOMATIS */
  if (modalImage1) {
    modalImage1.src = image1;
  }

  if (modalImage2) {
    modalImage2.src = image2 || image1;
    modalImage2.onerror = function () {
      if (image1) this.src = image1;
    };
  }

  if (modalImage3) {
    modalImage3.src = image3 || image1;
    modalImage3.onerror = function () {
      if (image1) this.src = image1;
    };
  }


  /* =================================================
     SIMPAN PRODUK
  ================================================= */

  window.selectedProduct =
    product;

  window.selectedSize =
    "";


  /* =================================================
     RESET SIZE
  ================================================= */

  document
    .querySelectorAll(".size-btn")
    .forEach((button) => {

      button.classList.remove("active");

    });


  /* =================================================
     RESET SLIDER
  ================================================= */

  const modalSlider =
    document.getElementById(
      "modalSliderImages"
    );


  if (modalSlider) {

    modalSlider.style.transform =
      "translateX(0%)";

  }


  window.modalIndex = 0;


  /* =================================================
     SHOW MODAL
  ================================================= */

  if (modal) {

    modal.classList.add("show");

  }

}


/* =====================================================
   CLOSE MODAL
===================================================== */

const closeModal =
  document.querySelector(".close-modal");


if (closeModal) {

  closeModal.addEventListener("click", () => {

    const modal =
      document.getElementById("productModal");

    if (modal) {

      modal.classList.remove("show");

    }

  });

}


/* =====================================================
   CLOSE OUTSIDE MODAL
===================================================== */

const modal =
  document.getElementById("productModal");


if (modal) {

  window.addEventListener("click", (event) => {

    if (event.target === modal) {

      modal.classList.remove("show");

    }

  });

}


/* =====================================================
   SIZE SELECT
===================================================== */

const sizeButtons =
  document.querySelectorAll(".size-btn");


sizeButtons.forEach((button) => {

  button.addEventListener("click", () => {

    sizeButtons.forEach((btn) => {

      btn.classList.remove("active");

    });


    button.classList.add("active");


    window.selectedSize =
      button.textContent.trim();

  });

});


/* =====================================================
   MODAL IMAGE SLIDER
===================================================== */

const modalSlider =
  document.getElementById(
    "modalSliderImages"
  );


const modalNext =
  document.querySelector(".modal-next");


const modalPrev =
  document.querySelector(".modal-prev");


window.modalIndex = 0;


function updateModalSlider() {

  if (!modalSlider) {

    return;

  }


  modalSlider.style.transform =
    `translateX(-${window.modalIndex * 100}%)`;

}


if (modalNext) {

  modalNext.addEventListener("click", () => {

    window.modalIndex =
      (window.modalIndex + 1) % 3;

    updateModalSlider();

  });

}


if (modalPrev) {

  modalPrev.addEventListener("click", () => {

    window.modalIndex =
      (window.modalIndex - 1 + 3) % 3;

    updateModalSlider();

  });

}


/* =====================================================
   START
===================================================== */

loadProducts();