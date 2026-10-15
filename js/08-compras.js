"use strict";

function obtenerDetallesVenta(ventaId) { return detallesVenta.filter(detalle => detalle.ventaId === ventaId); }
function obtenerDetallesCompra(compraId) { return detallesCompra.filter(detalle => detalle.compraId === compraId); }
function totalBorradorCompra() { return Math.round(borradorCompra.reduce((total, item) => total + item.cantidad * (item.costo || 0), 0)); }
function finalizarCompra() {
  if(!sesionActual){avisoCompra="Abrí un turno de caja antes de pagar la compra.";renderComprasProveedores();return;}
  if(!borradorCompra.length){avisoCompra="Agregá productos antes de pagar la compra.";renderComprasProveedores();return;}
  const total=totalBorradorCompra();
  if(borradorCompra.some(item=>!Number.isFinite(item.costo)||item.costo<0)){avisoCompra="Revisá los costos de los productos antes de continuar.";renderComprasProveedores();return;}
  const proveedorOpcional=proveedorCompraSeleccionado==="__sin_proveedor__";const proveedor=proveedores.find(item=>String(item.id)===String(proveedorCompraSeleccionado));if(!proveedor&&!proveedorOpcional){avisoCompra="Elegí un proveedor o seleccioná Sin proveedor.";renderComprasProveedores();return;}
  let entregado=0,vueltoRecibido=0;
  if(medioPagoCompra==="efectivo"){
    entregado=sumar(billetesPagoCompra);vueltoRecibido=entregado-total;
    if(vueltoRecibido<0){avisoCompra="Los billetes entregados no alcanzan el total de la compra.";renderComprasProveedores();return;}
    if(sumar(billetesVueltoCompra)!==vueltoRecibido){avisoCompra="Registrá exactamente el vuelto que te entregó el proveedor.";renderComprasProveedores();return;}
    for(const valor of denominaciones){if(billetesPagoCompra.filter(item=>item===valor).length>caja.billetes[valor]){avisoCompra="La caja ya no tiene suficientes billetes de esa denominación.";renderComprasProveedores();return;}}
  }
  const compra={id:numeroCompra++,proveedorId:proveedor?proveedor.id:null,proveedor:proveedor?proveedor.nombre:"Sin proveedor",medioPago:medioPagoCompra,fecha:new Date().toISOString(),sesionId:sesionActual.id,total};
  if(medioPagoCompra==="efectivo"){compra.efectivoEntregado=entregado;compra.vueltoRecibido=vueltoRecibido;compra.billetesEntregados=billetesPagoCompra.slice();compra.billetesVuelto=billetesVueltoCompra.slice();}
  const lineasCompra=borradorCompra.map(item=>({...item}));
  const pago={id:numeroPago++,compraId:compra.id,sesionId:sesionActual.id,fecha:new Date().toISOString(),medio:medioPagoCompra,importe:compra.total};
  compra.pagoId=pago.id;compras.push(compra);
  lineasCompra.forEach(item=>detallesCompra.push({id:numeroDetalleCompra++,compraId:compra.id,...item}));
  pagos.push(pago);
  if(medioPagoCompra==="efectivo"){
    denominaciones.forEach(valor=>{caja.billetes[valor]-=billetesPagoCompra.filter(item=>item===valor).length;caja.billetes[valor]+=billetesVueltoCompra.filter(item=>item===valor).length;});
    registrarMovimiento("egreso",billetesPagoCompra,"Pago de compra "+compra.id+(proveedor?" a "+proveedor.nombre:" sin proveedor"),pago.id,-entregado);
    if(vueltoRecibido>0)registrarMovimiento("ingreso",billetesVueltoCompra,"Vuelto recibido por compra "+compra.id+(proveedor?" de "+proveedor.nombre:" sin proveedor"),pago.id,vueltoRecibido);
  }
  obtenerDetallesCompra(compra.id).forEach(item=>{const producto=productos.find(p=>p.id===item.productId);if(!producto)return;producto.costo=item.costo;producto.stock=redondearCantidad(producto.stock+item.cantidad);registrarMovimientoStock("reposicion",producto,item.cantidad,"Compra "+compra.id+(proveedor?" · "+proveedor.nombre:" · Sin proveedor"));});
  avisoCompra="";
  borradorCompra=[];billetesPagoCompra=[];billetesVueltoCompra=[];etapaBilletesCompra="entrega";pagoCompraActivo=false;medioPagoCompra="efectivo";
  renderComprasProveedores();renderStockProductos();renderStock();renderCatalogo();guardarEstado();
}
