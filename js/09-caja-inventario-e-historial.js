"use strict";

function renderStockProductos() {
  if(!["","recuento","merma","vencimiento","uso_interno","devolucion_cliente","devolucion_proveedor","otro"].includes(motivoAjusteStock)){motivoAjusteStock="";detalleMotivoAjusteStock="";}
  const contenedor=$("#product-stock-list");contenedor.replaceChildren();
  const pendientes=productos.filter(producto=>Object.prototype.hasOwnProperty.call(ajustesStockPendientes,producto.id)&&ajustesStockPendientes[producto.id]!==producto.stock).length;
  if(!pendientes){motivoAjusteStock="";detalleMotivoAjusteStock="";}
  const panel=document.createElement("section");panel.className="panel inventory-summary";
  const titulo=document.createElement("h3");titulo.textContent="Existencias";
  const motivoWrap=document.createElement("div");motivoWrap.className="inventory-reason-fields";
  const motivoSelect=document.createElement("select");motivoSelect.className="inventory-reason-select";motivoSelect.setAttribute("aria-label","Motivo del ajuste de stock");
  [["","Elegí el motivo del ajuste"],["recuento","Recuento / corrección"],["merma","Merma o daño"],["vencimiento","Vencimiento"],["uso_interno","Uso interno"],["devolucion_cliente","Devolución de cliente"],["devolucion_proveedor","Devolución a proveedor"],["otro","Otro"]].forEach(([valor,texto])=>{const opcion=document.createElement("option");opcion.value=valor;opcion.textContent=texto;motivoSelect.append(opcion);});motivoSelect.value=motivoAjusteStock;
  const detalle=document.createElement("input");detalle.type="text";detalle.className="inventory-reason-note";detalle.placeholder="Describí el motivo";detalle.setAttribute("aria-label","Detalle del motivo del ajuste de stock");detalle.value=detalleMotivoAjusteStock;detalle.classList.toggle("hidden",motivoAjusteStock!=="otro");
  const advertenciaMotivo=document.createElement("small");advertenciaMotivo.className="inventory-reason-warning hidden";motivoWrap.append(motivoSelect,detalle,advertenciaMotivo);
  const acciones=document.createElement("div");acciones.className="inventory-actions";
  const cancelar=document.createElement("button");cancelar.type="button";cancelar.className="secondary";cancelar.textContent="Descartar cambios";cancelar.disabled=!pendientes;cancelar.addEventListener("click",cancelarAjustesStock);
  const confirmar=document.createElement("button");confirmar.type="button";confirmar.className="primary";confirmar.textContent="Confirmar cambios";confirmar.addEventListener("click",confirmarAjustesStock);
  const direccionMotivo=()=>["merma","vencimiento","uso_interno","devolucion_proveedor"].includes(motivoAjusteStock)?-1:motivoAjusteStock==="devolucion_cliente"?1:0;
  const hayDireccionInvalida=()=>{const direccion=direccionMotivo();return productos.some(producto=>{const propuesto=Object.prototype.hasOwnProperty.call(ajustesStockPendientes,producto.id)?ajustesStockPendientes[producto.id]:producto.stock;const delta=propuesto-producto.stock;return direccion>0?delta<0:direccion<0?delta>0:false;});};
  const actualizarConfirmacion=()=>{const invalida=hayDireccionInvalida();confirmar.disabled=!pendientes||!sesionActual||!motivoAjusteStock||(motivoAjusteStock==="otro"&&!detalleMotivoAjusteStock.trim())||invalida;advertenciaMotivo.textContent=direccionMotivo()>0?"Este motivo solo permite aumentos. Corregí las disminuciones pendientes.":"Este motivo solo permite disminuciones. Corregí los aumentos pendientes.";advertenciaMotivo.classList.toggle("hidden",!invalida);confirmar.title=!sesionActual?"Abrí un turno para aplicar los ajustes":invalida?"El motivo no permite la dirección de uno o más cambios":"Elegí el motivo para confirmar";};
  motivoSelect.addEventListener("change",()=>{motivoAjusteStock=motivoSelect.value;if(motivoAjusteStock!=="otro")detalleMotivoAjusteStock="";detalle.value=detalleMotivoAjusteStock;detalle.classList.toggle("hidden",motivoAjusteStock!=="otro");guardarEstado();renderStockProductos();});
  detalle.addEventListener("input",()=>{detalleMotivoAjusteStock=detalle.value;actualizarConfirmacion();guardarEstado();});actualizarConfirmacion();
  acciones.append(cancelar,confirmar);panel.append(titulo,motivoWrap,acciones);contenedor.append(panel);
  const lista=document.createElement("div");lista.className="inventory-product-list";
  productos.forEach(producto=>{
    const fila=document.createElement("article");fila.className="inventory-product-card";
    const info=document.createElement("div");info.className="inventory-product-info";
    const nombre=document.createElement("strong");nombre.className="stock-product-name";nombre.textContent=producto.nombre;
    const propuesto=Object.prototype.hasOwnProperty.call(ajustesStockPendientes,producto.id)?ajustesStockPendientes[producto.id]:producto.stock;
    info.append(nombre);
    const stockMinimo=Number(producto.stockMinimo)||0;
    const bajoMinimo=stockMinimo>0&&propuesto<stockMinimo;
    const enMinimo=stockMinimo>0&&propuesto===stockMinimo;
    fila.classList.toggle("has-pending-change",propuesto!==producto.stock);
    fila.classList.toggle("is-low-stock",bajoMinimo);
    if(bajoMinimo||enMinimo){const aviso=document.createElement("small");aviso.className="stock-minimum-badge"+(bajoMinimo?" below":" at-minimum");aviso.textContent=(bajoMinimo?"Bajo mínimo":"En mínimo")+" · "+mostrarCantidad(producto,stockMinimo);info.append(aviso);}
    const controles=document.createElement("div");controles.className="inventory-adjust-controls";
    const menos=document.createElement("button");menos.type="button";menos.className="secondary";menos.textContent="−";menos.setAttribute("aria-label","Reducir existencia de "+producto.nombre);const direccion=direccionMotivo();menos.disabled=!sesionActual||propuesto-producto.paso<cantidadEnCarrito(producto.id)||(direccion>0&&propuesto<=producto.stock);menos.addEventListener("click",()=>cambiarAjustePendiente(producto,-producto.paso));
    const cantidad=document.createElement("strong");cantidad.className="inventory-quantity";cantidad.textContent=mostrarCantidad(producto,propuesto);
    const mas=document.createElement("button");mas.type="button";mas.className="secondary";mas.textContent="+";mas.setAttribute("aria-label","Aumentar existencia de "+producto.nombre);const direccionMas=direccionMotivo();mas.disabled=!sesionActual||(direccionMas<0&&propuesto>=producto.stock);mas.addEventListener("click",()=>cambiarAjustePendiente(producto,producto.paso));
    controles.append(menos,cantidad,mas);fila.append(info,controles);lista.append(fila);
  });
  contenedor.append(lista);
  const movimientos=$("#product-stock-movements");movimientos.replaceChildren();
  if(!movimientosStock.length){movimientos.className="history-empty";movimientos.textContent="Todavía no hay movimientos de stock.";return;}
  movimientos.className="inventory-movements";
  [...movimientosStock].reverse().forEach(mov=>{
    const tarjeta=document.createElement("article");tarjeta.className="movement-card";
    const arriba=document.createElement("div");arriba.className="movement-top";
    const desc=document.createElement("div");const encabezado=document.createElement("div");encabezado.className="movement-title";encabezado.textContent=mov.tipo==="venta"?"Salida por venta":mov.tipo==="reposicion"?"Reposición":mov.tipo==="alta"?"Stock inicial de producto":"Ajuste manual";
    const meta=document.createElement("div");meta.className="movement-meta";meta.textContent=mov.producto+(mov.referencia?" · "+mov.referencia:"")+" · "+new Date(mov.fecha).toLocaleString("es-AR");desc.append(encabezado,meta);
    const cambio=document.createElement("div");cambio.className="movement-amount "+(mov.cantidad>0?"in":"out");const producto=productos.find(p=>p.id===mov.productId);cambio.textContent=(mov.cantidad>0?"+":"−")+mostrarCantidad(producto,Math.abs(mov.cantidad));arriba.append(desc,cambio);tarjeta.append(arriba);movimientos.append(tarjeta);
  });
}
function cambiarAjustePendiente(producto,delta){
  if(!sesionActual)return;const actualPropuesto=Object.prototype.hasOwnProperty.call(ajustesStockPendientes,producto.id)?ajustesStockPendientes[producto.id]:producto.stock;
  const nuevo=redondearCantidad(actualPropuesto+delta);if(nuevo<cantidadEnCarrito(producto.id)||nuevo<0)return;
  ajustesStockPendientes[producto.id]=nuevo;if(nuevo===producto.stock)delete ajustesStockPendientes[producto.id];renderStockProductos();
}
function cancelarAjustesStock(){ajustesStockPendientes={};motivoAjusteStock="";detalleMotivoAjusteStock="";renderStockProductos();guardarEstado();}
function confirmarAjustesStock(){
  if(!sesionActual||!motivoAjusteStock||(motivoAjusteStock==="otro"&&!detalleMotivoAjusteStock.trim()))return;const direccion= ["merma","vencimiento","uso_interno","devolucion_proveedor"].includes(motivoAjusteStock)?-1:motivoAjusteStock==="devolucion_cliente"?1:0;if(productos.some(producto=>{const propuesto=Object.prototype.hasOwnProperty.call(ajustesStockPendientes,producto.id)?ajustesStockPendientes[producto.id]:producto.stock;const delta=propuesto-producto.stock;return direccion>0?delta<0:direccion<0?delta>0:false;}))return;const cambios=productos.filter(producto=>Object.prototype.hasOwnProperty.call(ajustesStockPendientes,producto.id)&&ajustesStockPendientes[producto.id]!==producto.stock);
  if(!cambios.length)return;
  if(cambios.some(producto=>ajustesStockPendientes[producto.id]<cantidadEnCarrito(producto.id))){window.alert("No podés dejar una existencia por debajo de las unidades que están en el carrito.");renderStockProductos();return;}
  const etiquetas={recuento:"Recuento / corrección",merma:"Merma o daño",vencimiento:"Vencimiento",uso_interno:"Uso interno",devolucion_cliente:"Devolución de cliente",devolucion_proveedor:"Devolución a proveedor",otro:"Otro"};const motivoTexto=etiquetas[motivoAjusteStock]+(motivoAjusteStock==="otro"?": "+detalleMotivoAjusteStock.trim():"");
  cambios.forEach(producto=>{const delta=redondearCantidad(ajustesStockPendientes[producto.id]-producto.stock);producto.stock=ajustesStockPendientes[producto.id];registrarMovimientoStock("ajuste",producto,delta,"Ajuste manual · Motivo: "+motivoTexto);});
  ajustesStockPendientes={};motivoAjusteStock="";detalleMotivoAjusteStock="";renderStockProductos();renderCatalogo();guardarEstado();
}

function renderTurno() {
  const content = $("#shift-content"); content.replaceChildren();
  if (sesionActual) {
    const panel = document.createElement("section"); panel.className = "panel";
    const title = document.createElement("h3"); title.textContent = "Turno " + sesionActual.id + " · Abierto";
    const opening = document.createElement("p"); opening.className = "history-meta"; opening.textContent = "Apertura: " + new Date(sesionActual.fechaApertura).toLocaleString("es-AR");
    const starting = document.createElement("p"); starting.textContent = "Efectivo inicial: " + pesos(sesionActual.efectivoInicial);
    const balance = document.createElement("div"); balance.className = "summary"; balance.innerHTML = "<span>Saldo esperado ahora</span><strong>" + pesos(totalCaja()) + "</strong>";
    const close = document.createElement("button"); close.type = "button"; close.className = "danger wide"; close.textContent = "Contar efectivo y cerrar turno"; close.addEventListener("click", renderFormularioCierre);
    panel.append(title, opening, starting, balance, close); content.append(panel);
  } else {
    const panel = document.createElement("section"); panel.className = "panel";
    const text = document.createElement("p"); text.textContent = "No hay un turno abierto. Abrí uno para habilitar cobros y ajustes de caja.";
    const open = document.createElement("button"); open.type = "button"; open.className = "primary wide"; open.textContent = "Abrir turno con el efectivo actual"; open.addEventListener("click", abrirTurno);
    panel.append(text, open); content.append(panel);
  }
  const history = $("#shift-history"); history.replaceChildren();
  const closed = sesionesCaja.filter(turno => turno.estado === "cerrado").slice().reverse();
  if (!closed.length) { history.className = "history-meta"; history.textContent = "Todavía no hay turnos cerrados."; return; }
  history.className = "";
  closed.forEach(turno => {
    const card = document.createElement("article"); card.className = "history-card";
    const title = document.createElement("h3"); title.textContent = "Turno " + turno.id;
    const date = document.createElement("div"); date.className = "history-meta"; date.textContent = new Date(turno.cierre.fecha).toLocaleString("es-AR");
    const totals = document.createElement("div"); totals.className = "history-totals";
    [["Saldo esperado", turno.cierre.esperado], ["Saldo al cierre", turno.cierre.contado], ["Diferencia", turno.cierre.diferencia]].forEach(([label, value]) => {
      const row = document.createElement("div"); row.className = "receipt-line";
      const name = document.createElement("span"); name.textContent = label;
      const amount = document.createElement("strong"); amount.textContent = pesos(value);
      row.append(name, amount); totals.append(row);
    });
    card.append(title, date, totals); history.append(card);
  });
}
function renderFormularioCierre() {
  if (!sesionActual) return;
  const content = $("#shift-content"); content.replaceChildren();
  const panel = document.createElement("section"); panel.className = "panel";
  const title = document.createElement("h3"); title.textContent = "Diferencias de cierre · Turno " + sesionActual.id;
  const help = document.createElement("p"); help.className = "muted"; help.textContent = "Usá + o − para corregir la cantidad esperada de cada denominación. El saldo se actualiza automáticamente.";
  const table = document.createElement("table"); table.className = "shift-table";
  const head = document.createElement("thead"); head.innerHTML = "<tr><th>Denominación</th><th>Esperados</th><th>Diferencia</th></tr>"; table.append(head);
  const body = document.createElement("tbody"); const diferencias = {};
  denominaciones.forEach(value => {
    diferencias[value] = 0;
    const row = document.createElement("tr");
    const name = document.createElement("td"); name.textContent = pesos(value);
    const expected = document.createElement("td"); expected.textContent = String(caja.billetes[value]);
    const controlsCell = document.createElement("td");
    const controls = document.createElement("div"); controls.className = "delta-controls";
    const minus = document.createElement("button"); minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", "Restar un billete de " + pesos(value));
    const display = document.createElement("strong"); display.className = "delta-value"; display.textContent = "0";
    const plus = document.createElement("button"); plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", "Sumar un billete de " + pesos(value));
    const refresh = () => {
      const delta = diferencias[value]; display.textContent = delta > 0 ? "+" + delta : String(delta);
      minus.disabled = delta <= -caja.billetes[value];
      summary();
    };
    minus.addEventListener("click", () => { if (diferencias[value] > -caja.billetes[value]) { diferencias[value]--; refresh(); } });
    plus.addEventListener("click", () => { diferencias[value]++; refresh(); });
    controls.append(minus, display, plus); controlsCell.append(controls); row.append(name, expected, controlsCell); body.append(row);
  });
  table.append(body);
  const result = document.createElement("div"); result.className = "shift-result";
  function summary() {
    const adjustment = denominaciones.reduce((sum, value) => sum + value * diferencias[value], 0);
    const expected = totalCaja(); const closing = expected + adjustment;
    result.textContent = "Saldo esperado: " + pesos(expected) + " · Diferencia: " + (adjustment > 0 ? "+" : "") + pesos(adjustment) + " · Saldo de cierre: " + pesos(closing);
    result.className = "shift-result " + (adjustment === 0 ? "shift-good" : "shift-diff");
  }
  summary();
  const confirm = document.createElement("button"); confirm.type = "button"; confirm.className = "primary wide"; confirm.textContent = "Confirmar cierre de turno";
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "secondary wide"; cancel.textContent = "Cancelar"; cancel.addEventListener("click", renderTurno);
  confirm.addEventListener("click", () => {
    if (!sesionActual) return;
    const expectedTotal = totalCaja(); const counts = {}; const diferenciasCierre = {};
    denominaciones.forEach(value => {
      const delta = diferencias[value]; diferenciasCierre[value] = delta; counts[value] = caja.billetes[value] + delta;
      if (delta) registrarMovimientoDetalle("ajuste", [{ denominacion:value, cantidad:Math.abs(delta) }], "Diferencia de cierre de turno " + sesionActual.id, null, delta * value);
      caja.billetes[value] = counts[value];
    });
    const closingTotal = denominaciones.reduce((sum, value) => sum + value * counts[value], 0);
    sesionActual.estado = "cerrado";
    sesionActual.cierre = { fecha:new Date().toISOString(), esperado:expectedTotal, contado:closingTotal, diferencia:closingTotal-expectedTotal, diferencias: diferenciasCierre, billetesContados:counts };
    sesionActual = null;
    renderTurno(); renderStock(); renderCarrito();
  });
  panel.append(title, help, table, result, confirm, cancel); content.append(panel);
}
function renderMovimientosCaja() {
  const resumen = $("#cash-movement-summary");
  resumen.replaceChildren();
  const balance = document.createElement("div");
  balance.className = "summary";
  const etiqueta = document.createElement("span");
  etiqueta.textContent = "Efectivo actual en caja";
  const importeActual = document.createElement("strong");
  importeActual.textContent = pesos(totalCaja());
  balance.append(etiqueta, importeActual);
  resumen.append(balance);

  const lista = $("#cash-movement-list");
  lista.replaceChildren();
  const movimientosTurnoActual = sesionActual ? movimientosCaja.filter(movimiento => String(movimiento.sesionId) === String(sesionActual.id)) : [];
  if (!movimientosTurnoActual.length) {
    const vacio = document.createElement("div");
    vacio.className = "history-empty";
    vacio.textContent = sesionActual ? "Todavía no hay movimientos en el turno actual." : "No hay un turno activo.";
    lista.append(vacio);
    return;
  }

  [...movimientosTurnoActual].reverse().forEach(movimiento => {
    const registro = document.createElement("details");
    registro.className = "movement-card history-record";
    const cabecera = document.createElement("summary");
    cabecera.className = "history-record-summary cash-movement-summary";

    const fecha = document.createElement("span");
    fecha.className = "history-record-date";
    fecha.textContent = movimiento.fecha ? new Date(movimiento.fecha).toLocaleString("es-AR") : "Movimiento registrado";

    const importe = document.createElement("strong");
    importe.className = "history-record-amount";
    importe.classList.add(movimiento.tipo === "ingreso" ? "in" : movimiento.tipo === "egreso" ? "out" : "adjust");
    const signo = movimiento.importe > 0 ? "+" : movimiento.importe < 0 ? "−" : "";
    importe.textContent = signo + pesos(Math.abs(movimiento.importe));
    cabecera.append(fecha, importe);

    const detalle = document.createElement("div");
    detalle.className = "history-record-details";
    const motivo = document.createElement("h3");
    motivo.textContent = movimiento.motivo || "Movimiento de caja";
    detalle.append(motivo);

    const agregarFila = (etiquetaTexto, valorTexto) => {
      const fila = document.createElement("div");
      fila.className = "history-detail-row";
      const etiqueta = document.createElement("span");
      etiqueta.className = "history-detail-label";
      etiqueta.textContent = etiquetaTexto;
      const valor = document.createElement("span");
      valor.className = "history-detail-value";
      valor.textContent = valorTexto;
      fila.append(etiqueta, valor);
      detalle.append(fila);
    };
    agregarFila("Tipo", movimiento.tipo === "ingreso" ? "Ingreso" : movimiento.tipo === "egreso" ? "Egreso" : "Ajuste");

    const denominacionesMovimiento = Array.isArray(movimiento.detalles) ? movimiento.detalles : [];
    if (denominacionesMovimiento.length) {
      denominacionesMovimiento.forEach(item => agregarFila("Billete de " + pesos(item.denominacion), "× " + item.cantidad));
    } else {
      agregarFila("Billetes", "Sin detalle de billetes");
    }
    if (movimiento.pagoId) agregarFila("Pago", String(movimiento.pagoId));
    if (movimiento.sesionId) agregarFila("Turno", String(movimiento.sesionId));

    registro.append(cabecera, detalle);
    lista.append(registro);
  });
}
function renderHistorial() {
  const contenedor = $("#sales-history");
  const tituloHistorial = $("#sales-history-title");
  const ventasTurnoActual=sesionActual?ventas.filter(venta=>String(venta.sesionId)===String(sesionActual.id)):[];
  if (tituloHistorial) tituloHistorial.textContent = "Historial de ventas (" + ventasTurnoActual.length + ")";
  contenedor.replaceChildren();
  if (!ventasTurnoActual.length) {
    const vacio = document.createElement("div");
    vacio.className = "history-empty";
    vacio.textContent = sesionActual ? "Todavía no hay ventas en el turno actual." : "No hay un turno activo.";
    contenedor.append(vacio);
    return;
  }
  [...ventasTurnoActual].slice(-10).reverse().forEach(venta => {
    const pagoVenta = pagos.find(pago => pago.id === venta.pagoId);
    const registro = document.createElement("details");
    registro.className = "history-card history-record";
    registro.dataset.ventaId = String(venta.id);
    registro.dataset.total = String(venta.total);
    registro.dataset.fecha = venta.fecha || "";
    registro.dataset.formaPago = pagoVenta ? pagoVenta.medio || "" : "";
    const resumen = document.createElement("summary");
    resumen.className = "history-record-summary sales-record-summary";
    const idResumen = document.createElement("strong");
    idResumen.className = "history-record-id";
    idResumen.textContent = "Venta " + venta.id;
    const fechaResumen = document.createElement("span");
    fechaResumen.className = "history-record-date";
    fechaResumen.textContent = venta.fecha ? new Date(venta.fecha).toLocaleString("es-AR") : "Venta completada";
    const medioResumen = document.createElement("span");
    medioResumen.className = "history-record-method";
    medioResumen.textContent = !pagoVenta ? "—" : pagoVenta.medio === "mercado_pago" ? "Mercado Pago" : pagoVenta.medio === "cuenta_corriente" ? "Fiado" : pagoVenta.medio === "efectivo" ? "Efectivo" : pagoVenta.medio === "transferencia" ? "Transferencia" : pagoVenta.medio;
    resumen.append(idResumen, fechaResumen, medioResumen);
    const detalle = document.createElement("div");
    detalle.className = "history-record-details";
    const clienteVenta = venta.cliente || clientes.find(cliente => cliente.id === venta.clienteId)?.nombre || "Venta sin cliente";
    const cliente = document.createElement("div"); cliente.className = "history-detail-row";
    const etiquetaCliente = document.createElement("span"); etiquetaCliente.className = "history-detail-label"; etiquetaCliente.textContent = "Cliente";
    const valorCliente = document.createElement("span"); valorCliente.className = "history-detail-value"; valorCliente.textContent = clienteVenta;
    cliente.append(etiquetaCliente, valorCliente); detalle.append(cliente);
    const detallesVentaActuales=obtenerDetallesVenta(venta.id);
    const items = document.createElement("ul");
    items.className = "history-items";
    detallesVentaActuales.forEach(item => {
      const linea = document.createElement("li");
      linea.className = "history-sale-item";
      const subtotal = Math.round(item.precio * item.cantidad);
      linea.dataset.producto = String(item.nombre);
      linea.dataset.productoId = String(item.productId || "");
      linea.dataset.cantidad = String(item.cantidad);
      linea.dataset.subtotal = String(subtotal);
      const informacion = document.createElement("div");
      informacion.className = "history-sale-item-info";
      const nombre = document.createElement("span");
      nombre.className = "history-sale-item-name";
      nombre.textContent = item.nombre;

      const cantidad = item.cantidad % 1 === 0 ? String(item.cantidad) : new Intl.NumberFormat("es-AR", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(item.cantidad);
      const datosSecundarios = document.createElement("div");
      datosSecundarios.className = "history-sale-item-meta";
      const precio = document.createElement("span");
      precio.className = "history-sale-item-price";
      precio.textContent = pesos(item.precio);
      precio.setAttribute("aria-label", "Precio unitario: " + pesos(item.precio));
      const unidades = document.createElement("span");
      unidades.className = "history-sale-item-quantity";
      unidades.textContent = cantidad;
      unidades.setAttribute("aria-label", "Cantidad: " + cantidad);
      datosSecundarios.append(precio, unidades);
      informacion.append(nombre, datosSecundarios);

      const totalItem = document.createElement("strong");
      totalItem.className = "history-sale-item-subtotal";
      totalItem.textContent = pesos(subtotal);
      totalItem.setAttribute("aria-label", "Subtotal: " + pesos(subtotal));

      linea.append(informacion, totalItem);
      items.append(linea);
    });
    detalle.append(items);
    const pagoHistorial = pagoVenta || {};
    if (pagoHistorial.medio === "cuenta_corriente") {
      const cuentaHistorial = cuentasPorCobrar.find(cuenta => cuenta.ventaId === venta.id);
      const saldo = document.createElement("div"); saldo.className = "history-detail-row";
      const etiquetaSaldo = document.createElement("span"); etiquetaSaldo.className = "history-detail-label"; etiquetaSaldo.textContent = "Saldo pendiente";
      const importeSaldo = document.createElement("strong"); importeSaldo.className = "history-detail-value"; importeSaldo.textContent = pesos(cuentaHistorial ? cuentaHistorial.saldo : venta.total);
      saldo.append(etiquetaSaldo, importeSaldo); detalle.append(saldo);
    }
    const totalVenta = document.createElement("div");
    totalVenta.className = "history-sale-total";
    const etiquetaTotal = document.createElement("span");
    etiquetaTotal.textContent = "Total";
    const importeTotal = document.createElement("strong");
    importeTotal.textContent = pesos(venta.total);
    totalVenta.append(etiquetaTotal, importeTotal);
    detalle.append(totalVenta);
    registro.append(resumen, detalle);
    contenedor.append(registro);
  });
}
