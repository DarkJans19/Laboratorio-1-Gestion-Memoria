function actualizarMemoria(){
  actualizarVisualizacionMemoria();
  mostrarInformacionMemoria();
  actualizarListaProcesos();
}

function inicializarDinamicaSinCompactacion() {
  const tamSO = 1024; 
  memoria = [
    { tipo: 'SO', inicio: 0, tamano: tamSO, ocupado: true, proceso: { nombre: 'SO', tamano: tamSO } },
    { tipo: 'libre', inicio: tamSO, tamano: MEMORIA_TOTAL_KiB - tamSO, ocupado: false, proceso: null }
  ];
  procesos = [];

  actualizarMemoria();
}


function precargarProgramasDinamicos() {
  if (!algoritmoElegido) {
    console.log("No se puede precargar sin algoritmo seleccionado");
    return;
  }

  console.log("Precargando programas con algoritmo:", algoritmoElegido);

  let exitosos = 0;
  let fallidos = 0;

  PROGRAMAS_PREDEFINIDOS.forEach(p => {
    const resultado = asignarProcesoDinamicaSinCompactacion(
      { nombre: p.nombre, tamano: p.tamano },
      algoritmoElegido
    );
    
    if (resultado) {
      exitosos++;
    } else {
      fallidos++;
    }
  });
}

function asignarProcesoDinamicaSinCompactacion(proceso, algoritmo) {
  if (!algoritmo) { alert("Selecciona un algoritmo antes de asignar procesos"); return false; }
  if (!proceso.tamano || proceso.tamano <= 0) { alert("El tamaño del proceso debe ser mayor a 0"); return false; }

  let indice = -1;
  if (algoritmo === 'Primer ajuste') indice = primerAjusteDinamico(proceso.tamano);
  else if (algoritmo === 'Mejor ajuste') indice = mejorAjusteDinamico(proceso.tamano);
  else if (algoritmo === 'Peor ajuste') indice = peorAjusteDinamico(proceso.tamano);

  if (indice === -1) {
    alert(`No hay hueco disponible para ${proceso.nombre} (${proceso.tamano} KiB)`);
    return false;
  }

  const bloque = memoria[indice];
  const espacioRestante = bloque.tamano - proceso.tamano;

  if (espacioRestante === 0) {
    bloque.tipo = 'proceso';
    bloque.ocupado = true;
    bloque.proceso = { nombre: proceso.nombre, tamano: proceso.tamano };
  }

  else {
    const nuevoBloqueLibre = {
      tipo: 'libre',
      inicio: bloque.inicio + proceso.tamano,
      tamano: espacioRestante,
      ocupado: false,
      proceso: null
    };

    bloque.tipo = 'proceso';
    bloque.ocupado = true;
    bloque.tamano = proceso.tamano;
    bloque.proceso = { nombre: proceso.nombre, tamano: proceso.tamano };
    memoria.splice(indice + 1, 0, nuevoBloqueLibre);
  }

  const nombreCompleto = `${proceso.nombre} (${proceso.tamano} KiB)`;
  if (!procesos.includes(nombreCompleto)) procesos.push(nombreCompleto);

  actualizarMemoria();

  return true;
}

function eliminarProcesoDinamicaSinCompactacion(nombreProceso) {
  let eliminado = false;

  for (let i = 0; i < memoria.length; i++) {
    const bloque = memoria[i];
    if (bloque.ocupado && bloque.proceso?.nombre === nombreProceso) {

      bloque.ocupado = false;
      bloque.tipo = 'libre';
      bloque.proceso = null;
      eliminado = true;
      procesos = procesos.filter(p => !p.startsWith(`${nombreProceso} (`));
      break;
    }
  }

  if (!eliminado) return false;


  actualizarMemoria();

  return true;
}

function recalcularInicios() {
  let inicioActual = 0;
  memoria.forEach(b => {
    b.inicio = inicioActual;
    inicioActual += b.tamano;
  });
}
