"use strict";

function elegirCategoria(tipo) {
  const mostrarChicos = tipo === "chicos";
  $("#section-chicos").classList.toggle("hidden", !mostrarChicos);
  $("#section-peso").classList.toggle("hidden", mostrarChicos);
  $("#select-chicos").classList.toggle("active", mostrarChicos);
  $("#select-chicos").setAttribute("aria-pressed", String(mostrarChicos));
  $("#select-peso").classList.toggle("active", !mostrarChicos);
  $("#select-peso").setAttribute("aria-pressed", String(!mostrarChicos));
}
function abrirCarrito() {
  $("#cart-overlay").classList.remove("hidden");
  $("#cart-overlay").setAttribute("aria-hidden", "false");
  $("#toggle-cart-open").setAttribute("aria-expanded", "true");
  document.body.classList.add("cart-open");
  $("#toggle-cart-close").focus();
}
function plegarCarrito() {
  $("#cart-overlay").classList.add("hidden");
  $("#cart-overlay").setAttribute("aria-hidden", "true");
  $("#toggle-cart-open").setAttribute("aria-expanded", "false");
  document.body.classList.remove("cart-open");
  $("#toggle-cart-open").focus();
}
function renderCatalogo() {
  const renderGrupo = (destino, tipo) => {
    destino.replaceChildren();
    productos.filter(producto => producto.tipo === tipo).forEach(producto => {
      const reservado = cantidadEnCarrito(producto.id);
      const disponible = redondearCantidad(producto.stock - reservado);
      const tarjeta = document.createElement("article");
      tarjeta.className = "product";
      const nombre = document.createElement("h3");
      nombre.textContent = producto.nombre;
      if (producto.imagen) { const foto = document.createElement("img"); foto.className = "product-photo"; foto.src = producto.imagen; foto.alt = "Imagen de " + producto.nombre; tarjeta.append(foto); }
      const precio = document.createElement("p");
      precio.className = "price";
      precio.textContent = pesos(producto.precio) + (producto.unidad === "kg" ? " / kg" : "");
      const stock = document.createElement("small");
      stock.className = "product-stock";
      stock.textContent = new Intl.NumberFormat("es-AR", { maximumFractionDigits:2 }).format(disponible);
      tarjeta.setAttribute("role", "button");
      tarjeta.setAttribute("tabindex", "0");
      tarjeta.setAttribute("aria-label", "Agregar " + producto.nombre + " al carrito");
      tarjeta.append(nombre, precio, stock);
      const agregarAlCarrito = () => {
        const nuevaCantidad = redondearCantidad(cantidadEnCarrito(producto.id) + producto.paso);
        if (nuevaCantidad > producto.stock) return;
        carrito.set(producto.id, nuevaCantidad);
        renderCatalogo();
        renderCarrito();
      };
      tarjeta.addEventListener("click", agregarAlCarrito);
      tarjeta.addEventListener("keydown", evento => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          agregarAlCarrito();
        }
      });
      destino.append(tarjeta);
    });
  };
  renderGrupo(catalogoChicos, "chico");
  renderGrupo(catalogoPeso, "peso");
}
function renderCarrito() {
  carritoElemento.replaceChildren();
  $("#clear-sale-cart").disabled = unidadesCarrito() === 0;
  if (unidadesCarrito() === 0) {
    const vacio = document.createElement("div");
    vacio.className = "cart-empty";
    vacio.textContent = "Todavía no agregaste productos.";
    carritoElemento.append(vacio);
  } else {
    const lineas = document.createElement("div");
    lineas.className = "cart-lines";
    productos.filter(p => cantidadEnCarrito(p.id) > 0).forEach(producto => {
      const cantidad = cantidadEnCarrito(producto.id);
      const fila = document.createElement("div");
      fila.className = "cart-line";
      const desc = document.createElement("div");
      const nombre = document.createElement("div");
      nombre.className = "line-name";
      nombre.textContent = producto.nombre;
      const unitario = document.createElement("small");
      const unidadPrecio = producto.unidad === "kg" ? " / kg" : " c/u";
      unitario.textContent = pesos(producto.precio) + unidadPrecio + " · " + pesos(importeProducto(producto, cantidad));
      desc.append(nombre, unitario);
      const acciones = document.createElement("div");
      acciones.className = "quantity";
      const menos = document.createElement("button");
      menos.type = "button";
      menos.textContent = "−";
      menos.setAttribute("aria-label", "Quitar " + mostrarCantidad(producto, producto.paso) + " de " + producto.nombre);
      menos.addEventListener("click", () => {
        const nuevaCantidad = redondearCantidad(cantidadEnCarrito(producto.id) - producto.paso);
        if (nuevaCantidad <= 0) carrito.delete(producto.id);
        else carrito.set(producto.id, nuevaCantidad);
        renderCatalogo();
        renderCarrito();
      });
      const numero = document.createElement("strong");
      numero.textContent = mostrarCantidad(producto, cantidad);
      const mas = document.createElement("button");
      mas.type = "button";
      mas.textContent = "+";
      mas.disabled = cantidad + producto.paso > producto.stock;
      mas.setAttribute("aria-label", "Agregar " + mostrarCantidad(producto, producto.paso) + " de " + producto.nombre);
      mas.addEventListener("click", () => {
        if (cantidad + producto.paso <= producto.stock) carrito.set(producto.id, redondearCantidad(cantidad + producto.paso));
        renderCatalogo();
        renderCarrito();
      });
      acciones.append(menos, numero, mas);
      fila.append(desc, acciones);
      lineas.append(fila);
    });
    carritoElemento.append(lineas);
  }
  $("#sale-total").textContent = pesos(totalCarrito());
  $("#toggle-cart-open").textContent = "Ver carrito (" + unidadesCarrito() + ")";
  $("#start-payment").disabled = unidadesCarrito() === 0 || !sesionActual;
  $("#start-payment").textContent = "Cobrar";
}
function renderStock() {
  const destino=$("#cash-stock");destino.replaceChildren();
  const pendientes=denominaciones.filter(valor=>Object.prototype.hasOwnProperty.call(ajustesBilletesPendientes,valor)&&ajustesBilletesPendientes[valor]!==caja.billetes[valor]).length;
  if(!pendientes){motivoAjusteBilletes="";detalleMotivoAjusteBilletes="";}
  const panel=document.createElement("section");panel.className="panel inventory-summary";
  const totalActual=document.createElement("div");totalActual.className="cash-stock-total";totalActual.textContent="Total registrado: "+pesos(totalCaja());
  const motivoWrap=document.createElement("div");motivoWrap.className="inventory-reason-fields";
  const motivoSelect=document.createElement("select");motivoSelect.className="inventory-reason-select";motivoSelect.setAttribute("aria-label","Motivo del ajuste de efectivo");
  [["","Elegí el motivo del ajuste"],["recuento","Recuento"],["ingreso_manual","Ingreso manual"],["retiro_manual","Retiro manual"],["diferencia","Diferencia de caja"],["otro","Otro"]].forEach(([valor,texto])=>{const opcion=document.createElement("option");opcion.value=valor;opcion.textContent=texto;motivoSelect.append(opcion);});motivoSelect.value=motivoAjusteBilletes;
  const detalle=document.createElement("input");detalle.type="text";detalle.className="inventory-reason-note";detalle.placeholder="Describí el motivo";detalle.setAttribute("aria-label","Detalle del motivo del ajuste de efectivo");detalle.value=detalleMotivoAjusteBilletes;detalle.classList.toggle("hidden",motivoAjusteBilletes!=="otro");
  const advertenciaMotivo=document.createElement("small");advertenciaMotivo.className="inventory-reason-warning hidden";motivoWrap.append(motivoSelect,detalle,advertenciaMotivo);
  const actions=document.createElement("div");actions.className="inventory-actions";
  const cancelar=document.createElement("button");cancelar.type="button";cancelar.className="secondary";cancelar.textContent="Descartar cambios";cancelar.disabled=!pendientes;cancelar.addEventListener("click",()=>{ajustesBilletesPendientes={};motivoAjusteBilletes="";detalleMotivoAjusteBilletes="";renderStock();guardarEstado();});
  const confirmar=document.createElement("button");confirmar.type="button";confirmar.className="primary";confirmar.textContent="Confirmar cambios";confirmar.addEventListener("click",confirmarAjustesBilletes);
  const direccionMotivo=()=>motivoAjusteBilletes==="ingreso_manual"?1:motivoAjusteBilletes==="retiro_manual"?-1:0;
  const hayDireccionInvalida=()=>{const direccion=direccionMotivo();return denominaciones.some(valor=>{const delta=(Object.prototype.hasOwnProperty.call(ajustesBilletesPendientes,valor)?ajustesBilletesPendientes[valor]:caja.billetes[valor])-caja.billetes[valor];return direccion>0?delta<0:direccion<0?delta>0:false;});};
  const actualizarConfirmacion=()=>{const invalida=hayDireccionInvalida();confirmar.disabled=!pendientes||!sesionActual||!motivoAjusteBilletes||(motivoAjusteBilletes==="otro"&&!detalleMotivoAjusteBilletes.trim())||invalida;advertenciaMotivo.textContent=direccionMotivo()>0?"Este motivo solo permite aumentos. Corregí las disminuciones pendientes.":"Este motivo solo permite disminuciones. Corregí los aumentos pendientes.";advertenciaMotivo.classList.toggle("hidden",!invalida);confirmar.title=!sesionActual?"Abrí un turno para aplicar los ajustes":invalida?"El motivo no permite la dirección de uno o más cambios":"Elegí el motivo para confirmar";};
  motivoSelect.addEventListener("change",()=>{motivoAjusteBilletes=motivoSelect.value;if(motivoAjusteBilletes!=="otro")detalleMotivoAjusteBilletes="";detalle.value=detalleMotivoAjusteBilletes;detalle.classList.toggle("hidden",motivoAjusteBilletes!=="otro");guardarEstado();renderStock();});
  detalle.addEventListener("input",()=>{detalleMotivoAjusteBilletes=detalle.value;actualizarConfirmacion();guardarEstado();});actualizarConfirmacion();
  actions.append(cancelar,confirmar);panel.append(totalActual,motivoWrap,actions);destino.append(panel);
  const lista=document.createElement("div");lista.className="inventory-product-list";
  denominaciones.forEach(valor=>{
    const fila=document.createElement("article");fila.className="inventory-product-card";
    const info=document.createElement("div");info.className="inventory-product-info";
    const nombre=document.createElement("strong");nombre.textContent=pesos(valor);const propuesto=Object.prototype.hasOwnProperty.call(ajustesBilletesPendientes,valor)?ajustesBilletesPendientes[valor]:caja.billetes[valor];
    const miniatura=document.createElement("img");miniatura.className="inventory-note-thumbnail";miniatura.src="./img/billetes/"+valor+".png";miniatura.alt="";info.append(miniatura,nombre);fila.classList.toggle("has-pending-change",propuesto!==caja.billetes[valor]);
    const controls=document.createElement("div");controls.className="inventory-adjust-controls";
    const menos=document.createElement("button");menos.type="button";menos.className="secondary";menos.textContent="−";menos.setAttribute("aria-label","Reducir billetes de "+pesos(valor));const direccion=direccionMotivo();menos.disabled=!sesionActual||propuesto<=0||(direccion>0&&propuesto<=caja.billetes[valor]);menos.addEventListener("click",()=>cambiarAjusteBilletes(valor,-1));
    const cuenta=document.createElement("strong");cuenta.className="inventory-quantity";cuenta.textContent=String(propuesto);
    const mas=document.createElement("button");mas.type="button";mas.className="secondary";mas.textContent="+";mas.setAttribute("aria-label","Aumentar billetes de "+pesos(valor));const direccionMas=direccionMotivo();mas.disabled=!sesionActual||(direccionMas<0&&propuesto>=caja.billetes[valor]);mas.addEventListener("click",()=>cambiarAjusteBilletes(valor,1));controls.append(menos,cuenta,mas);fila.append(info,controls);lista.append(fila);
  });destino.append(lista);
}
function cambiarAjusteBilletes(valor,delta){if(!sesionActual)return;const actual=Object.prototype.hasOwnProperty.call(ajustesBilletesPendientes,valor)?ajustesBilletesPendientes[valor]:caja.billetes[valor];const nuevo=actual+delta;if(nuevo<0)return;ajustesBilletesPendientes[valor]=nuevo;if(nuevo===caja.billetes[valor])delete ajustesBilletesPendientes[valor];renderStock();}
function confirmarAjustesBilletes(){if(!sesionActual||!motivoAjusteBilletes||(motivoAjusteBilletes==="otro"&&!detalleMotivoAjusteBilletes.trim()))return;const direccion=motivoAjusteBilletes==="ingreso_manual"?1:motivoAjusteBilletes==="retiro_manual"?-1:0;if(denominaciones.some(valor=>{const delta=(Object.prototype.hasOwnProperty.call(ajustesBilletesPendientes,valor)?ajustesBilletesPendientes[valor]:caja.billetes[valor])-caja.billetes[valor];return direccion>0?delta<0:direccion<0?delta>0:false;}))return;const cambios=denominaciones.filter(valor=>Object.prototype.hasOwnProperty.call(ajustesBilletesPendientes,valor)&&ajustesBilletesPendientes[valor]!==caja.billetes[valor]);if(!cambios.length)return;const etiquetas={recuento:"Recuento",ingreso_manual:"Ingreso manual",retiro_manual:"Retiro manual",diferencia:"Diferencia de caja",otro:"Otro"};const motivoTexto=etiquetas[motivoAjusteBilletes]+(motivoAjusteBilletes==="otro"?": "+detalleMotivoAjusteBilletes.trim():"");cambios.forEach(valor=>{const delta=ajustesBilletesPendientes[valor]-caja.billetes[valor];caja.billetes[valor]=ajustesBilletesPendientes[valor];registrarMovimiento("ajuste",Array(Math.abs(delta)).fill(valor),(delta>0?"Ingreso manual de efectivo":"Retiro manual de efectivo")+" · Motivo: "+motivoTexto,null,delta*valor);});ajustesBilletesPendientes={};motivoAjusteBilletes="";detalleMotivoAjusteBilletes="";renderStock();renderTurno();guardarEstado();}
