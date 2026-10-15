"use strict";

const CLAVE_ESTADO = "simulacion-cobro-vuelto-v1";
const REPOSITORIO_ESTADO = {
  nombreBD:"simulacion-pos", nombreColeccion:"estado", clave:"principal", conexion:null,
  abrir() {
    if(this.conexion)return Promise.resolve(this.conexion);
    if(!window.indexedDB)return Promise.reject(new Error("IndexedDB no está disponible"));
    return new Promise((resolve,reject)=>{const solicitud=indexedDB.open(this.nombreBD,1);solicitud.onupgradeneeded=()=>{const db=solicitud.result;if(!db.objectStoreNames.contains(this.nombreColeccion))db.createObjectStore(this.nombreColeccion);};solicitud.onsuccess=()=>{this.conexion=solicitud.result;this.conexion.onversionchange=()=>this.conexion.close();resolve(this.conexion);};solicitud.onerror=()=>reject(solicitud.error||new Error("No se pudo abrir IndexedDB"));});
  },
  async leer() { const db=await this.abrir();return new Promise((resolve,reject)=>{const tx=db.transaction(this.nombreColeccion,"readonly");const solicitud=tx.objectStore(this.nombreColeccion).get(this.clave);solicitud.onsuccess=()=>resolve(solicitud.result||null);solicitud.onerror=()=>reject(solicitud.error);}); },
  async guardar(datos) { const db=await this.abrir();return new Promise((resolve,reject)=>{const tx=db.transaction(this.nombreColeccion,"readwrite");tx.objectStore(this.nombreColeccion).put(datos,this.clave);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error("No se pudo guardar en IndexedDB"));tx.onabort=()=>reject(tx.error||new Error("El guardado se interrumpió"));}); }
};
let guardarSoloLocalmente=false;
let mensajePersistencia="Los datos se guardan en IndexedDB en este navegador.";
let colaGuardado=Promise.resolve();
function snapshotEstado() {
  return { version:1, productos, categorias, caja, ventas, detallesVenta, pagos, movimientosCaja, sesionesCaja, movimientosStock, proveedores, clientes, cuentasPorCobrar, compras, detallesCompra, carrito:etapa==="venta"?[...carrito.entries()]:[], borradorCompra, ajustesStockPendientes, ajustesBilletesPendientes, motivoAjusteStock, detalleMotivoAjusteStock, motivoAjusteBilletes, detalleMotivoAjusteBilletes, numeroDetalleVenta, numeroDetalleCompra, numeroCuentaPorCobrar, numeroCompra, numeroPago, numeroSesion, numeroVenta, sesionActual:sesionActual?{id:sesionActual.id}:null, pagoCompraActivo, medioPagoCompra, billetesPagoCompra, billetesVueltoCompra, proveedorCompraSeleccionado, avisoCompra };
}
function aplicarRespaldo(datos) {
  if(!datos||datos.version!==1||!Array.isArray(datos.productos)||!datos.productos.length||!datos.productos.every(p=>p&&Number.isFinite(p.stock)&&p.stock>=0&&Number.isFinite(p.precio)&&p.precio>=0)||!datos.caja||!datos.caja.billetes||typeof datos.caja.billetes!=="object")return false;
  for(const valor of denominaciones){if(!Object.prototype.hasOwnProperty.call(datos.caja.billetes,valor))datos.caja.billetes[valor]=0;const cantidad=Number(datos.caja.billetes[valor]);if(!Number.isInteger(cantidad)||cantidad<0)return false;}
  datos.productos.forEach(producto=>{if(!Number.isFinite(producto.costo)||producto.costo<0)producto.costo=0;});
  const colecciones={productos,categorias,ventas,detallesVenta,pagos,movimientosCaja,sesionesCaja,movimientosStock,proveedores,clientes,cuentasPorCobrar,compras,detallesCompra};
  for(const nombre of Object.keys(colecciones)){if(!Array.isArray(datos[nombre]))datos[nombre]=[];}
  for(const [nombre,coleccion] of Object.entries(colecciones))coleccion.splice(0,coleccion.length,...datos[nombre]);
  for(const valor of denominaciones)caja.billetes[valor]=Number(datos.caja.billetes[valor]);
  carrito.clear();if(Array.isArray(datos.carrito))datos.carrito.forEach(([id,cantidad])=>{const p=productos.find(item=>item.id===id);if(p&&Number.isFinite(cantidad)&&cantidad>0&&cantidad<=p.stock)carrito.set(id,cantidad);});
  borradorCompra=Array.isArray(datos.borradorCompra)?datos.borradorCompra:[];ajustesStockPendientes=datos.ajustesStockPendientes&&typeof datos.ajustesStockPendientes==="object"&&!Array.isArray(datos.ajustesStockPendientes)?datos.ajustesStockPendientes:{};ajustesBilletesPendientes=datos.ajustesBilletesPendientes&&typeof datos.ajustesBilletesPendientes==="object"&&!Array.isArray(datos.ajustesBilletesPendientes)?datos.ajustesBilletesPendientes:{};motivoAjusteStock=typeof datos.motivoAjusteStock==="string"?datos.motivoAjusteStock:"";detalleMotivoAjusteStock=typeof datos.detalleMotivoAjusteStock==="string"?datos.detalleMotivoAjusteStock:"";motivoAjusteBilletes=typeof datos.motivoAjusteBilletes==="string"?datos.motivoAjusteBilletes:"";detalleMotivoAjusteBilletes=typeof datos.detalleMotivoAjusteBilletes==="string"?datos.detalleMotivoAjusteBilletes:"";pagoCompraActivo=Boolean(datos.pagoCompraActivo);medioPagoCompra=datos.medioPagoCompra||"efectivo";billetesPagoCompra=Array.isArray(datos.billetesPagoCompra)?datos.billetesPagoCompra:[];billetesVueltoCompra=Array.isArray(datos.billetesVueltoCompra)?datos.billetesVueltoCompra:[];proveedorCompraSeleccionado=datos.proveedorCompraSeleccionado||null;avisoCompra=datos.avisoCompra||"";
  if(Number.isInteger(datos.numeroDetalleVenta)&&datos.numeroDetalleVenta>0)numeroDetalleVenta=datos.numeroDetalleVenta;if(Number.isInteger(datos.numeroDetalleCompra)&&datos.numeroDetalleCompra>0)numeroDetalleCompra=datos.numeroDetalleCompra;if(Number.isInteger(datos.numeroCuentaPorCobrar)&&datos.numeroCuentaPorCobrar>0)numeroCuentaPorCobrar=datos.numeroCuentaPorCobrar;if(Number.isInteger(datos.numeroCompra)&&datos.numeroCompra>0)numeroCompra=datos.numeroCompra;if(Number.isInteger(datos.numeroPago)&&datos.numeroPago>0)numeroPago=datos.numeroPago;if(Number.isInteger(datos.numeroSesion)&&datos.numeroSesion>0)numeroSesion=datos.numeroSesion;if(Number.isInteger(datos.numeroVenta)&&datos.numeroVenta>0)numeroVenta=datos.numeroVenta;
  sesionActual=datos.sesionActual?sessionsFind(datos.sesionActual.id):null;return true;
}
function sessionsFind(id){return sesionesCaja.find(s=>s.id===id&&s.estado==="abierto")||null;}
async function cargarEstado() {
  try { const estado=await REPOSITORIO_ESTADO.leer();if(estado&&aplicarRespaldo(estado)){guardarSoloLocalmente=false;mensajePersistencia="Datos recuperados desde IndexedDB.";return true;} } catch(error) { console.warn("IndexedDB no está disponible; se intentará recuperar el guardado anterior.",error);guardarSoloLocalmente=true; }
  try { const texto=localStorage.getItem(CLAVE_ESTADO);if(texto){const datos=JSON.parse(texto);if(aplicarRespaldo(datos)){try{guardarSoloLocalmente=false;await REPOSITORIO_ESTADO.guardar(datos);localStorage.removeItem(CLAVE_ESTADO);mensajePersistencia="Datos anteriores migrados a IndexedDB.";}catch(error){guardarSoloLocalmente=true;mensajePersistencia="Guardado local del navegador activo; IndexedDB no está disponible.";}return true;}} } catch(error) { console.warn("No se pudo recuperar el guardado anterior.",error); }
  return false;
}
async function guardarEstado() {
  if(etapa!=="venta"&&etapa!=="finalizada"){const status=$("#backup-status");if(status)status.textContent="El cobro está en curso; se guardará al finalizar.";return false;}
  const datos=snapshotEstado();colaGuardado=colaGuardado.catch(()=>{}).then(async()=>{try{if(guardarSoloLocalmente)throw new Error("Fallback local");await REPOSITORIO_ESTADO.guardar(datos);mensajePersistencia="Guardado automático en IndexedDB · "+new Date().toLocaleTimeString("es-AR");}catch(error){guardarSoloLocalmente=true;try{localStorage.setItem(CLAVE_ESTADO,JSON.stringify(datos));mensajePersistencia="Guardado automático local · "+new Date().toLocaleTimeString("es-AR");}catch(localError){mensajePersistencia="No se pudo guardar; exportá un respaldo JSON.";}}const status=$("#backup-status");if(status)status.textContent=mensajePersistencia;});return colaGuardado;
}
function exportarRespaldo() { try { const archivo=new Blob([JSON.stringify(snapshotEstado(),null,2)],{type:"application/json"});const url=URL.createObjectURL(archivo);const enlace=document.createElement("a");enlace.href=url;enlace.download="respaldo-pos-"+new Date().toISOString().slice(0,10)+".json";enlace.click();URL.revokeObjectURL(url); } catch(error) { const status=$("#backup-status");if(status)status.textContent="No se pudo crear el respaldo."; } }
function renderTodo() { actualizarFiltroCategorias();renderCatalogo();renderCarrito();renderStock();renderHistorial();renderCuentasPorCobrar();renderComprasProveedores();renderStockProductos();renderCategorias();renderClientes();renderProveedores();renderTurno();renderReportes(); }
function instalarGuardadoAutomatico() { ["click","input","change","submit"].forEach(tipo=>document.addEventListener(tipo,()=>queueMicrotask(guardarEstado)));window.addEventListener("beforeunload",guardarEstado);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")guardarEstado();}); }
async function iniciarAplicacion() {
  await cargarEstado();renderHistorial();if(!sesionActual)abrirTurno();instalarGuardadoAutomatico();renderTodo();await guardarEstado();
}
