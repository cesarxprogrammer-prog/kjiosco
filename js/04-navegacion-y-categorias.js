"use strict";

function cambiarVista(pago) {
  const seccion = document.body.dataset.section || "sales";
  $("#global-header").classList.toggle("hidden", pago);
  $("#store-view").classList.toggle("hidden", pago || seccion !== "sales");
  $("#stock-view").classList.toggle("hidden", pago || seccion !== "stock");
  $("#shift-view").classList.toggle("hidden", pago || seccion !== "shift");
  $("#movements-view").classList.toggle("hidden", pago || seccion !== "movements");
  $("#product-stock-view").classList.toggle("hidden", pago || seccion !== "product-stock");
  $("#products-view").classList.toggle("hidden", pago || seccion !== "products");
  $("#categories-view").classList.toggle("hidden", pago || seccion !== "categories");
  $("#receivables-view").classList.toggle("hidden", pago || seccion !== "receivables");
  $("#reports-view").classList.toggle("hidden", pago || seccion !== "reports");
  $("#clients-view").classList.toggle("hidden", pago || seccion !== "clients");
  $("#providers-view").classList.toggle("hidden", pago || seccion !== "providers");
  $("#procurement-view").classList.toggle("hidden", pago || seccion !== "procurement");
  $("#product-stock-view").classList.toggle("hidden", pago || seccion !== "product-stock");
  $("#payment-view").classList.toggle("hidden", !pago);
}
function actualizarMenuActivo(seccion) {
  const menuPorSeccion={sales:"menu-sales",stock:"menu-stock",movements:"menu-cash-movements",shift:"menu-shift",products:"menu-products","product-stock":"menu-product-stock",categories:"menu-categories",receivables:"menu-receivables",reports:"menu-reports",clients:"menu-clients",providers:"menu-providers",procurement:"menu-purchases"};
  document.querySelectorAll("#main-menu button").forEach(boton=>{const activo=boton.id===menuPorSeccion[seccion];boton.classList.toggle("active",activo);if(activo)boton.setAttribute("aria-current","page");else boton.removeAttribute("aria-current");});
}
function mostrarSeccion(nombre) {
  const seccion = ["sales", "stock", "movements", "shift", "product-stock", "clients", "categories", "receivables", "reports", "providers", "procurement", "products"].includes(nombre) ? nombre : "sales";
  document.body.dataset.section = seccion;
  actualizarMenuActivo(seccion);
  $("#header-title").textContent = seccion === "stock" ? "Existencias" : seccion === "movements" ? "Movimientos de caja" : seccion === "shift" ? "Turno de caja" : seccion === "product-stock" ? "Stock de productos" : seccion === "categories" ? "Categorías de productos" : seccion === "receivables" ? "Cuentas por cobrar" : seccion === "reports" ? "Reportes y respaldo" : seccion === "clients" ? "Clientes" : seccion === "providers" ? "Proveedores" : seccion === "procurement" ? "Compras" : seccion === "products" ? "Productos" : "Punto de venta";
  $("#main-menu").classList.add("hidden");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  cambiarVista(false);
  if (seccion === "sales") renderHistorial();
  if (seccion === "stock") renderStock();
  if (seccion === "movements") renderMovimientosCaja();
  if (seccion === "shift") renderTurno();
  if (seccion === "product-stock") renderStockProductos();
  if (seccion === "products") renderGestionProductos();
  if (seccion === "categories") renderCategorias();
  if (seccion === "receivables") renderCuentasPorCobrar();
  if (seccion === "reports") renderReportes();
  if (seccion === "clients") renderClientes();
  if (seccion === "providers") renderProveedores();
  if (seccion === "procurement") renderComprasProveedores();
}
function abrirTurno() {
  if (sesionActual) return;
  sesionActual = { id:numeroSesion++, fechaApertura:new Date().toISOString(), estado:"abierto", efectivoInicial:totalCaja(), billetesIniciales:{...caja.billetes} };
  sesionesCaja.push(sesionActual);
  renderTurno(); renderStock(); renderCarrito(); guardarEstado();
}
function actualizarFiltroCategorias() {
  const filtro = $("#category-filter"); if (!filtro) return;
  const actual = filtro.value; filtro.replaceChildren();
  const todas = document.createElement("option"); todas.value = ""; todas.textContent = "Todas las categorías"; filtro.append(todas);
  categorias.forEach(categoria => { const opcion=document.createElement("option"); opcion.value=categoria.id; opcion.textContent=categoria.nombre; filtro.append(opcion); });
  if (categorias.some(categoria => categoria.id === actual)) filtro.value = actual;
}
function renderCategorias() {
  const area=$("#categories-area"); area.replaceChildren();
  const panel=document.createElement("section"); panel.className="panel";
  const form=document.createElement("form"); form.className="stock-product-row";
  const nombre=document.createElement("input"); nombre.type="text"; nombre.placeholder="Nombre de la categoría"; nombre.required=true;
  const guardar=document.createElement("button"); guardar.type="submit"; guardar.className="secondary"; guardar.textContent="Agregar categoría";
  form.append(nombre,guardar);
  const lista=document.createElement("div"); lista.className="history-items";
  categorias.forEach(categoria=>{ const fila=document.createElement("article"); fila.className="stock-item"; const titulo=document.createElement("strong"); titulo.textContent=categoria.nombre; const total=productos.filter(p=>p.categoriaId===categoria.id).length; const cuenta=document.createElement("span"); cuenta.className="muted"; cuenta.textContent=total+" productos"; fila.append(titulo,cuenta); lista.append(fila); });
  form.addEventListener("submit",evento=>{evento.preventDefault(); const texto=nombre.value.trim(); if(!texto || categorias.some(c=>c.nombre.toLocaleLowerCase()===texto.toLocaleLowerCase())) return; const id="cat-"+Date.now(); categorias.push({id,nombre:texto}); renderCategorias();});
  panel.append(form,lista); area.append(panel);

}
