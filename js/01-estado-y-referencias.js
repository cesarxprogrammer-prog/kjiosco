"use strict";

"use strict";

const categorias = [{ id:"bebidas", nombre:"Bebidas" }, { id:"almacen", nombre:"Almacén" }, { id:"frutas-verduras", nombre:"Frutas y verduras" }];
const productos = [
  { id:"agua", nombre:"Agua mineral 500 ml", precio:1200, costo:0, stock:18, tipo:"chico", categoriaId:"bebidas", unidad:"u", paso:1 },
  { id:"galletitas", nombre:"Galletitas clásicas", precio:1500, costo:0, stock:24, tipo:"chico", categoriaId:"almacen", unidad:"u", paso:1 },
  { id:"arroz", nombre:"Arroz 1 kg", precio:1800, costo:0, stock:16, tipo:"chico", categoriaId:"almacen", unidad:"u", paso:1 },
  { id:"aceite", nombre:"Aceite 900 ml", precio:2600, costo:0, stock:12, tipo:"chico", categoriaId:"almacen", unidad:"u", paso:1 },
  { id:"yerba", nombre:"Yerba mate 1 kg", precio:3500, costo:0, stock:14, tipo:"chico", categoriaId:"almacen", unidad:"u", paso:1 },
  { id:"cafe", nombre:"Café molido 250 g", precio:4800, costo:0, stock:9, tipo:"chico", categoriaId:"almacen", unidad:"u", paso:1 },
  { id:"tomate", nombre:"Tomate", precio:1800, costo:0, stock:20, tipo:"peso", categoriaId:"frutas-verduras", unidad:"kg", paso:0.25 },
  { id:"papa", nombre:"Papa", precio:1200, costo:0, stock:30, tipo:"peso", categoriaId:"frutas-verduras", unidad:"kg", paso:0.25 },
  { id:"manzana", nombre:"Manzana", precio:2400, costo:0, stock:18, tipo:"peso", categoriaId:"frutas-verduras", unidad:"kg", paso:0.25 }
];

const denominaciones = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 10];
const caja = { billetes: { 20000:4, 10000:6, 2000:8, 1000:10, 500:12, 200:15, 100:20, 50:20, 10:30 } };
const carrito = new Map();
const ventas = [];
const detallesVenta = [];
let numeroDetalleVenta = 1;
const pagos = [];
const movimientosCaja = [];
const sesionesCaja = [];
const movimientosStock = [];
const proveedores = [{ id:1, nombre:"Distribuidora Central", contacto:"" }, { id:2, nombre:"Frutas y Verduras del Sur", contacto:"" }];
const clientes = [];
const cuentasPorCobrar = [];
let numeroCuentaPorCobrar = 1;
let clienteVentaSeleccionado = null;
const compras = [];
const detallesCompra = [];
let numeroDetalleCompra = 1;
let borradorCompra = [];
let numeroCompra = 1;
let pagoCompraActivo = false;
let medioPagoCompra = "efectivo";
let billetesPagoCompra = [];
let billetesVueltoCompra = [];
let etapaBilletesCompra = "entrega";
let ajustesStockPendientes = {};
let ajustesBilletesPendientes = {};
let motivoAjusteStock = "";
let detalleMotivoAjusteStock = "";
let motivoAjusteBilletes = "";
let detalleMotivoAjusteBilletes = "";
let proveedorCompraSeleccionado = null;
let avisoCompra = "";
let sesionActual = null;
let numeroSesion = 1;
let etapa = "venta";
let numeroVenta = 1001;
let ventaActual = null;
let pagoActual = null;
let medioPagoVenta = "efectivo";
let numeroPago = 1;
let billetesRecibidos = [];
let billetesVuelto = [];
let vueltoEsperado = 0;

const $ = selector => document.querySelector(selector);
const catalogoChicos = $("#catalog-chicos");
const catalogoPeso = $("#catalog-peso");
const carritoElemento = $("#cart");
const disponibles = $("#disponibles");
const seleccionados = $("#seleccionados");
const mensaje = $("#mensaje");
const detalle = $("#detalle");
const totalTexto = $("#total");
const botonDeshacer = $("#deshacer");
const botonVaciar = $("#vaciar");
const botonAceptar = $("#aceptar-ingreso");
const botonGenerar = $("#generar-vuelto");
const botonAprobar = $("#aprobar-vuelto");
