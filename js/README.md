# Estructura de la aplicación

Punto de entrada: `../simulacion-cobro-vuelto.html`. Los scripts clásicos se cargan en orden para permitir abrir el prototipo con `file://` y mantener el guardado del navegador.

- `01-estado-y-referencias.js`: estado y referencias al DOM.
- `02-reglas-de-negocio.js`: cálculos, validaciones y registro de movimientos.
- `03-catalogo-y-carrito.js`: selección de productos y carrito.
- `04-navegacion-y-categorias.js`: navegación y categorías.
- `05-clientes-y-cuentas.js`: clientes, cuentas por cobrar y cobros parciales.
- `06-persistencia.js`: IndexedDB, migración del guardado anterior y respaldos JSON.
- `07-reportes-y-directorios.js`: reportes, clientes y proveedores.
- `08-compras.js`: operaciones de compra, pagos y billetes entregados.
- `09-caja-inventario-e-historial.js`: caja, sesiones, stock e historial.
- `10-cobros.js`: medios de pago, efectivo y vuelto.
- `11-gestion-productos.js`: alta y edición del catálogo, precios y costos.
- `12-eventos-y-arranque.js`: eventos de interfaz e inicio.
- `../simulacion-cobro-vuelto.css`: estilos.

Los módulos todavía comparten el ámbito global de esta aplicación prototipo. La separación por archivos facilita mantener cada área y migrar después a módulos ES y servicios/repositorios sin alterar el flujo de uso actual.
