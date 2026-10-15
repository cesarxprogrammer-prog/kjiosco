"use strict";

function actualizarBotonesMedioVenta() {
  document.querySelectorAll("[data-sale-method]").forEach(boton => {
    const activo = boton.dataset.saleMethod === medioPagoVenta;
    boton.classList.toggle("active", activo);
    boton.setAttribute("aria-pressed", String(activo));
  });
}
function iniciarCobro() {
  const productosSinStock = productos.filter(p => cantidadEnCarrito(p.id) > p.stock);
  if (productosSinStock.length) { window.alert("Stock insuficiente para: " + productosSinStock.map(p=>p.nombre).join(", ")); return; }
  const selectCliente = $("#sale-client");
  selectCliente.replaceChildren();
  const sinCliente = document.createElement("option"); sinCliente.value = ""; sinCliente.textContent = "Venta sin cliente"; selectCliente.append(sinCliente);
  clientes.forEach(cliente => { const opcion=document.createElement("option"); opcion.value=String(cliente.id); opcion.textContent=cliente.nombre; selectCliente.append(opcion); });
  selectCliente.value = clienteVentaSeleccionado ? String(clienteVentaSeleccionado) : "";
  const lineas = productos.filter(p => cantidadCarrito(p.id) > 0).map(p => ({
    productId:p.id, nombre:p.nombre, precio:p.precio, cantidad:cantidadCarrito(p.id)
  }));
  if (!sesionActual) return;
  ventaActual = { id:numeroVenta, sesionId:sesionActual.id, items:lineas, total:totalCarrito(), estado:"pendiente" };
  pagoActual = null;
  medioPagoVenta = "efectivo";
  actualizarBotonesMedioVenta();
  $("#confirm-digital-sale").classList.add("hidden");
  $("#change-bills-section").classList.remove("hidden");
  $("#payment-selection").classList.remove("hidden");
  billetesRecibidos = [];
  billetesVuelto = [];
  vueltoEsperado = 0;
  etapa = "ingreso";
  $("#back-to-sale").classList.remove("hidden");
  $("#back-to-sale").disabled = false;
  $("#back-to-sale").textContent = "← Volver a la venta";
  $("#payment-total").textContent = pesos(ventaActual.total);
  $("#monto-a-cobrar").classList.remove("hidden");
  $("#titulo-disponibles").textContent = "";
  $("#titulo-disponibles").classList.add("hidden");
  $("#titulo-seleccion").textContent = "2. Dinero recibido";
  $("#estado").textContent = "";
  $("#detalle").textContent = "";
  mensaje.textContent = "";
  mensaje.style.color = "";
  botonAceptar.classList.remove("hidden");
  botonAprobar.classList.add("hidden");
  botonGenerar.classList.add("hidden");
  $("#acciones-vuelto").classList.add("hidden");
  $("#disponibles").classList.remove("hidden");
  $("#toggle-billetes").textContent = "Mostrar billetes disponibles";
  renderSeleccion();
  renderBilletesDisponibles();
  cambiarVista(true);
}
function renderBilletesDisponibles() {
  disponibles.replaceChildren();
  denominaciones.forEach(valor => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "bill " + (etapa === "vuelto" ? "egreso" : "ingreso");
    boton.dataset.valor = String(valor);
    boton.style.backgroundImage = "url(./img/billetes/" + valor + ".png)";
    boton.setAttribute("aria-label", "Billete de " + pesos(valor));
    boton.title = "Billete de " + pesos(valor);
    boton.disabled = etapa === "preparando" || etapa === "finalizada";
    disponibles.append(boton);
  });
  actualizarDisponibles();
}
function mostrarElegidos(lista) {
  seleccionados.replaceChildren();
  const visibles = etapa === "vuelto" ? [...lista].sort((a,b) => b-a) : lista;
  visibles.forEach(valor => {
    const billete = document.createElement("div");
    billete.className = "chosen " + (etapa === "vuelto" ? "egreso" : "ingreso");
    billete.style.backgroundImage = "url(./img/billetes/" + valor + ".png)";
    billete.setAttribute("role", "img");
    billete.setAttribute("aria-label", "Billete de " + pesos(valor));
    billete.title = "Billete de " + pesos(valor);
    seleccionados.append(billete);
  });
}
function renderSeleccion() {
  mostrarElegidos(etapa === "vuelto" ? billetesVuelto : billetesRecibidos);
  actualizarControles();
}
function actualizarDisponibles() {
  const totalVuelto = sumar(billetesVuelto);
  const faltante = vueltoEsperado - totalVuelto;
  disponibles.querySelectorAll(".bill").forEach(boton => {
    const valor = Number(boton.dataset.valor);
    let bloqueado = etapa === "preparando" || etapa === "finalizada";
    let sugerido = false;
    if (etapa === "vuelto") {
      const resto = faltante - valor;
      bloqueado = !puedeAgregarBilleteVuelto(valor);
      sugerido = !bloqueado && puedeCompletar(resto, valor);
    }
    boton.disabled = bloqueado;
    boton.classList.toggle("suggested", sugerido);
    boton.title = sugerido ? "Sugerido para completar el vuelto exacto · " + pesos(valor) : "Billete de " + pesos(valor);
    boton.textContent = "";
    boton.setAttribute("aria-label", "Billete de " + pesos(valor));
  });
}
function puedeCompletar(importe, denominacionUsada) {
  if (importe === 0) return true;
  if (importe < 0) return false;
  const disponiblesPorValor = denominaciones
    .map(valor => ({
      valor,
      cantidad: stockDisponible(valor) - (valor === denominacionUsada ? 1 : 0)
    }))
    .filter(item => item.cantidad > 0);
  const alcanzable = Array(importe + 1).fill(false);
  alcanzable[0] = true;
  disponiblesPorValor.forEach(item => {
    for (let vez = 0; vez < item.cantidad; vez++) {
      for (let monto = importe; monto >= item.valor; monto--) {
        if (alcanzable[monto - item.valor]) alcanzable[monto] = true;
      }
    }
  });
  return alcanzable[importe];
}
function actualizarControles() {
  const enIngreso = etapa === "ingreso";
  const lista = enIngreso ? billetesRecibidos : billetesVuelto;
  const total = sumar(lista);
  totalTexto.textContent = (enIngreso ? "Total recibido: " : "Total del vuelto: ") + pesos(total);
  botonDeshacer.disabled = !lista.length || etapa === "preparando" || etapa === "finalizada";
  botonVaciar.disabled = !lista.length || etapa === "preparando" || etapa === "finalizada";
  botonAceptar.disabled = !enIngreso || total < ventaActual.total;
  botonAprobar.disabled = etapa !== "vuelto" || total !== vueltoEsperado;
  if (enIngreso) {
    detalle.textContent = lista.length
      ? (total < ventaActual.total ? "Faltan: " + pesos(ventaActual.total-total) : "Vuelto que corresponde: " + pesos(total-ventaActual.total))
      : "";
  } else if (etapa === "vuelto") {
    detalle.textContent = "Vuelto esperado: " + pesos(vueltoEsperado);
  }
  actualizarDisponibles();
}
function iniciarPreparacion() {
  if (etapa !== "ingreso") return;
  const recibido = sumar(billetesRecibidos);
  if (recibido < ventaActual.total) return;
  etapa = "preparando";
  botonAceptar.disabled = true;
  $("#back-to-sale").disabled = true;
  $("#estado").textContent = "Registrando el ingreso...";
  seleccionados.replaceChildren();
  actualizarControles();
  actualizarDisponibles();
  window.setTimeout(() => {
    vueltoEsperado = recibido - ventaActual.total;
    pagoActual = { id:numeroPago, ventaId:ventaActual.id, sesionId:sesionActual.id, fecha:new Date().toISOString(), medio:"efectivo", recibido, vuelto:vueltoEsperado, billetesRecibidos:billetesRecibidos.slice() };
    ventaActual.pagoId = pagoActual.id;
    denominaciones.forEach(valor => {
      caja.billetes[valor] += contarBilletes(billetesRecibidos, valor);
    });
    registrarMovimiento("ingreso", billetesRecibidos, "Dinero recibido", pagoActual.id, recibido);
    billetesRecibidos = [];
    billetesVuelto = [];
    etapa = "vuelto";
    $("#titulo-disponibles").textContent = "3. Billetes disponibles para entregar";
    $("#titulo-disponibles").classList.remove("hidden");
    $("#titulo-seleccion").textContent = "4. Vuelto a entregar";
    $("#estado").textContent = "Seleccioná billetes del stock o usá el automático 🤖.";
    botonAceptar.classList.add("hidden");
    $("#monto-a-cobrar").classList.add("hidden");
    botonAprobar.classList.remove("hidden");
    botonGenerar.classList.remove("hidden");
    $("#acciones-vuelto").classList.remove("hidden");
    $("#disponibles").classList.add("hidden");
    $("#toggle-billetes").textContent = "Mostrar billetes disponibles";
    $("#back-to-sale").classList.remove("hidden");
    $("#back-to-sale").disabled = false;
    $("#back-to-sale").textContent = "← Volver a dinero recibido";
    renderStock();
    renderBilletesDisponibles();
    renderSeleccion();
    guardarEstado();
  }, 420);
}
function generarVueltoAutomatico() {
  if (etapa !== "vuelto") return;
  const orden = [...denominaciones].sort((a,b) => b-a);
  const memoria = new Map();

  function buscarCombinacion(indice, restante) {
    if (restante === 0) return [];
    if (indice >= orden.length) return null;

    const clave = indice + ":" + restante;
    if (memoria.has(clave)) return memoria.get(clave);

    const valor = orden[indice];
    const maximo = Math.min(caja.billetes[valor], Math.floor(restante / valor));
    for (let cantidad = maximo; cantidad >= 0; cantidad--) {
      const resto = buscarCombinacion(indice + 1, restante - cantidad * valor);
      if (resto !== null) {
        const resultado = Array(cantidad).fill(valor).concat(resto);
        memoria.set(clave, resultado);
        return resultado;
      }
    }

    memoria.set(clave, null);
    return null;
  }

  const combinacion = buscarCombinacion(0, vueltoEsperado);
  if (combinacion === null || sumar(combinacion) > vueltoEsperado || sumar(combinacion) !== vueltoEsperado) {
    mensaje.textContent = "No hay una combinación exacta de billetes disponible para este vuelto.";
    mensaje.style.color = "#ff8888";
    return;
  }
  billetesVuelto = combinacion;
  renderBilletesDisponibles();
  renderSeleccion();
  mensaje.textContent = "Combinación generada priorizando billetes de mayor valor.";
  mensaje.style.color = "#8ce6a6";
}
async function finalizarVenta() {
  if (!ventaActual || !sesionActual) return;
  const sinExistencia = ventaActual.items.find(item => { const producto=productos.find(p=>p.id===item.productId); return !producto || producto.stock < item.cantidad; });
  if (sinExistencia) { $("#estado").textContent="Stock insuficiente para "+sinExistencia.nombre+". Ajustá las existencias antes de completar la venta."; return; }
  if (medioPagoVenta === "efectivo") {
    const totalVuelto = sumar(billetesVuelto);
    if (etapa !== "vuelto" || totalVuelto !== vueltoEsperado) return;
    for (const valor of denominaciones) {
      if (contarBilletes(billetesVuelto, valor) > caja.billetes[valor]) return;
    }
    denominaciones.forEach(valor => { caja.billetes[valor] -= contarBilletes(billetesVuelto, valor); });
    if (billetesVuelto.length) registrarMovimiento("egreso", billetesVuelto, "Vuelto entregado", pagoActual.id, -vueltoEsperado);
  } else {
    if (etapa !== "ingreso" || (medioPagoVenta === "cuenta_corriente" && !$("#sale-client").value)) return;
    pagoActual = { id:numeroPago, ventaId:ventaActual.id, sesionId:sesionActual.id, fecha:new Date().toISOString(), medio:medioPagoVenta, recibido:medioPagoVenta === "cuenta_corriente" ? 0 : ventaActual.total, vuelto:0 };
    ventaActual.pagoId = pagoActual.id;
  }
  productos.forEach(producto => {
    const comprado = ventaActual.items.find(item => item.productId === producto.id);
    if (comprado) {
      producto.stock -= comprado.cantidad;
      registrarMovimientoStock("venta", producto, -comprado.cantidad, "Venta " + ventaActual.id);
    }
  });
  clienteVentaSeleccionado = $("#sale-client").value ? Number($("#sale-client").value) : null;
  const clienteActual = clientes.find(cliente => cliente.id === clienteVentaSeleccionado);
  ventaActual.clienteId = clienteActual ? clienteActual.id : null;
  ventaActual.cliente = clienteActual ? clienteActual.nombre : "";
  if (medioPagoVenta === "cuenta_corriente") cuentasPorCobrar.push({ id:numeroCuentaPorCobrar++, ventaId:ventaActual.id, clienteId:clienteActual.id, cliente:clienteActual.nombre, fecha:new Date().toISOString(), importe:ventaActual.total, saldo:ventaActual.total, metodoCobro:"efectivo", billetesCobro:[] });
  ventaActual.estado = medioPagoVenta === "cuenta_corriente" ? "pendiente" : "cobrada";
  ventaActual.fecha = new Date().toISOString();
  const ventaRegistrada = {...ventaActual};
  delete ventaRegistrada.items;
  ventaActual.items.forEach(item => {
    const producto=productos.find(p=>p.id===item.productId);
    const costoUnitario=producto&&Number.isFinite(producto.costo)&&producto.costo>0?producto.costo:null;
    detallesVenta.push({id:numeroDetalleVenta++,ventaId:ventaActual.id,...item,costoUnitario});
  });
  ventas.push(ventaRegistrada);
  const pagoRegistrado={...pagoActual};delete pagoRegistrado.billetesRecibidos;pagos.push(pagoRegistrado);
  numeroPago++;
  numeroVenta++;
  etapa = "finalizada";
  renderHistorial();
  await guardarEstado();
  $("#sale-panel").classList.add("hidden");
  $("#change-bills-section").classList.add("hidden");
  $("#payment-selection").classList.add("hidden");
  disponibles.classList.add("hidden");
  $("#acciones-vuelto").classList.add("hidden");
  const ticket = document.createElement("section");
  ticket.id = "sale-ticket";
  ticket.className = "receipt";
  const titulo = document.createElement("h2");
  titulo.textContent = "Ticket · Venta " + ventaActual.id;
  const estadoTicket = document.createElement("div");
  estadoTicket.className = "muted";
  estadoTicket.textContent = medioPagoVenta === "cuenta_corriente" ? "Venta registrada · saldo pendiente" : "Venta cobrada";
  const lista = document.createElement("ul");
  lista.className = "receipt-list";
  ventaActual.items.forEach(item => {
    const li = document.createElement("li");
    li.className = "receipt-line";
    const nombre = document.createElement("span");
    const cantidad = item.cantidad % 1 === 0 ? String(item.cantidad) : new Intl.NumberFormat("es-AR", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(item.cantidad);
    nombre.textContent = item.nombre + " · " + cantidad + " × " + pesos(item.precio);
    const importe = document.createElement("strong");
    importe.textContent = pesos(Math.round(item.precio * item.cantidad));
    li.append(nombre, importe);
    lista.append(li);
  });
  const total = document.createElement("div");
  total.className = "receipt-total";
  total.innerHTML = "<span>Total</span><strong>" + pesos(ventaActual.total) + "</strong>";
  const valores = document.createElement("div");
  valores.className = "receipt-values";
  (pagoActual.medio === "efectivo" ? [["Dinero recibido", pagoActual.recibido], ["Vuelto dado", pagoActual.vuelto]] : [["Medio de pago", pagoActual.medio === "transferencia" ? "Transferencia" : pagoActual.medio === "cuenta_corriente" ? "Fiado" : "Mercado Pago"], [pagoActual.medio === "cuenta_corriente" ? "Saldo pendiente" : "Importe", pagoActual.medio === "cuenta_corriente" ? ventaActual.total : pagoActual.recibido]]).forEach(([etiqueta, valor]) => {
    const fila = document.createElement("div");
    fila.className = "receipt-line";
    const texto = document.createElement("span");
    texto.textContent = etiqueta;
    const numero = document.createElement("strong");
    numero.textContent = pesos(valor);
    fila.append(texto, numero);
    valores.append(fila);
  });
  const nuevo = document.createElement("button");
  nuevo.type = "button";
  nuevo.className = "primary wide";
  nuevo.textContent = "Nueva venta";
  nuevo.addEventListener("click", volverAStore);
  ticket.append(titulo, estadoTicket);
  if (ventaActual.cliente) { const clienteTicket=document.createElement("div"); clienteTicket.className="history-meta"; clienteTicket.textContent="Cliente: "+ventaActual.cliente; ticket.append(clienteTicket); }
  ticket.append(lista, total, valores, nuevo);
  $("#payment-view").append(ticket);
  renderStock();
}
