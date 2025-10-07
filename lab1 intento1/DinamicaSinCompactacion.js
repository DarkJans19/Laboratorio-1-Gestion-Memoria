function actualizarMemoria(){
  // Refresca toda la información visual y de estado de la memoria
  actualizarVisualizacionMemoria();
  mostrarInformacionMemoria();
  actualizarListaProcesos();
}

// Inicializa la memoria dinámica sin compactación
function inicializarDinamicaSinCompactacion() {
  const tamSO = 1024; // Tamaño reservado para el sistema operativo (1 MiB)

  memoria = [
    { tipo: 'SO', inicio: 0, tamano: tamSO, ocupado: true, proceso: { nombre: 'SO', tamano: tamSO } },
    { tipo: 'libre', inicio: tamSO, tamano: MEMORIA_TOTAL_KiB - tamSO, ocupado: false, proceso: null }
  ];

  procesos = []; // Reinicia la lista de procesos
  actualizarMemoria(); // Actualiza la vista general
}

// Carga los programas predefinidos en memoria según el algoritmo elegido
function precargarProgramasDinamicos() {
  if (!algoritmoElegido) {
    alert("No se puede precargar sin algoritmo seleccionado");
    return;
  }

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

// Asigna un proceso a la memoria dinámica sin compactación
function asignarProcesoDinamicaSinCompactacion(proceso, algoritmo) {
  if (!algoritmo) { alert("Selecciona un algoritmo antes de asignar procesos"); return false; }
  if (!proceso.tamano || proceso.tamano <= 0) { alert("El tamaño del proceso debe ser mayor a 0"); return false; }

  let indice = -1;

  // Busca el hueco adecuado según el algoritmo seleccionado
  if (algoritmo === 'Primer ajuste') indice = primerAjusteDinamico(proceso.tamano);
  else if (algoritmo === 'Mejor ajuste') indice = mejorAjusteDinamico(proceso.tamano);
  else if (algoritmo === 'Peor ajuste') indice = peorAjusteDinamico(proceso.tamano);

  if (indice === -1) {
    alert(`No hay espacio para ${proceso.nombre} (${proceso.tamano} KiB)`);
    return false;
  }

  const bloque = memoria[indice];
  const espacioRestante = bloque.tamano - proceso.tamano;

  // Si el proceso ocupa todo el bloque
  if (espacioRestante === 0) {
    bloque.tipo = 'proceso';
    bloque.ocupado = true;
    bloque.proceso = { nombre: proceso.nombre, tamano: proceso.tamano };
  }

  // Si queda espacio libre, se crea un nuevo bloque
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

  // Agrega el proceso a la lista visible
  const nombreCompleto = `${proceso.nombre} (${proceso.tamano} KiB)`;
  if (!procesos.includes(nombreCompleto)) procesos.push(nombreCompleto);

  actualizarMemoria(); // Refresca la vista
  return true;
}

// Une dos bloques libres juntos
function fusionarBloques(indice) {
  let fusionable = false;
  
  if (indice >= 0 && (indice + 1) < memoria.length) {
    fusionable = !memoria[indice].ocupado && !memoria[indice + 1].ocupado;
  }
  
  if (fusionable) {
    const tamanoSiguiente = memoria[indice + 1].tamano;
    memoria[indice].tamano += tamanoSiguiente;
    memoria.splice(indice + 1, 1);
  }
  
  return fusionable;
}

// Elimina un proceso de la memoria y fusiona los espacios libres juntos
function eliminarProcesoDinamicaSinCompactacion(nombreProceso) {
  let indiceEliminado = -1;
  let eliminado = false;

  // Busca el proceso a eliminar
  for (let i = 0; i < memoria.length; i++) {
    const bloque = memoria[i];
    if (bloque.ocupado && bloque.proceso?.nombre === nombreProceso) {
      bloque.ocupado = false;
      bloque.tipo = 'libre';
      bloque.proceso = null;
      indiceEliminado = i;
      eliminado = true;
      procesos = procesos.filter(p => !p.startsWith(`${nombreProceso} (`));
      break;
    }
  }

  if (!eliminado) return false;

  let fusionesRealizadas = 0;
  
  // Fusionar con el bloque anterior
  if (indiceEliminado > 0) {
    if (fusionarBloques(indiceEliminado - 1)) {
      fusionesRealizadas++;
      indiceEliminado--;
    }
  }
  
  // Fusionar con el bloque siguiente
  if (indiceEliminado < memoria.length - 1) {
    if (fusionarBloques(indiceEliminado)) {
      fusionesRealizadas++;
    }
  }

  actualizarMemoria(); // Refrescar la vista
  return true;
}

// Recalcular las direcciones de inicio de cada bloque en la memoria
function recalcularInicios() {
  let inicioActual = 0;
  memoria.forEach(b => {
    b.inicio = inicioActual;
    inicioActual += b.tamano;
  });
}
