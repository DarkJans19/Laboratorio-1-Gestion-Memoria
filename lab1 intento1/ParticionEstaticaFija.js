function inicializarParticionesFijas() {
    inicializarMemoriaConSO(); // Inicializar memoria con el SO en la posición 0

    for (let i = 1; i <= 15; i++) {
        memoria[i] = {
            tipo: 'particion',
            nombre: `Partición ${i}`,
            tamano: 1024,
            ocupado: false,
            proceso: null,
            fragmentacionInterna: 0
        };
    }
    asignarProgramasPredeterminados();
}

function asignarProcesoEstaticaFija(proceso, algoritmo) {
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

    if (particionesLibres.length === 0) {
        alert("No hay particiones libres disponibles");
        return false;
    }

    // Para particiones fijas, siempre usar la primera disponible (equivalente a primer ajuste)
    const particionSeleccionada = particionesLibres[0];

    // Asignar el proceso
    particionSeleccionada.ocupado = true;
    particionSeleccionada.proceso = proceso;
    particionSeleccionada.fragmentacionInterna = TAMANO_PARTICION_KiB - proceso.tamano;

    procesos.push(proceso.nombre);
    refrescarVista();
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
        refrescarVista();
        return true;
    }

    return false;
}
