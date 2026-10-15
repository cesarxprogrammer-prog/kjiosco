"use strict";

function abrirCarritoCompra(){const overlay=$("#purchase-cart-overlay");if(!overlay)return;overlay.classList.remove("hidden");overlay.setAttribute("aria-hidden","false");$("#purchase-cart-open")?.setAttribute("aria-expanded","true");document.body.classList.add("cart-open");$("#purchase-cart-close").focus();}
function plegarCarritoCompra(enfocar=true){const overlay=$("#purchase-cart-overlay");if(!overlay)return;overlay.classList.add("hidden");overlay.setAttribute("aria-hidden","true");$("#purchase-cart-open")?.setAttribute("aria-expanded","false");document.body.classList.remove("cart-open");if(enfocar)$("#purchase-cart-open")?.focus();}

function renderReportes() {
  const area=$("#reports-area");area.replaceChildren();
  const periodo=document.createElement("select");periodo.setAttribute("aria-label","Período del reporte");
  [["30","Últimos 30 días"],["7","Últimos 7 días"],["todo","Todo el historial"]].forEach(([valor,texto])=>{const op=document.createElement("option");op.value=valor;op.textContent=texto;periodo.append(op);});
  const panel=document.createElement("section");panel.className="panel";const filtro=document.createElement("label");filtro.textContent="Período";filtro.append(periodo);panel.append(filtro);
  const resumen=document.createElement("div");panel.append(resumen);
  const ventasBox=document.createElement("section");ventasBox.className="panel";const ventasTitulo=document.createElement("h3");ventasTitulo.textContent="Productos más vendidos";ventasBox.append(ventasTitulo);
  const comprasBox=document.createElement("section");comprasBox.className="panel";const comprasTitulo=document.createElement("h3");comprasTitulo.textContent="Compras por proveedor";comprasBox.append(comprasTitulo);
  const actualizar=()=>{
    const desde=periodo.value==="todo"?0:Date.now()-Number(periodo.value)*86400000;
    const ventasPeriodo=ventas.filter(v=>new Date(v.fecha).getTime()>=desde);const ids=new Set(ventasPeriodo.map(v=>v.id));
    const totalVentas=ventasPeriodo.reduce((s,v)=>s+v.total,0);const cobrado=pagos.filter(p=>new Date(p.fecha).getTime()>=desde).reduce((s,p)=>{if(p.cuentaPorCobrarId)return s+p.importe;if(p.ventaId&&p.medio!=="cuenta_corriente"){const venta=ventas.find(v=>v.id===p.ventaId);return s+(venta?venta.total:0);}return s;},0);const ventasConCosto=ventasPeriodo.map(venta=>{const lineas=detallesVenta.filter(detalle=>detalle.ventaId===venta.id);if(!lineas.length||!lineas.every(detalle=>Number.isFinite(detalle.costoUnitario)&&detalle.costoUnitario>0))return null;const costo=lineas.reduce((suma,detalle)=>suma+Math.round(detalle.cantidad*detalle.costoUnitario),0);return{venta,costo,ganancia:venta.total-costo};}).filter(Boolean);const costoProductosPeriodo=ventasConCosto.reduce((suma,item)=>suma+item.costo,0);const gananciaBrutaPeriodo=ventasConCosto.reduce((suma,item)=>suma+item.ganancia,0);
    const pendiente=cuentasPorCobrar.reduce((s,c)=>s+c.saldo,0);
    resumen.replaceChildren();resumen.className="history-totals";
    [["Ventas",String(ventasPeriodo.length)],["Total vendido",pesos(totalVentas)],["Cobrado en el período",pesos(cobrado)],["Cuentas pendientes",pesos(pendiente)],["Ventas con costo registrado",String(ventasConCosto.length)],["Costo de productos",pesos(costoProductosPeriodo)],["Ganancia bruta estimada",pesos(gananciaBrutaPeriodo)]].forEach(([label,value])=>{const fila=document.createElement("div");fila.className="receipt-line";const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=value;fila.append(l,v);resumen.append(fila);});
    const top=new Map();detallesVenta.filter(d=>ids.has(d.ventaId)).forEach(d=>{const actual=top.get(d.productId)||{nombre:d.nombre,cantidad:0,importe:0};actual.cantidad+=d.cantidad;actual.importe+=Math.round(d.cantidad*d.precio);top.set(d.productId,actual);});
    ventasBox.querySelectorAll(".report-row,.history-empty").forEach(el=>el.remove());
    const topRows=[...top.values()].sort((a,b)=>b.cantidad-a.cantidad).slice(0,8);if(!topRows.length){const vacio=document.createElement("div");vacio.className="history-empty";vacio.textContent="Todavía no hay ventas en este período.";ventasBox.append(vacio);}topRows.forEach(x=>{const row=document.createElement("div");row.className="receipt-line report-row";row.textContent=x.nombre+" · "+mostrarCantidad(productos.find(p=>p.nombre===x.nombre)||{unidad:"u"},x.cantidad)+" · "+pesos(x.importe);ventasBox.append(row);});
    const comprasPeriodo=compras.filter(c=>new Date(c.fecha).getTime()>=desde);const porProveedor=new Map();comprasPeriodo.forEach(c=>porProveedor.set(c.proveedor,(porProveedor.get(c.proveedor)||0)+c.total));
    comprasBox.querySelectorAll(".report-row,.history-empty").forEach(el=>el.remove());if(!porProveedor.size){const vacio=document.createElement("div");vacio.className="history-empty";vacio.textContent="Todavía no hay compras en este período.";comprasBox.append(vacio);}porProveedor.forEach((total,nombre)=>{const row=document.createElement("div");row.className="receipt-line report-row";row.textContent=nombre;const importe=document.createElement("strong");importe.textContent=pesos(total);row.append(importe);comprasBox.append(row);});
  };
  periodo.addEventListener("change",actualizar);actualizar();area.append(panel,ventasBox,comprasBox);
  const backup=document.createElement("section");backup.className="panel";const title=document.createElement("h3");title.textContent="Respaldo de datos";const note=document.createElement("p");note.className="muted";note.textContent="Los cambios se guardan automáticamente en IndexedDB de este navegador. Exportá una copia para conservarla o importala para restaurar los datos.";const status=document.createElement("div");status.id="backup-status";status.className="notice";status.textContent=mensajePersistencia;
  const actions=document.createElement("div");actions.className="stock-product-controls";const exportar=document.createElement("button");exportar.type="button";exportar.className="secondary";exportar.textContent="Exportar respaldo";exportar.addEventListener("click",exportarRespaldo);
  const importar=document.createElement("input");importar.type="file";importar.accept=".json,application/json";importar.setAttribute("aria-label","Importar respaldo JSON");importar.addEventListener("change",async evento=>{const archivo=evento.target.files&&evento.target.files[0];if(!archivo)return;try{const datos=JSON.parse(await archivo.text());if(!aplicarRespaldo(datos))throw new Error("Formato inválido");await guardarEstado();renderTodo();const nuevoStatus=$("#backup-status");if(nuevoStatus)nuevoStatus.textContent="Respaldo importado correctamente.";}catch(error){const nuevoStatus=$("#backup-status");if(nuevoStatus)nuevoStatus.textContent="No se pudo importar: revisá que sea un respaldo válido.";}});
  actions.append(exportar,importar);backup.append(title,note,status,actions);area.append(backup);
}
function renderClientes() {
  const area = $("#clients-area"); area.replaceChildren();
  const panel = document.createElement("section"); panel.className = "panel";
  const titulo = document.createElement("h3"); titulo.textContent = "Clientes registrados"; panel.append(titulo);
  const lista = document.createElement("div"); lista.className = "history-items";
  if (!clientes.length) { const vacio = document.createElement("div"); vacio.className = "history-empty"; vacio.textContent = "Todavía no hay clientes registrados."; lista.append(vacio); }
  clientes.forEach(cliente => { const fila = document.createElement("article"); fila.className = "stock-item"; const nombre = document.createElement("strong"); nombre.textContent = cliente.nombre; fila.append(nombre); if (cliente.contacto) { const contacto = document.createElement("span"); contacto.className = "muted"; contacto.textContent = cliente.contacto; fila.append(contacto); } lista.append(fila); });
  const form = document.createElement("form"); form.className = "stock-product-row";
  const nombre = document.createElement("input"); nombre.type = "text"; nombre.placeholder = "Nombre del cliente"; nombre.required = true;
  const contacto = document.createElement("input"); contacto.type = "text"; contacto.placeholder = "Teléfono o contacto (opcional)";
  const guardar = document.createElement("button"); guardar.type = "submit"; guardar.className = "secondary"; guardar.textContent = "Agregar cliente";
  form.append(nombre, contacto, guardar);
  form.addEventListener("submit", evento => { evento.preventDefault(); const valor = nombre.value.trim(); if (!valor) return; clientes.push({ id:Date.now(), nombre:valor, contacto:contacto.value.trim() }); renderClientes(); });
  panel.append(lista, form); area.append(panel);
}
function renderProveedores() {
  const area = $("#providers-area"); area.replaceChildren();
  const panel = document.createElement("section"); panel.className = "panel";
  const lista = document.createElement("div"); lista.className = "history-items";
  if (!proveedores.length) { const vacio = document.createElement("p"); vacio.className = "muted"; vacio.textContent = "Todavía no hay proveedores registrados."; lista.append(vacio); }
  proveedores.forEach(proveedor => { const fila = document.createElement("div"); fila.className = "stock-item"; fila.textContent = proveedor.nombre + (proveedor.contacto ? " · " + proveedor.contacto : ""); lista.append(fila); });
  const form = document.createElement("form"); form.className = "stock-product-row";
  const nombre = document.createElement("input"); nombre.type = "text"; nombre.placeholder = "Nombre del proveedor"; nombre.required = true;
  const contacto = document.createElement("input"); contacto.type = "text"; contacto.placeholder = "Contacto (opcional)";
  const guardar = document.createElement("button"); guardar.type = "submit"; guardar.className = "secondary"; guardar.textContent = "Agregar proveedor";
  form.append(nombre, contacto, guardar);
  form.addEventListener("submit", evento => { evento.preventDefault(); const valor = nombre.value.trim(); if (!valor) return; proveedores.push({ id:Date.now(), nombre:valor, contacto:contacto.value.trim() }); renderProveedores(); });
  panel.append(lista, form); area.append(panel);
}
function renderComprasProveedores() {
  const area = $("#purchases-area"); area.replaceChildren();
  if (avisoCompra) { const notice = document.createElement("div"); notice.className = "notice"; notice.textContent = avisoCompra; area.append(notice); }
  if (pagoCompraActivo) {
    const pagoPanel=document.createElement("section");pagoPanel.className="panel";
    const tituloPago=document.createElement("h3");tituloPago.textContent="Pago de la compra";
    const medioSelector=document.createElement("div");medioSelector.className="category-switch payment-methods";medioSelector.setAttribute("role","group");medioSelector.setAttribute("aria-label","Medio de pago de la compra");
    [["efectivo","Efectivo"],["transferencia","Transferencia"],["mercado_pago","Mercado Pago"]].forEach(([valor,texto])=>{const boton=document.createElement("button");boton.type="button";boton.className="category-button"+(medioPagoCompra===valor?" active":"");boton.textContent=texto;boton.setAttribute("aria-pressed",String(medioPagoCompra===valor));boton.addEventListener("click",()=>{medioPagoCompra=valor;billetesPagoCompra=[];billetesVueltoCompra=[];etapaBilletesCompra="entrega";avisoCompra="";renderComprasProveedores();});medioSelector.append(boton);});
    const proveedor=proveedores.find(item=>String(item.id)===String(proveedorCompraSeleccionado));const nombreProveedor=proveedor?proveedor.nombre:proveedorCompraSeleccionado==="__sin_proveedor__"?"Sin proveedor":"Proveedor";const info=document.createElement("div");info.className="summary";info.innerHTML="<span>"+nombreProveedor+" · Total de compra</span><strong>"+pesos(totalBorradorCompra())+"</strong>";
    const digital=medioPagoCompra!=="efectivo";const sumaEntregada=sumar(billetesPagoCompra);const cambioPendiente=Math.max(0,sumaEntregada-totalBorradorCompra());
    const tituloEtapa=document.createElement("h3");tituloEtapa.textContent=etapaBilletesCompra==="entrega"?"Billetes que entregás":"Billetes de vuelto que recibiste";
    const ayuda=document.createElement("p");ayuda.className="muted";ayuda.textContent=etapaBilletesCompra==="entrega"?"Seleccioná uno por uno los billetes con los que pagás. Podés superar el total; después registrarás el vuelto que te dé el proveedor.":"El proveedor decide las denominaciones. Seleccioná en el contenedor los billetes que efectivamente te devolvió.";
    const opciones=document.createElement("div");opciones.className="change-actions";
    const contenedorBilletes=document.createElement("div");contenedorBilletes.className="purchase-bill-container";contenedorBilletes.setAttribute("aria-label",etapaBilletesCompra==="entrega"?"Billetes seleccionados para entregar":"Billetes de vuelto seleccionados");
    const listaActiva=etapaBilletesCompra==="entrega"?billetesPagoCompra:billetesVueltoCompra;const claseActiva=etapaBilletesCompra==="entrega"?"egreso":"ingreso";
    listaActiva.forEach(valor=>{const ficha=document.createElement("div");ficha.className="chosen "+claseActiva;ficha.style.backgroundImage="url(./img/billetes/"+valor+".png)";ficha.setAttribute("role","img");ficha.setAttribute("aria-label","Billete de "+pesos(valor));ficha.title="Billete de "+pesos(valor);contenedorBilletes.append(ficha);});
    const totalSeleccion=document.createElement("div");totalSeleccion.className="notice";
    const volver=document.createElement("button");volver.type="button";volver.className="secondary wide";volver.textContent="Volver al carrito";volver.addEventListener("click",()=>{pagoCompraActivo=false;billetesPagoCompra=[];billetesVueltoCompra=[];etapaBilletesCompra="entrega";renderComprasProveedores();});
    let acciones=[];
    if(!digital){
      if(etapaBilletesCompra==="entrega"){
        denominaciones.forEach(valor=>{const boton=document.createElement("button");boton.type="button";boton.className="bill egreso";boton.style.backgroundImage="url(./img/billetes/"+valor+".png)";boton.textContent="";boton.title="Billete de "+pesos(valor);const usados=billetesPagoCompra.filter(item=>item===valor).length;boton.disabled=caja.billetes[valor]-usados<=0;boton.setAttribute("aria-label","Agregar billete de "+pesos(valor)+" a los billetes entregados");boton.addEventListener("click",()=>{if(!boton.disabled){billetesPagoCompra.push(valor);billetesVueltoCompra=[];avisoCompra="";renderComprasProveedores();}});opciones.append(boton);});
        totalSeleccion.textContent="Total entregado: "+pesos(sumaEntregada)+(sumaEntregada<totalBorradorCompra()?" · Falta: "+pesos(totalBorradorCompra()-sumaEntregada):" · Vuelto a recibir: "+pesos(cambioPendiente));
      }else{
        denominaciones.forEach(valor=>{const boton=document.createElement("button");boton.type="button";boton.className="bill ingreso";boton.style.backgroundImage="url(./img/billetes/"+valor+".png)";boton.textContent="";boton.disabled=sumar(billetesVueltoCompra)+valor>cambioPendiente;boton.setAttribute("aria-label","Agregar billete de vuelto de "+pesos(valor));boton.addEventListener("click",()=>{if(!boton.disabled){billetesVueltoCompra.push(valor);avisoCompra="";renderComprasProveedores();}});opciones.append(boton);});
        totalSeleccion.textContent="El proveedor debe devolverte: "+pesos(cambioPendiente)+" · Registrado: "+pesos(sumar(billetesVueltoCompra))+(sumar(billetesVueltoCompra)<cambioPendiente?" · Falta: "+pesos(cambioPendiente-sumar(billetesVueltoCompra)):" · Vuelto completo");
      }
      const deshacer=document.createElement("button");deshacer.type="button";deshacer.className="secondary icon-button";deshacer.textContent="↩️";deshacer.title="Deshacer último";deshacer.setAttribute("aria-label","Deshacer último billete");deshacer.disabled=!listaActiva.length;deshacer.addEventListener("click",()=>{listaActiva.pop();if(etapaBilletesCompra==="entrega")billetesVueltoCompra=[];avisoCompra="";renderComprasProveedores();});
      const limpiar=document.createElement("button");limpiar.type="button";limpiar.className="danger icon-button";limpiar.textContent="🗑️";limpiar.title="Vaciar selección";limpiar.setAttribute("aria-label","Vaciar selección de billetes");limpiar.disabled=!listaActiva.length;limpiar.addEventListener("click",()=>{if(etapaBilletesCompra==="entrega"){billetesPagoCompra=[];billetesVueltoCompra=[];}else billetesVueltoCompra=[];avisoCompra="";renderComprasProveedores();});acciones=[deshacer,limpiar];
    }
    const confirmarPago=document.createElement("button");confirmarPago.type="button";confirmarPago.className="primary wide";confirmarPago.textContent=digital?"Confirmar pago y recibir productos":(etapaBilletesCompra==="entrega"?"Continuar a seleccionar el vuelto":"Confirmar compra y actualizar caja");
    if(digital)confirmarPago.disabled=!sesionActual;
    else if(etapaBilletesCompra==="entrega")confirmarPago.disabled=sumaEntregada<totalBorradorCompra();
    else confirmarPago.disabled=sumar(billetesVueltoCompra)!==cambioPendiente;
    confirmarPago.addEventListener("click",()=>{if(digital){finalizarCompra();return;}if(etapaBilletesCompra==="entrega"){if(sumaEntregada<totalBorradorCompra())return;billetesVueltoCompra=[];etapaBilletesCompra="vuelto";avisoCompra="";renderComprasProveedores();return;}finalizarCompra();});
    const filaTotal=document.createElement("div");filaTotal.className="total-row";const grupoAcciones=document.createElement("div");grupoAcciones.className="actions";acciones.forEach(boton=>grupoAcciones.append(boton));filaTotal.append(totalSeleccion,grupoAcciones);
    const botonVolverPaso=document.createElement("button");botonVolverPaso.type="button";botonVolverPaso.className="secondary wide";botonVolverPaso.textContent="Volver a los billetes entregados";botonVolverPaso.classList.toggle("hidden",digital||etapaBilletesCompra!=="vuelto");botonVolverPaso.addEventListener("click",()=>{etapaBilletesCompra="entrega";billetesVueltoCompra=[];renderComprasProveedores();});
    [opciones,contenedorBilletes,filaTotal,tituloEtapa,ayuda,...acciones].forEach(el=>el.classList.toggle("hidden",digital));
    pagoPanel.append(tituloPago,medioSelector,info,tituloEtapa,ayuda,opciones,contenedorBilletes,filaTotal,confirmarPago,botonVolverPaso,volver);area.append(pagoPanel);
  } else {
    const panel = document.createElement("section"); panel.className = "panel procurement-panel";
    const titulo = document.createElement("h3"); titulo.textContent = "Nueva compra";
    const proveedorSelect = document.createElement("select"); proveedorSelect.setAttribute("aria-label", "Proveedor de la compra"); const opcionInicial = document.createElement("option"); opcionInicial.value = ""; opcionInicial.textContent = "Elegí un proveedor"; proveedorSelect.append(opcionInicial);
    proveedores.forEach(proveedor => { const opcion = document.createElement("option"); opcion.value = String(proveedor.id); opcion.textContent = proveedor.nombre; proveedorSelect.append(opcion); });
    const opcionSinProveedor=document.createElement("option");opcionSinProveedor.value="__sin_proveedor__";opcionSinProveedor.textContent="Sin proveedor";proveedorSelect.append(opcionSinProveedor);
    if (proveedorCompraSeleccionado) proveedorSelect.value = String(proveedorCompraSeleccionado);
    proveedorSelect.addEventListener("change", () => { proveedorCompraSeleccionado = proveedorSelect.value === "__sin_proveedor__" ? "__sin_proveedor__" : proveedorSelect.value ? Number(proveedorSelect.value) : null; actualizarResumen(); });
    const catalogo = document.createElement("div"); catalogo.className = "catalog"; catalogo.style.margin = "12px 0";
    productos.forEach(producto => { const tarjeta = document.createElement("button"); tarjeta.type = "button"; tarjeta.className = "product"; tarjeta.style.color = "var(--text)"; tarjeta.style.textAlign = "left"; const nombre = document.createElement("strong"); nombre.textContent = producto.nombre; const stock = document.createElement("small"); stock.textContent = "Stock actual: " + mostrarCantidad(producto, producto.stock); tarjeta.append(nombre, stock); tarjeta.addEventListener("click", () => { const item = borradorCompra.find(linea => linea.productId === producto.id); if (item) item.cantidad = redondearCantidad(item.cantidad + producto.paso); else borradorCompra.push({ productId:producto.id, nombre:producto.nombre, cantidad:producto.paso, costo:Number.isFinite(producto.costo)&&producto.costo>0?producto.costo:null }); renderComprasProveedores(); }); catalogo.append(tarjeta); });
    const carrito=$("#purchase-cart-items");carrito.replaceChildren();
    $("#clear-purchase-cart").disabled=borradorCompra.length===0;
    const totalEl=$("#purchase-cart-total");const continuar=document.createElement("button");continuar.type="button";continuar.id="purchase-cart-checkout";continuar.textContent="Pagar compra";continuar.className="primary wide purchase-checkout-action";const ayudaPago=document.createElement("p");ayudaPago.className="muted purchase-checkout-hint hidden";
    const resumenCarrito=document.createElement("section");resumenCarrito.className="panel purchase-cart-summary";
    const totalCompacto=document.createElement("div");totalCompacto.className="summary";
    const abrir=document.createElement("button");abrir.type="button";abrir.className="secondary wide";abrir.id="purchase-cart-open";abrir.setAttribute("aria-expanded",String(!$("#purchase-cart-overlay").classList.contains("hidden")));abrir.addEventListener("click",abrirCarritoCompra);
    const cantidadCarrito=()=>borradorCompra.reduce((suma,item)=>suma+item.cantidad,0);
    const actualizarResumen=()=>{const total=totalBorradorCompra();const etiqueta=document.createElement("span");etiqueta.textContent="Total";const importe=document.createElement("strong");importe.textContent=pesos(total);totalCompacto.replaceChildren(etiqueta,importe);totalEl.replaceChildren(etiqueta.cloneNode(true),importe.cloneNode(true));abrir.textContent="Ver carrito ("+mostrarUnidadesCompra()+")";abrir.setAttribute("aria-expanded",String(!$("#purchase-cart-overlay").classList.contains("hidden")));const motivo=!sesionActual?"Abrí un turno de caja para poder pagar.":!proveedorSelect.value?"Elegí un proveedor.":!borradorCompra.length?"Agregá productos al carrito.":borradorCompra.some(item=>item.costo===null||item.costo<0)?"Ingresá el costo unitario de cada producto.":total<=0?"El total de la compra debe ser mayor a cero.":"";continuar.disabled=Boolean(motivo);ayudaPago.textContent=motivo;ayudaPago.classList.toggle("hidden",!motivo);};
    function mostrarUnidadesCompra(){return new Intl.NumberFormat("es-AR",{maximumFractionDigits:2}).format(cantidadCarrito());}
    borradorCompra.forEach((item,index)=>{const producto=productos.find(p=>p.id===item.productId);if(!producto)return;const fila=document.createElement("div");fila.className="cart-line";const desc=document.createElement("div");const nombre=document.createElement("div");nombre.className="line-name";nombre.textContent=item.nombre;const costo=document.createElement("input");costo.type="number";costo.min="0";costo.step="1";costo.placeholder=producto.costo>0?pesos(producto.costo):"Sin costo en catálogo";costo.value=item.costo===null?"":String(item.costo);costo.setAttribute("aria-label","Costo de compra por unidad de "+item.nombre);costo.addEventListener("input",()=>{item.costo=costo.value===""?null:Number(costo.value);actualizarResumen();});desc.append(nombre,costo);const controles=document.createElement("div");controles.className="quantity";const menos=document.createElement("button");menos.type="button";menos.textContent="−";menos.disabled=item.cantidad<=producto.paso;menos.setAttribute("aria-label","Quitar una cantidad de "+producto.nombre);menos.addEventListener("click",()=>{item.cantidad=redondearCantidad(item.cantidad-producto.paso);renderComprasProveedores();});const numero=document.createElement("strong");numero.textContent=mostrarCantidad(producto,item.cantidad);const mas=document.createElement("button");mas.type="button";mas.textContent="+";mas.setAttribute("aria-label","Agregar una cantidad de "+producto.nombre);mas.addEventListener("click",()=>{item.cantidad=redondearCantidad(item.cantidad+producto.paso);renderComprasProveedores();});const quitar=document.createElement("button");quitar.type="button";quitar.textContent="🗑️";quitar.setAttribute("aria-label","Quitar "+producto.nombre+" de la compra");quitar.addEventListener("click",()=>{borradorCompra.splice(index,1);renderComprasProveedores();});controles.append(menos,numero,mas,quitar);fila.append(desc,controles);carrito.append(fila);});
    continuar.onclick=()=>{if(!sesionActual){avisoCompra="Abrí un turno de caja antes de pagar la compra.";renderComprasProveedores();return;}if(!continuar.disabled){avisoCompra="";pagoCompraActivo=true;billetesPagoCompra=[];billetesVueltoCompra=[];etapaBilletesCompra="entrega";plegarCarritoCompra(false);renderComprasProveedores();}};
    const resumenAcciones=document.createElement("div");resumenAcciones.className="purchase-cart-summary-row";resumenAcciones.append(totalCompacto,abrir);
    resumenCarrito.append(resumenAcciones);
    continuar.textContent="Pagar compra";continuar.className="primary wide purchase-checkout-action";panel.append(titulo,proveedorSelect,catalogo,resumenCarrito,ayudaPago,continuar);area.append(panel);actualizarResumen();
  }
  const historial=document.createElement("details");historial.className="purchase-history panel";
  const historialTitulo=document.createElement("summary");historialTitulo.textContent="Historial de compras ("+compras.length+")";historial.append(historialTitulo);
  const historialContenido=document.createElement("div");historialContenido.className="purchase-history-content";
  if(!compras.length){const empty=document.createElement("div");empty.className="history-empty";empty.textContent="Todavía no hay compras registradas.";historialContenido.append(empty);}
  [...compras].slice(-10).reverse().forEach(compra=>{
    const pagoCompra = pagos.find(pago => pago.compraId === compra.id);
    const registro=document.createElement("details");
    registro.className="history-card history-record";
    registro.dataset.compraId=String(compra.id);
    registro.dataset.total=String(compra.total);
    registro.dataset.fecha=compra.fecha||"";
    registro.dataset.formaPago=compra.medioPago||"";
    const resumen=document.createElement("summary");
    resumen.className="history-record-summary purchase-record-summary";
    const idResumen=document.createElement("strong");
    idResumen.className="history-record-id";
    idResumen.textContent="Compra "+compra.id;
    const fechaResumen=document.createElement("span");
    fechaResumen.className="history-record-date";
    fechaResumen.textContent=compra.fecha?new Date(compra.fecha).toLocaleString("es-AR"):"Compra registrada";
    const medioResumen=document.createElement("span");
    medioResumen.className="history-record-method";
    const medio=compra.medioPago||(pagoCompra&&pagoCompra.medio)||"—";
    medioResumen.textContent=medio==="mercado_pago"?"Mercado Pago":medio==="transferencia"?"Transferencia":medio==="efectivo"?"Efectivo":medio;
    resumen.append(idResumen,fechaResumen,medioResumen);

    const detalle=document.createElement("div");
    detalle.className="history-record-details";
    const proveedorMeta=document.createElement("div");
    proveedorMeta.className="history-detail-row";
    const proveedorEtiqueta=document.createElement("span");
    proveedorEtiqueta.className="history-detail-label";
    proveedorEtiqueta.textContent="Proveedor";
    const proveedorValor=document.createElement("span");
    proveedorValor.className="history-detail-value";
    proveedorValor.textContent=compra.proveedor||"Sin proveedor";
    proveedorMeta.append(proveedorEtiqueta,proveedorValor);
    detalle.append(proveedorMeta);

    const items=document.createElement("ul");
    items.className="history-items";
    obtenerDetallesCompra(compra.id).forEach(item=>{
      const li=document.createElement("li");
      li.className="history-sale-item";
      const subtotal=Math.round(item.cantidad*item.costo);
      li.dataset.producto=String(item.nombre);
      li.dataset.productoId=String(item.productId||"");
      li.dataset.cantidad=String(item.cantidad);
      li.dataset.subtotal=String(subtotal);
      const info=document.createElement("div");
      info.className="history-sale-item-info";
      const nombre=document.createElement("span");
      nombre.className="history-sale-item-name";
      nombre.textContent=item.nombre;
      const meta=document.createElement("div");
      meta.className="history-sale-item-meta";
      const costo=document.createElement("span");
      costo.className="history-sale-item-price";
      costo.textContent=pesos(item.costo);
      costo.setAttribute("aria-label","Costo unitario: "+pesos(item.costo));
      const producto=productos.find(p=>p.id===item.productId);
      const cantidad=mostrarCantidad(producto,item.cantidad);
      const unidades=document.createElement("span");
      unidades.className="history-sale-item-quantity";
      unidades.textContent=cantidad;
      unidades.setAttribute("aria-label","Cantidad: "+cantidad);
      meta.append(costo,unidades);
      info.append(nombre,meta);
      const importeItem=document.createElement("strong");
      importeItem.className="history-sale-item-subtotal";
      importeItem.textContent=pesos(subtotal);
      importeItem.setAttribute("aria-label","Subtotal: "+pesos(subtotal));
      li.append(info,importeItem);
      items.append(li);
    });
    detalle.append(items);
    const totalFila=document.createElement("div");
    totalFila.className="history-sale-total";
    const totalEtiqueta=document.createElement("span");
    totalEtiqueta.textContent="Total";
    const totalImporte=document.createElement("strong");
    totalImporte.textContent=pesos(compra.total);
    totalFila.append(totalEtiqueta,totalImporte);
    detalle.append(totalFila);
    registro.append(resumen,detalle);
    historialContenido.append(registro);
  });
  historial.append(historialContenido);area.append(historial);

}
