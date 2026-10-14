const products = window.superTexProducts;
const $ = (selector) => document.querySelector(selector);
const cart = new Map();
const wishlist = new Set();
const isHomepage = document.body.dataset.homepage === "true";
let category = document.body.dataset.category || "All";
let query = "";
let showingWishlist = false;
let toastTimer;

const money = (amount) => `LKR ${amount.toLocaleString("en-LK")}`;
const priceFor = (product) =>
  isHomepage && product.salePercent
    ? Math.round((product.price * (100 - product.salePercent)) / 100)
    : product.price;

function productCard(product, index = 0) {
  const isWishlisted = wishlist.has(product.id);
  const sale = isHomepage && product.salePercent;

  if (!isHomepage) {
    return `<article class="product-card" style="animation-delay:${index * 55}ms"><div class="product-image-wrap"><img class="product-image" src="${product.image}" alt="${product.alt}" loading="lazy"><span class="product-tag">${product.tag}</span><button class="product-heart${isWishlisted ? " is-liked" : ""}" data-wish="${product.id}" aria-label="Toggle ${product.name} wishlist" aria-pressed="${isWishlisted}">${isWishlisted ? "♥" : "♡"}</button><button class="quick-add" data-add="${product.id}">Add to bag +</button></div><div class="product-info"><div><h3>${product.name}</h3><p>${product.detail}</p></div><span class="product-price">${money(product.price)}</span></div></article>`;
  }

  return `<article class="product-card" style="animation-delay:${index * 45}ms">
    <div class="product-image-wrap">
      <img class="product-image" src="${product.image}" alt="${product.alt}" loading="lazy">
      <span class="product-tag${sale ? " product-tag-sale" : ""}">${sale ? `${product.salePercent}% OFF` : product.tag}</span>
      <button class="product-heart${isWishlisted ? " is-liked" : ""}" data-wish="${product.id}" aria-label="${isWishlisted ? "Remove" : "Add"} ${product.name} ${isWishlisted ? "from" : "to"} wishlist" aria-pressed="${isWishlisted}">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.3 8.8c0 4.2-8.3 10-8.3 10s-8.3-5.8-8.3-10a4.3 4.3 0 0 1 8.3-1.6 4.3 4.3 0 0 1 8.3 1.6Z"></path></svg>
      </button>
      <button class="quick-add" data-add="${product.id}" aria-label="Add ${product.name} to bag">Add to bag <span aria-hidden="true">+</span></button>
    </div>
    <div class="product-info">
      <div class="product-copy"><p class="product-category">${product.category}</p><h3>${product.name}</h3><p>${product.detail}</p>
        <div class="product-rating" aria-label="Preview rating, 5 out of 5 stars"><span aria-hidden="true">★★★★★</span><small>5.0 · preview</small></div>
        <details class="product-details"><summary>View details</summary><p>${product.name} · ${product.detail}. Explore the ${product.category.toLowerCase()} collection for more.</p></details>
      </div>
      <div class="product-price-wrap">${sale ? `<del>${money(product.price)}</del>` : ""}<span class="product-price">${money(priceFor(product))}</span></div>
    </div>
  </article>`;
}

function renderProducts() {
  const matchingProducts = products.filter((product) => {
    const visible = !showingWishlist || wishlist.has(product.id);
    const matchesCategory = category === "All" || product.category === category;
    const matchesQuery = `${product.name} ${product.category} ${product.detail}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return visible && matchesCategory && matchesQuery;
  });
  const status = $("#search-status");
  const grid = $("#product-grid");

  if (status) {
    status.textContent = query
      ? `${matchingProducts.length} ${matchingProducts.length === 1 ? "piece" : "pieces"} found`
      : showingWishlist
        ? wishlist.size
          ? `Your saved pieces · ${wishlist.size}`
          : "Your wishlist is waiting for something lovely. Tap a heart to save a piece."
        : "";
  }
  grid.innerHTML = matchingProducts.length
    ? matchingProducts.map((product, index) => productCard(product, index)).join("")
    : '<p class="empty-results">Nothing here just yet. Try another search.</p>';
}

function counts() {
  const quantity = [...cart.values()].reduce((sum, value) => sum + value, 0);
  $("#cart-count").textContent = quantity;
  $("#wishlist-count").textContent = wishlist.size;
  $("#drawer-count").textContent = `(${quantity})`;
}

function renderCart() {
  const entries = [...cart.entries()];
  $("#cart-empty").classList.toggle("visible", !entries.length);
  $("#cart-footer").classList.toggle("hidden", !entries.length);
  $("#cart-items").innerHTML = entries
    .map(([id, quantity]) => {
      const product = products.find((item) => item.id === id);
      return `<article class="cart-line"><img src="${product.image}" alt=""><div><h3>${product.name}</h3><p>${product.detail}</p><div class="cart-quantity"><button data-qty="${id}" data-step="-1" aria-label="Decrease quantity">−</button><span>${quantity}</span><button data-qty="${id}" data-step="1" aria-label="Increase quantity">+</button><button class="remove" data-remove="${id}">Remove</button></div></div><strong class="cart-line-price">${money(priceFor(product) * quantity)}</strong></article>`;
    })
    .join("");
  const subtotal = entries.reduce((sum, [id, quantity]) => {
    return sum + priceFor(products.find((product) => product.id === id)) * quantity;
  }, 0);
  $("#subtotal").textContent = money(subtotal);
  $("#total").textContent = money(subtotal);
  counts();
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("visible"), 2600);
}

function setCategory(nextCategory) {
  category = nextCategory;
  showingWishlist = false;
  document.querySelectorAll(".filter").forEach((button) => {
    const active = button.dataset.filter === category;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderProducts();
}

function openCart(open) {
  const drawer = $("#cart-drawer");
  drawer.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  drawer.inert = !open;
  $("#backdrop").classList.toggle("is-open", open);
  document.body.classList.toggle("no-scroll", open);
  if (open) $("#drawer-close").focus();
  else $("#cart-toggle").focus();
}

$("#product-grid").addEventListener("click", (event) => {
  const add = event.target.closest("[data-add]");
  const wish = event.target.closest("[data-wish]");

  if (add) {
    const id = Number(add.dataset.add);
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    toast(`${products.find((product) => product.id === id).name} added to your bag`);
  }
  if (wish) {
    const id = Number(wish.dataset.wish);
    if (wishlist.has(id)) wishlist.delete(id);
    else wishlist.add(id);
    if (showingWishlist && wishlist.size === 0) showingWishlist = true;
    renderProducts();
    counts();
  }
});

$(".filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) setCategory(button.dataset.filter);
});

document.querySelectorAll(".category-tile").forEach((tile) => {
  tile.addEventListener("click", (event) => {
    event.preventDefault();
    setCategory(tile.dataset.category);
    $("#shop").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll("[data-offer-filter]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setCategory(link.dataset.offerFilter);
    $("#shop").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll("[data-category-link]").forEach((link) => {
  link.addEventListener("click", () => setCategory(link.dataset.categoryLink));
});

document.querySelectorAll("[data-footer-action]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (link.dataset.footerAction === "wishlist") $("#wishlist-toggle").click();
    else $("#cart-toggle").click();
  });
});

const searchPanel = $("#search-panel");
const searchToggle = $("#search-toggle");
function closeSearch(restoreFocus = true) {
  searchPanel.classList.remove("is-open");
  searchPanel.setAttribute("aria-hidden", "true");
  searchPanel.inert = true;
  if (restoreFocus) searchToggle.focus();
}
searchPanel.inert = true;
searchToggle.addEventListener("click", () => {
  searchPanel.classList.add("is-open");
  searchPanel.setAttribute("aria-hidden", "false");
  searchPanel.inert = false;
  $("#product-search").focus();
});
$("#search-close").addEventListener("click", () => closeSearch());
$("#product-search").addEventListener("input", (event) => {
  query = event.target.value.trim();
  showingWishlist = false;
  renderProducts();
});
$("#product-search").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    closeSearch(false);
    $("#shop").scrollIntoView({ behavior: "smooth" });
  }
});

$("#cart-toggle").addEventListener("click", () => openCart(true));
$("#drawer-close").addEventListener("click", () => openCart(false));
$("#backdrop").addEventListener("click", () => openCart(false));
$("#continue-shopping").addEventListener("click", () => openCart(false));

$("#wishlist-toggle").addEventListener("click", () => {
  category = "All";
  query = "";
  showingWishlist = true;
  $("#product-search").value = "";
  setCategory("All");
  showingWishlist = true;
  renderProducts();
  $("#shop").scrollIntoView({ behavior: "smooth" });
});

$("#cart-items").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) {
    const id = Number(quantityButton.dataset.qty);
    const next = (cart.get(id) || 0) + Number(quantityButton.dataset.step);
    if (next > 0) cart.set(id, next);
    else cart.delete(id);
    renderCart();
  }
  if (removeButton) {
    cart.delete(Number(removeButton.dataset.remove));
    renderCart();
  }
});

$("#checkout").addEventListener("click", () => {
  toast("Checkout is coming soon. Contact us and we'll help with your order.");
});

const menuToggle = $("#menu-toggle");
const mainNav = $("#main-nav");
function closeMenu() {
  mainNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
}
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  mainNav.classList.toggle("is-open", open);
});
mainNav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (searchPanel.classList.contains("is-open")) closeSearch();
  if ($("#cart-drawer").classList.contains("is-open")) openCart(false);
  if (menuToggle?.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuToggle.focus();
  }
});

const newsletterForm = $("#newsletter-form");
newsletterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = $("#newsletter-email");
  const status = $("#newsletter-status");
  if (!email.checkValidity()) {
    status.textContent = email.validity.valueMissing
      ? "Please enter your email address."
      : "Please enter a valid email address.";
    status.classList.add("is-error");
    email.setAttribute("aria-invalid", "true");
    email.focus();
    return;
  }
  status.textContent = "Thanks! Your email is valid. Newsletter signup is not connected yet.";
  status.classList.remove("is-error");
  email.removeAttribute("aria-invalid");
});
$("#newsletter-email")?.addEventListener("input", (event) => {
  const status = $("#newsletter-status");
  status.textContent = "";
  status.classList.remove("is-error");
  event.currentTarget.removeAttribute("aria-invalid");
});

document.querySelectorAll(".filter").forEach((button) => {
  const active = button.dataset.filter === category;
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", String(active));
});
renderProducts();
renderCart();
