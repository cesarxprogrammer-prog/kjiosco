"use strict";

function pesos(valor) {
  return valor.toLocaleString("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 });
}
function sumar(billetes) {
  return billetes.reduce((total, valor) => total + valor, 0);
}
function cantidadEnCarrito(id) {
  return carrito.get(id) || 0;
}
function cantidadCarrito(id) {
  return cantidadEnCarrito(id);
}
function totalCarrito() {
  return productos.reduce((total, producto) => total + importeProducto(producto, cantidadEnCarrito(producto.id)), 0);
}
function unidadesCarrito() {
  return Array.from(carrito.values()).reduce((suma, cantidad) => suma + cantidad, 0);
}
function contarBilletes(lista, valor) {
  return lista.filter(item => item === valor).length;
}
function stockDisponible(valor, lista = billetesVuelto) {
  return caja.billetes[valor] - contarBilletes(lista, valor);
}
function puedeAgregarBilleteVuelto(valor) {
  return etapa === "vuelto" &&
    denominaciones.includes(valor) &&
    stockDisponible(valor) > 0 &&
    sumar(billetesVuelto) + valor <= vueltoEsperado;
}
function resumirBilletes(lista) {
  return denominaciones.map(denominacion => ({ denominacion, cantidad:contarBilletes(lista, denominacion) })).filter(item => item.cantidad > 0);
}
function textoBilletes(lista) {
  const detalle = resumirBilletes(lista);
  return detalle.length ? detalle.map(item => pesos(item.denominacion) + " × " + item.cantidad).join(", ") : "Sin billetes";
}
function registrarMovimientoStock(tipo, producto, cantidad, referencia) {
  movimientosStock.push({ fecha:new Date().toISOString(), tipo, productId:producto.id, producto:producto.nombre, cantidad, referencia:referencia || "" });
}
function registrarMovimiento(tipo, billetes, motivo, pagoId, importe) {
  registrarMovimientoDetalle(tipo, resumirBilletes(billetes), motivo, pagoId, importe);
}
function registrarMovimientoDetalle(tipo, detalles, motivo, pagoId, importe) {
  movimientosCaja.push({ fecha:new Date().toISOString(), tipo, detalles, motivo, pagoId:pagoId || null, sesionId:sesionActual ? sesionActual.id : null, importe });
}
function totalCaja() {
  return denominaciones.reduce((total, valor) => total + valor * caja.billetes[valor], 0);
}
function redondearCantidad(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
function mostrarCantidad(producto, cantidad) {
  if (producto.unidad === "kg") {
    return new Intl.NumberFormat("es-AR", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(cantidad) + " kg";
  }
  return String(cantidad) + " u.";
}
function importeProducto(producto, cantidad) {
  return Math.round(producto.precio * cantidad);
}
