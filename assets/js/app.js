
const PF = {
  products: window.PRETTYFLY_PRODUCTS || [],
  cart: JSON.parse(localStorage.getItem("prettyfly-cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("prettyfly-wishlist") || "[]")
};

function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);}
function saveState(){
  localStorage.setItem("prettyfly-cart",JSON.stringify(PF.cart));
  localStorage.setItem("prettyfly-wishlist",JSON.stringify(PF.wishlist));
}
function stars(r){return "★★★★★".slice(0,Math.round(r)) + "☆☆☆☆☆".slice(0,5-Math.round(r));}
function productCard(p){
  const wished = PF.wishlist.includes(p.id);
  return `<article class="product-card">
    <a class="product-media" href="product.html?id=${p.id}">
      <span class="badge">${p.badge}</span>
      <button class="wish-btn ${wished?"active":""}" data-wish="${p.id}" aria-label="Add ${p.name} to wishlist">${wished?"♥":"♡"}</button>
      <img src="${p.image}" alt="${p.name}">
    </a>
    <div class="product-body">
      <span class="product-cat">${p.label}</span>
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <div class="rating">${stars(p.rating)} <span>(${p.reviews})</span></div>
      <div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}">Add to cart</button></div>
    </div>
  </article>`;
}
function wireProductButtons(){
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addToCart(Number(b.dataset.add),1));
  document.querySelectorAll("[data-wish]").forEach(b=>b.onclick=(e)=>{e.preventDefault();toggleWish(Number(b.dataset.wish));});
}
function renderStaticLists(){
  document.querySelectorAll("[data-product-list]").forEach(el=>{
    const type = el.dataset.productList;
    let list = [...PF.products];
    if(type==="featured") list = list.slice(0, Number(el.dataset.limit || 8));
    if(type==="new") list = list.filter(p=>p.new);
    if(type==="deals") list = list.filter(p=>p.deal);
    el.innerHTML = list.map(productCard).join("");
  });
  wireProductButtons();
}
function addToCart(id, qty=1){
  const p=PF.products.find(x=>x.id===id); if(!p)return;
  const found=PF.cart.find(x=>x.id===id);
  if(found) found.qty += qty; else PF.cart.push({id,qty});
  saveState(); renderCart(); toast(`${p.name} added to cart`);
}
function removeCart(id){PF.cart=PF.cart.filter(x=>x.id!==id);saveState();renderCart();}
function renderCart(){
  const count=PF.cart.reduce((s,x)=>s+x.qty,0);
  const badge=document.getElementById("cartCount"); if(badge) badge.textContent=count;
  const items=document.getElementById("cartItems"), empty=document.getElementById("cartEmpty"), subtotal=document.getElementById("cartSubtotal");
  if(!items)return;
  items.innerHTML=PF.cart.map(ci=>{
    const p=PF.products.find(x=>x.id===ci.id); if(!p)return "";
    return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><h5>${p.name}</h5><small>${ci.qty} × ${money(p.price)}</small></div><button data-remove="${p.id}" aria-label="Remove ${p.name}">×</button></div>`;
  }).join("");
  empty.style.display=PF.cart.length?"none":"block";
  const total=PF.cart.reduce((s,ci)=>{const p=PF.products.find(x=>x.id===ci.id);return s+(p?p.price*ci.qty:0)},0);
  subtotal.textContent=money(total);
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>removeCart(Number(b.dataset.remove)));
}
function toggleWish(id){
  PF.wishlist = PF.wishlist.includes(id) ? PF.wishlist.filter(x=>x!==id) : [...PF.wishlist,id];
  saveState();
  renderStaticLists();
  if(document.getElementById("shopGrid")) renderShop();
  toast(PF.wishlist.includes(id)?"Added to wishlist":"Removed from wishlist");
}
function toast(msg){
  const t=document.getElementById("toast"); if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(window.pfToast);window.pfToast=setTimeout(()=>t.classList.remove("show"),2200);
}
function openCart(){const d=document.getElementById("cartDrawer");d.classList.add("open");d.setAttribute("aria-hidden","false");document.body.classList.add("no-scroll");}
function closeCart(){const d=document.getElementById("cartDrawer");d.classList.remove("open");d.setAttribute("aria-hidden","true");document.body.classList.remove("no-scroll");}

function renderShop(){
  const grid=document.getElementById("shopGrid"); if(!grid)return;
  const params=new URLSearchParams(location.search);
  if(!window.pfShopFilter) window.pfShopFilter=params.get("category")||"all";
  let list=[...PF.products];
  if(window.pfShopFilter!=="all") list=list.filter(p=>p.category===window.pfShopFilter);
  const sort=(document.getElementById("shopSort")||{}).value||"featured";
  if(sort==="price-low")list.sort((a,b)=>a.price-b.price);
  if(sort==="price-high")list.sort((a,b)=>b.price-a.price);
  if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));
  grid.innerHTML=list.map(productCard).join("");
  document.querySelectorAll("#shopFilters .filter-chip").forEach(b=>b.classList.toggle("active",b.dataset.filter===window.pfShopFilter));
  wireProductButtons();
}
function initShop(){
  const filters=document.getElementById("shopFilters");
  if(filters) filters.querySelectorAll(".filter-chip").forEach(b=>b.onclick=()=>{window.pfShopFilter=b.dataset.filter;history.replaceState({}, "", b.dataset.filter==="all"?"shop.html":`shop.html?category=${b.dataset.filter}`);renderShop();});
  const sort=document.getElementById("shopSort"); if(sort) sort.onchange=renderShop;
  renderShop();
}
function renderProductDetail(){
  const root=document.getElementById("productDetail"); if(!root)return;
  const id=Number(new URLSearchParams(location.search).get("id")||1);
  const p=PF.products.find(x=>x.id===id) || PF.products[0];
  document.title=`${p.name} | PrettyFly`;
  root.innerHTML=`<div class="breadcrumbs"><a href="index.html">Home</a> / <a href="shop.html">Shop</a> / ${p.name}</div>
    <div class="product-detail">
      <div class="product-detail__image"><img src="${p.image}" alt="${p.name}"></div>
      <div class="product-detail__info">
        <p class="eyebrow">${p.label}</p><h1>${p.name}</h1>
        <div class="rating">${stars(p.rating)} <span>${p.rating.toFixed(1)} · ${p.reviews} reviews</span></div>
        <div class="product-detail__price">${money(p.price)}</div>
        <p class="product-detail__desc">${p.description} Built to fit naturally into everyday school routines with a clean, practical PrettyFly design.</p>
        <div class="product-meta"><div><span>SKU</span><strong>${p.sku}</strong></div><div><span>Availability</span><strong>${p.stock}</strong></div><div><span>Returns</span><strong>30 days</strong></div><div><span>Support</span><strong>Mon–Fri</strong></div></div>
        <div class="qty-row"><div class="qty"><button id="qtyMinus">−</button><input id="qtyInput" value="1" inputmode="numeric"><button id="qtyPlus">+</button></div><button class="btn btn-primary" id="detailAdd">Add to Cart</button></div>
        <div class="detail-actions"><button class="btn btn-secondary" id="detailWish">${PF.wishlist.includes(p.id)?"♥ Saved":"♡ Add to Wishlist"}</button><a class="btn btn-secondary" href="contact.html">Ask a Question</a></div>
        <div class="notice"><strong>Need help?</strong> Call PrettyFly Support at <a href="tel:+12025550147">+1 (202) 555-0147</a>.</div>
      </div>
    </div>`;
  let qty=1;
  const input=document.getElementById("qtyInput");
  document.getElementById("qtyMinus").onclick=()=>{qty=Math.max(1,qty-1);input.value=qty};
  document.getElementById("qtyPlus").onclick=()=>{qty++;input.value=qty};
  input.oninput=()=>{qty=Math.max(1,parseInt(input.value||"1",10)||1);input.value=qty};
  document.getElementById("detailAdd").onclick=()=>addToCart(p.id,qty);
  document.getElementById("detailWish").onclick=()=>{toggleWish(p.id);renderProductDetail();};
  const rel=document.getElementById("relatedProducts");
  rel.innerHTML=PF.products.filter(x=>x.category===p.category&&x.id!==p.id).slice(0,4).map(productCard).join("") || PF.products.filter(x=>x.id!==p.id).slice(0,4).map(productCard).join("");
  wireProductButtons();
}
function initSearch(){
  const toggle=document.getElementById("searchToggle"), bar=document.getElementById("searchBar"), input=document.getElementById("globalSearch"), close=document.getElementById("searchClose"), results=document.getElementById("searchResults"), inner=document.getElementById("searchResultsInner");
  if(!toggle)return;
  toggle.onclick=()=>{bar.classList.toggle("open");if(bar.classList.contains("open"))setTimeout(()=>input.focus(),50)};
  close.onclick=()=>{bar.classList.remove("open");results.classList.remove("open");input.value=""};
  input.oninput=()=>{
    const q=input.value.trim().toLowerCase();
    if(!q){results.classList.remove("open");inner.innerHTML="";return}
    const hits=PF.products.filter(p=>`${p.name} ${p.label} ${p.category}`.toLowerCase().includes(q)).slice(0,6);
    inner.innerHTML=hits.length?hits.map(p=>`<a class="search-hit" href="product.html?id=${p.id}"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><span>${p.label} · ${money(p.price)}</span></div></a>`).join(""):`<div class="empty-state" style="padding:18px">No matching products.</div>`;
    results.classList.add("open");
  };
}
function initMobile(){
  const b=document.getElementById("mobileMenuBtn"),n=document.getElementById("mainNav"); if(!b)return;
  b.onclick=()=>{n.classList.toggle("open");b.setAttribute("aria-expanded",n.classList.contains("open"))};
}
function initForms(){
  const news=document.getElementById("newsletterForm");
  if(news) news.onsubmit=e=>{e.preventDefault();const email=document.getElementById("newsletterEmail");document.getElementById("newsletterMessage").textContent=`Thanks! ${email.value} is on the PrettyFly list.`;email.value=""};
  const contact=document.getElementById("contactForm");
  if(contact) contact.onsubmit=e=>{e.preventDefault();document.getElementById("contactMessage").textContent="Thanks — your demo support request has been recorded in this browser.";contact.reset();};
}
function initFAQ(){document.querySelectorAll(".faq-q").forEach(q=>q.onclick=()=>q.closest(".faq-item").classList.toggle("open"))}
function initCartUI(){
  document.getElementById("cartBtn")?.addEventListener("click",openCart);
  document.getElementById("cartClose")?.addEventListener("click",closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click",closeCart);
  document.getElementById("checkoutBtn")?.addEventListener("click",()=>toast("Demo checkout — connect a payment provider before launch."));
}
document.addEventListener("DOMContentLoaded",()=>{
  renderStaticLists();renderCart();initShop();renderProductDetail();initSearch();initMobile();initForms();initFAQ();initCartUI();
});
