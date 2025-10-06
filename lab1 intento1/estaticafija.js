function inicializarParticionesFijas() {
    memoria = [];

let posicion = 0;
memoria.push({ tipo: 'SO', inicio: posicion, tamano: 1024, ocupado: true, proceso: { nombre: 'SO', tamano: 1024 } });
posicion += 1024;

for (let i = 1; i <= 15; i++) {
  memoria.push({
    tipo: 'particion',
    nombre: `Partición ${i}`,
    inicio: posicion,
    tamano: 1024,
    ocupado: false,
    proceso: null,
    fragmentacionInterna: 0
  });
  posicion += 1024;
}

    asignarProgramasPredeterminados();
}

function asignarProgramasPredeterminados() {
    let programasAsignados = 0;
    
    PROGRAMAS_PREDEFINIDOS.forEach(programa => {
        if (programasAsignados < 5) {
            const proceso = { nombre: programa.nombre, tamano: programa.tamano };

            const particionesLibres = memoria.filter(bloque => 
                bloque.tipo === 'particion' && !bloque.ocupado
            );
            
            if (particionesLibres.length > 0 && proceso.tamano <= TAMANO_PARTICION_KiB) {
                const particion = particionesLibres[0];
                particion.ocupado = true;
                particion.proceso = proceso;
                particion.fragmentacionInterna = TAMANO_PARTICION_KiB - proceso.tamano;
                
                procesos.push(programa);
                programasAsignados++;
            }
        }
    });
    
    actualizarVisualizacionMemoria();
    actualizarListaProcesos();
}

function asignarProcesoEstaticaFija(proceso, algoritmo) {
  if (algoritmo !== 'Primer ajuste') {
    alert(`ERROR: En partición estática fija solo se puede usar "Primer ajuste".\nAlgoritmo seleccionado: "${algoritmo}"`);
    return false;
  }

  if (proceso.tamano <= 0) {
    alert(`ERROR: El tamaño debe ser mayor a 0 KiB`);
    return false;
  }

  if (proceso.tamano > TAMANO_PARTICION_KiB) {
    alert(`ERROR: El proceso ${proceso.nombre} requiere ${proceso.tamano} KiB pero las particiones son de ${TAMANO_PARTICION_KiB} KiB`);
    return false;
  }

  // Buscar particiones libres
  const particionesLibres = memoria.filter(bloque => 
    bloque.tipo === 'particion' && !bloque.ocupado
  );

  // Usar el algoritmo de primer ajuste
  const resultado = primerAjuste(particionesLibres, proceso.tamano);

  if (!resultado.encontrado) {
    alert("No hay particiones libres disponibles");
    return false;
  }

  const particionSeleccionada = resultado.espacio;

  // Asignar el proceso
  particionSeleccionada.ocupado = true;
  particionSeleccionada.proceso = proceso;
  particionSeleccionada.fragmentacionInterna = TAMANO_PARTICION_KiB - proceso.tamano;

  procesos.push(proceso);
  actualizarVisualizacionMemoria();
  actualizarListaProcesos();
  return true;
}

function eliminarProcesoEstaticaFija(nombreProceso) {
    let procesoEliminado = false;

    memoria.forEach(bloque => {
        if (bloque.ocupado && bloque.proceso && bloque.proceso.nombre === nombreProceso) {
            bloque.ocupado = false;
            bloque.proceso = null;
            bloque.fragmentacionInterna = 0;
            procesoEliminado = true;
        }
    });

    if (procesoEliminado) {

        procesos = procesos.filter(p => p.nombre !== nombreProceso);

        actualizarVisualizacionMemoria();
        actualizarListaProcesos();
        mostrarInformacionMemoria();
        return true;
    }

    return false;
}
