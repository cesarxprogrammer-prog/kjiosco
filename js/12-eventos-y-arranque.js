"use strict";

function volverAStore() {
  carrito.clear();
  ventaActual = null;
  pagoActual = null;
  billetesRecibidos = [];
  billetesVuelto = [];
  etapa = "venta";
  clienteVentaSeleccionado = null;
  disponibles.classList.remove("hidden");
  $("#sale-panel").classList.remove("hidden");
  $("#change-bills-section").classList.remove("hidden");
  $("#payment-selection").classList.remove("hidden");
  const ticketActual = $("#sale-ticket");
  if (ticketActual) ticketActual.remove();
  botonDeshacer.classList.remove("hidden");
  botonVaciar.classList.remove("hidden");
  $("#back-to-sale").classList.remove("hidden");
  $("#back-to-sale").disabled = false;
  medioPagoVenta = "efectivo";
  actualizarBotonesMedioVenta();
  $("#confirm-digital-sale").classList.add("hidden");
  cambiarVista(false);
  renderCatalogo();
  renderCarrito();
  renderStock();
}
function cancelarCobro() {
  if(etapa==="preparando"||etapa==="finalizada")return;
  if(etapa==="vuelto"&&pagoActual){
    const ingresados=Array.isArray(pagoActual.billetesRecibidos)?pagoActual.billetesRecibidos:[];
    denominaciones.forEach(valor=>{caja.billetes[valor]-=contarBilletes(ingresados,valor);});
    const movimiento=movimientosCaja.findIndex(item=>item.pagoId===pagoActual.id&&item.tipo==="ingreso"&&item.motivo==="Dinero recibido");
    if(movimiento>=0)movimientosCaja.splice(movimiento,1);
    billetesRecibidos=ingresados.slice();billetesVuelto=[];pagoActual=null;vueltoEsperado=0;etapa="ingreso";
    $("#titulo-disponibles").classList.add("hidden");$("#titulo-seleccion").textContent="2. Dinero recibido";$("#estado").textContent="Podés corregir los billetes recibidos y aceptar el ingreso nuevamente.";
    $("#monto-a-cobrar").classList.remove("hidden");botonAceptar.classList.remove("hidden");botonAprobar.classList.add("hidden");botonGenerar.classList.add("hidden");$("#acciones-vuelto").classList.add("hidden");disponibles.classList.remove("hidden");$("#toggle-billetes").textContent="Mostrar billetes disponibles";
    $("#back-to-sale").textContent="← Volver a la venta";$("#back-to-sale").disabled=false;
    renderStock();renderBilletesDisponibles();renderSeleccion();renderTurno();return;
  }
  if(etapa!=="ingreso")return;
  etapa="venta";ventaActual=null;pagoActual=null;medioPagoVenta="efectivo";actualizarBotonesMedioVenta();
  $("#confirm-digital-sale").classList.add("hidden");$("#change-bills-section").classList.remove("hidden");$("#payment-selection").classList.remove("hidden");
  billetesRecibidos=[];billetesVuelto=[];vueltoEsperado=0;$("#back-to-sale").textContent="← Volver a la venta";cambiarVista(false);renderCatalogo();renderCarrito();
}

disponibles.addEventListener("click", evento => {
  const boton = evento.target.closest(".bill");
  if (!boton || boton.disabled) return;
  const valor = Number(boton.dataset.valor);
  if (etapa === "ingreso") {
    billetesRecibidos.push(valor);
    renderSeleccion();
  } else if (etapa === "vuelto") {
    if (!puedeAgregarBilleteVuelto(valor)) {
      mensaje.textContent = "Ese billete supera el vuelto pendiente o no está disponible.";
      mensaje.style.color = "#ff8888";
      return;
    }
    billetesVuelto.push(valor);
    renderSeleccion();
    mensaje.textContent = "";
  }
});
botonDeshacer.addEventListener("click", () => {
  if (etapa === "ingreso") billetesRecibidos.pop();
  else if (etapa === "vuelto") billetesVuelto.pop();
  renderSeleccion();
});
botonVaciar.addEventListener("click", () => {
  if (etapa === "ingreso") billetesRecibidos = [];
  else if (etapa === "vuelto") billetesVuelto = [];
  renderSeleccion();
});
$("#start-payment").addEventListener("click", iniciarCobro);
$("#menu-toggle").addEventListener("click", () => {
  const oculto = $("#main-menu").classList.toggle("hidden");
  $("#menu-toggle").setAttribute("aria-expanded", String(!oculto));
});
$("#menu-sales").addEventListener("click", () => mostrarSeccion("sales"));
$("#menu-stock").addEventListener("click", () => mostrarSeccion("stock"));
$("#menu-cash-movements").addEventListener("click", () => mostrarSeccion("movements"));
$("#movements-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#stock-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#menu-shift").addEventListener("click", () => mostrarSeccion("shift"));
$("#shift-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#product-editor-close").addEventListener("click", cerrarFormularioProducto);
$("#product-editor-backdrop").addEventListener("click", cerrarFormularioProducto);
document.addEventListener("keydown", evento => { if(evento.key==="Escape" && productoFormularioAbierto) cerrarFormularioProducto(); });
$("#menu-products").addEventListener("click", () => mostrarSeccion("products"));
$("#products-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#menu-product-stock").addEventListener("click", () => mostrarSeccion("product-stock"));
$("#product-stock-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#menu-categories").addEventListener("click", () => mostrarSeccion("categories"));
$("#categories-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#menu-receivables").addEventListener("click", () => mostrarSeccion("receivables"));
$("#menu-reports").addEventListener("click", () => mostrarSeccion("reports"));
$("#reports-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#receivables-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#menu-clients").addEventListener("click", () => mostrarSeccion("clients"));
$("#clients-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#menu-providers").addEventListener("click", () => mostrarSeccion("providers"));
$("#menu-purchases").addEventListener("click", () => mostrarSeccion("procurement"));
$("#providers-back").addEventListener("click", () => mostrarSeccion("sales"));
$("#procurement-back").addEventListener("click", () => mostrarSeccion("sales"));
document.addEventListener("click", evento => {
  if (!evento.target.closest(".menu-wrap")) {
    $("#main-menu").classList.add("hidden");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
  }
});
$("#toggle-billetes").addEventListener("click", () => {
  const ocultos = disponibles.classList.toggle("hidden");
  $("#toggle-billetes").textContent = ocultos
    ? "Mostrar billetes disponibles"
    : "Ocultar billetes disponibles";
});
const salesHistoryDetails=$("#sales-history")?.closest("details");salesHistoryDetails?.addEventListener("toggle",()=>{if(salesHistoryDetails.open)renderHistorial();});
$("#toggle-cart-open").addEventListener("click", abrirCarrito);
$("#purchase-cart-close").addEventListener("click",()=>plegarCarritoCompra());
$("#clear-sale-cart").addEventListener("click",()=>{carrito.clear();renderCatalogo();renderCarrito();});
$("#clear-purchase-cart").addEventListener("click",()=>{borradorCompra=[];renderComprasProveedores();});
$("#purchase-cart-backdrop").addEventListener("click",()=>plegarCarritoCompra());
$("#toggle-cart-close").addEventListener("click", plegarCarrito);
$("#cart-backdrop").addEventListener("click", plegarCarrito);
document.addEventListener("keydown", evento => { if (evento.key === "Escape" && !$("#cart-overlay").classList.contains("hidden")) plegarCarrito(); else if(evento.key==="Escape"&&!$("#purchase-cart-overlay").classList.contains("hidden"))plegarCarritoCompra(); });
$("#select-chicos").addEventListener("click", () => elegirCategoria("chicos"));
$("#select-peso").addEventListener("click", () => elegirCategoria("peso"));
$("#back-to-sale").addEventListener("click", cancelarCobro);
document.querySelectorAll("[data-sale-method]").forEach(boton => boton.addEventListener("click", () => {
  medioPagoVenta = boton.dataset.saleMethod;
  actualizarBotonesMedioVenta();
  const digital = medioPagoVenta !== "efectivo";
  const requiereCliente = medioPagoVenta === "cuenta_corriente";
  $("#change-bills-section").classList.toggle("hidden", digital);
  $("#payment-selection").classList.toggle("hidden", digital);
  $("#confirm-digital-sale").classList.toggle("hidden", !digital);
  $("#confirm-digital-sale").disabled = requiereCliente && !$("#sale-client").value;
  $("#confirm-digital-sale").textContent = requiereCliente ? "Registrar venta a cuenta" : "Confirmar pago";
  $("#estado").textContent = requiereCliente ? ($("#sale-client").value ? "El saldo quedará pendiente como fiado." : "Elegí un cliente para registrar el fiado.") : digital ? "El pago se registrará sin usar billetes." : "";
}));
$("#sale-client").addEventListener("change", () => {
  if (medioPagoVenta === "cuenta_corriente") {
    const elegido = Boolean($("#sale-client").value);
    $("#confirm-digital-sale").disabled = !elegido;
    $("#estado").textContent = elegido ? "El saldo quedará pendiente como fiado." : "Elegí un cliente para registrar el fiado.";
  }
});
$("#confirm-digital-sale").addEventListener("click", () => { if (medioPagoVenta !== "efectivo") { etapa = "ingreso"; finalizarVenta(); } });
botonAceptar.addEventListener("click", iniciarPreparacion);
botonGenerar.addEventListener("click", generarVueltoAutomatico);
botonAprobar.addEventListener("click", finalizarVenta);
actualizarMenuActivo(document.body.dataset.section || "sales");
iniciarAplicacion().catch(error=>{console.error("No se pudo iniciar la aplicación.",error);});
