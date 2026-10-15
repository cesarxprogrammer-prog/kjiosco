"use strict";

let cuentaAbiertaId = null;

function renderCuentasPorCobrar() {
  const area=$("#receivables-area");area.replaceChildren();
  if(!cuentasPorCobrar.length){const vacio=document.createElement("div");vacio.className="history-empty";vacio.textContent="Todavía no hay cuentas por cobrar.";area.append(vacio);return;}
  [...cuentasPorCobrar].reverse().forEach(cuenta=>{
    const registro=document.createElement("details");
    registro.className="history-card history-record receivable-record";
    registro.dataset.cuentaId=String(cuenta.id);
    registro.dataset.ventaId=String(cuenta.ventaId);
    registro.dataset.total=String(cuenta.importe);
    registro.dataset.saldo=String(cuenta.saldo);
    registro.dataset.fecha=cuenta.fecha||"";
    registro.open=cuentaAbiertaId===cuenta.id;
    registro.addEventListener("toggle",()=>{if(registro.open)cuentaAbiertaId=cuenta.id;else if(cuentaAbiertaId===cuenta.id)cuentaAbiertaId=null;});

    const cabecera=document.createElement("summary");
    cabecera.className="history-record-summary receivable-record-summary";
    const idVenta=document.createElement("strong");
    idVenta.className="history-record-id";
    idVenta.textContent="Venta "+cuenta.ventaId;
    const fecha=document.createElement("span");
    fecha.className="history-record-date";
    fecha.textContent=cuenta.fecha?new Date(cuenta.fecha).toLocaleString("es-AR"):"Cuenta registrada";
    const estado=document.createElement("span");
    estado.className="history-record-method receivable-balance";
    estado.textContent=cuenta.saldo>0?"Saldo "+pesos(cuenta.saldo):"Pagada";
    cabecera.append(idVenta,fecha,estado);

    const detalle=document.createElement("div");
    detalle.className="history-record-details";
    const agregarFila=(etiquetaTexto,valorTexto)=>{const fila=document.createElement("div");fila.className="history-detail-row";const etiqueta=document.createElement("span");etiqueta.className="history-detail-label";etiqueta.textContent=etiquetaTexto;const valor=document.createElement("span");valor.className="history-detail-value";valor.textContent=valorTexto;fila.append(etiqueta,valor);detalle.append(fila);};
    agregarFila("Cliente",cuenta.cliente||"Venta sin cliente");
    agregarFila("Importe original",pesos(cuenta.importe));

    const pagosCuenta=Array.isArray(cuenta.pagosRealizados)&&cuenta.pagosRealizados.length?cuenta.pagosRealizados:pagos.filter(pago=>pago.cuentaPorCobrarId===cuenta.id);
    const tituloPagos=document.createElement("h4");
    tituloPagos.className="receivable-payments-title";
    tituloPagos.textContent="Pagos realizados · "+pagosCuenta.length;
    detalle.append(tituloPagos);
    if(pagosCuenta.length){
      const listaPagos=document.createElement("div");listaPagos.className="receivable-payments-list";
      pagosCuenta.forEach(pago=>{
        const fila=document.createElement("article");fila.className="receivable-payment";
        fila.dataset.pagoId=String(pago.id);
        fila.dataset.importe=String(pago.importe);
        const info=document.createElement("div");info.className="receivable-payment-info";
        const medio=document.createElement("strong");medio.className="receivable-payment-method";
        medio.textContent=pago.medio==="mercado_pago"?"Mercado Pago":pago.medio==="transferencia"?"Transferencia":pago.medio==="efectivo"?"Efectivo":pago.medio||"Pago";
        const fechaPago=document.createElement("span");fechaPago.className="receivable-payment-date";fechaPago.textContent=pago.fecha?new Date(pago.fecha).toLocaleString("es-AR"):"Fecha no disponible";
        info.append(medio,fechaPago);
        const importePago=document.createElement("strong");importePago.className="receivable-payment-amount";importePago.textContent=pesos(pago.importe);
        fila.append(info,importePago);listaPagos.append(fila);
      });
      detalle.append(listaPagos);
    }else{
      const sinPagos=document.createElement("div");sinPagos.className="history-meta";sinPagos.textContent="Todavía no hay pagos registrados.";detalle.append(sinPagos);
    }

    if(cuenta.saldo>0){
      if(!cuenta.metodoCobro)cuenta.metodoCobro="efectivo";if(!cuenta.billetesCobro)cuenta.billetesCobro=[];
      const ingreso=document.createElement("input");ingreso.type="number";ingreso.min="1";ingreso.max=String(cuenta.saldo);ingreso.step="1";ingreso.value=String(cuenta.importeCobro||cuenta.saldo);ingreso.setAttribute("aria-label","Importe a cobrar");
      const etiquetaImporte=document.createElement("label");etiquetaImporte.className="receivable-charge-label";etiquetaImporte.textContent="Importe de este cobro";etiquetaImporte.append(ingreso);detalle.append(etiquetaImporte);
      const metodos=document.createElement("div");metodos.className="category-switch payment-methods";metodos.setAttribute("role","group");metodos.setAttribute("aria-label","Medio de cobro");
      const actualizarBotones=()=>{const monto=Number(ingreso.value);const exacto=cuenta.metodoCobro!=="efectivo"||sumar(cuenta.billetesCobro)===monto;confirmar.disabled=!sesionActual||!Number.isFinite(monto)||monto<=0||monto>cuenta.saldo||!exacto;};
      ingreso.addEventListener("input",()=>{cuenta.importeCobro=Number(ingreso.value)||0;billetesCaja.querySelectorAll("button").forEach(b=>b.disabled=sumar(cuenta.billetesCobro)+Number(b.dataset.denominacion)>cuenta.importeCobro);actualizarBotones();guardarEstado();});
      [["efectivo","Efectivo"],["transferencia","Transferencia"],["mercado_pago","Mercado Pago"]].forEach(([valor,texto])=>{const b=document.createElement("button");b.type="button";b.className="category-button"+(cuenta.metodoCobro===valor?" active":"");b.textContent=texto;b.setAttribute("aria-pressed",String(cuenta.metodoCobro===valor));b.addEventListener("click",()=>{cuenta.metodoCobro=valor;cuenta.billetesCobro=[];renderCuentasPorCobrar();});metodos.append(b);});detalle.append(metodos);
      const billetesCaja=document.createElement("div");billetesCaja.className="change-actions";billetesCaja.classList.toggle("hidden",cuenta.metodoCobro!=="efectivo");
      denominaciones.forEach(valor=>{const b=document.createElement("button");b.type="button";b.className="bill ingreso";b.dataset.denominacion=String(valor);b.style.backgroundImage="url(./img/billetes/"+valor+".png)";b.textContent="";b.setAttribute("aria-label","Billete de "+pesos(valor));b.disabled=sumar(cuenta.billetesCobro)+valor>Number(ingreso.value);b.addEventListener("click",()=>{if(!b.disabled){cuenta.billetesCobro.push(valor);renderCuentasPorCobrar();}});billetesCaja.append(b);});detalle.append(billetesCaja);
      const billetesSeleccionados=document.createElement("div");billetesSeleccionados.className="purchase-bill-container";billetesSeleccionados.classList.toggle("hidden",cuenta.metodoCobro!=="efectivo");billetesSeleccionados.setAttribute("aria-label","Billetes seleccionados para el cobro");cuenta.billetesCobro.forEach(valor=>{const ficha=document.createElement("div");ficha.className="chosen ingreso";ficha.style.backgroundImage="url(./img/billetes/"+valor+".png)";ficha.setAttribute("role","img");ficha.setAttribute("aria-label","Billete de "+pesos(valor));billetesSeleccionados.append(ficha);});detalle.append(billetesSeleccionados);
      const resumenCobro=document.createElement("div");resumenCobro.className="notice";resumenCobro.textContent=cuenta.metodoCobro==="efectivo"?(cuenta.billetesCobro.length?"Billetes seleccionados: "+textoBilletes(cuenta.billetesCobro)+" · Total: "+pesos(sumar(cuenta.billetesCobro)):"Elegí billetes para completar el importe exacto."):"El cobro se registrará sin usar billetes.";detalle.append(resumenCobro);
      const acciones=document.createElement("div");acciones.className="stock-product-controls";const deshacer=document.createElement("button");deshacer.type="button";deshacer.textContent="Deshacer";deshacer.disabled=!cuenta.billetesCobro.length;deshacer.addEventListener("click",()=>{cuenta.billetesCobro.pop();renderCuentasPorCobrar();});const vaciar=document.createElement("button");vaciar.type="button";vaciar.textContent="Vaciar";vaciar.disabled=!cuenta.billetesCobro.length;vaciar.addEventListener("click",()=>{cuenta.billetesCobro=[];renderCuentasPorCobrar();});acciones.append(deshacer,vaciar);acciones.classList.toggle("hidden",cuenta.metodoCobro!=="efectivo");detalle.append(acciones);
      const confirmar=document.createElement("button");confirmar.type="button";confirmar.className="primary wide";confirmar.textContent="Registrar cobro";confirmar.addEventListener("click",()=>registrarCobroCuenta(cuenta.id,Number(ingreso.value)));detalle.append(confirmar);
      actualizarBotones();
    }
    registro.append(cabecera,detalle);
    area.append(registro);
  });
}
function registrarCobroCuenta(id, importe) {
  const cuenta=cuentasPorCobrar.find(item=>item.id===id);if(!cuenta||cuenta.saldo<=0||!sesionActual)return;
  const monto=Number(importe);if(!Number.isFinite(monto)||monto<=0||monto>cuenta.saldo)return;
  const efectivo=cuenta.metodoCobro==="efectivo";if(efectivo&&sumar(cuenta.billetesCobro)!==monto)return;
  const pago={id:numeroPago++,cuentaPorCobrarId:cuenta.id,ventaId:cuenta.ventaId,sesionId:sesionActual.id,fecha:new Date().toISOString(),medio:cuenta.metodoCobro,importe:monto};pagos.push(pago);
  if(efectivo){denominaciones.forEach(valor=>{caja.billetes[valor]+=contarBilletes(cuenta.billetesCobro,valor);});registrarMovimiento("ingreso",cuenta.billetesCobro,"Cobro de cuenta de venta "+cuenta.ventaId,pago.id,monto);}
  if(!cuenta.pagosRealizados)cuenta.pagosRealizados=[];cuenta.pagosRealizados.push({id:pago.id,fecha:pago.fecha,medio:pago.medio,importe:monto});
  cuenta.saldo=redondearCantidad(cuenta.saldo-monto);cuenta.fechaPago=cuenta.saldo===0?pago.fecha:null;cuenta.metodoFinal=cuenta.saldo===0?cuenta.metodoCobro:null;cuenta.pagoFinalId=cuenta.saldo===0?pago.id:null;cuenta.billetesCobro=[];cuenta.importeCobro=cuenta.saldo;
  renderCuentasPorCobrar();renderStock();guardarEstado();
}
