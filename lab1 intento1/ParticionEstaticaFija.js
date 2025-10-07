function inicializarParticionesFijas() {
    inicializarMemoriaConSO(); // Inicializa la memoria con el SO al inicio 

    for (let i = 1; i <= 15; i++) {
        memoria[i] = { // Crea 15 particiones fijas de 1024 KiB cada una
            tipo: 'particion',
            nombre: `Partición ${i}`,
            tamano: 1024,
            ocupado: false,
            proceso: null,
            fragmentacionInterna: 0
        };
    }
    asignarProgramasPredeterminados(); // Precarga los programas iniciales
}

function asignarProcesoEstaticaFija(proceso, algoritmo) {
    // Validar tamaño del proceso
    if (proceso.tamano <= 0) {
        alert(`El tamaño debe ser mayor a 0 KiB`);
        return false;
    }

    // Si el proceso no cabe en la partición
    if (proceso.tamano > TAMANO_PARTICION_KiB) {
        alert(`El proceso ${proceso.nombre} requiere ${proceso.tamano} KiB pero las particiones son de ${TAMANO_PARTICION_KiB} KiB`);
        return false;
    }

    // Busca particiones libres disponibles
    const particionesLibres = memoria.filter(bloque => 
        bloque.tipo === 'particion' && !bloque.ocupado
    );

    // Si no hay ninguna libre
    if (particionesLibres.length === 0) {
        alert("No hay particiones libres");
        return false;
    }

    // En particiones fijas se usa siempre la primera libre (Primer Ajuste)
    const particionSeleccionada = particionesLibres[0];

    // Asigna el proceso a la partición seleccionada
    particionSeleccionada.ocupado = true;
    particionSeleccionada.proceso = proceso;
    particionSeleccionada.fragmentacionInterna = TAMANO_PARTICION_KiB - proceso.tamano;
    procesos.push(proceso.nombre);
    refrescarVista(); 
    return true;
}

function eliminarProcesoEstaticaFija(nombreProceso) {
    let procesoEliminado = false;

    // Recorre la memoria buscando el proceso a eliminar
    memoria.forEach(bloque => {
        if (bloque.ocupado && bloque.proceso && bloque.proceso.nombre === nombreProceso) {
            bloque.ocupado = false;
            bloque.proceso = null;
            bloque.fragmentacionInterna = 0;
            procesoEliminado = true;
        }
    });

    // Si se eliminó, se actualiza la lista y la vista
    if (procesoEliminado) {
        procesos = procesos.filter(p => p.nombre !== nombreProceso);
        refrescarVista();
        return true;
    }

    return false; // No se encontró el proceso
}
