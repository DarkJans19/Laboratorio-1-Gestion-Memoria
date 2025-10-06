function particionarEspaciosVariables() {
    const tamaño_inicial = 2 * 1024; // 2 MiB
    const razon = 1 / 2;
    const niveles = 3;
    const particionesPorNivel = 4;

    let tamaños = [];

    for (let i = 0; i < niveles; i++) {
        const tamaño = tamaño_inicial * (razon ** i);
        for (let j = 0; j < particionesPorNivel; j++) {
            tamaños.push(tamaño);
        }
    }

    // Repetimos el último nivel para completar las 16 particiones
    const ultimoTamano = tamaño_inicial * (razon ** (niveles - 1));
    for (let j = 0; j < particionesPorNivel; j++) {
        tamaños.push(ultimoTamano);
    }

    return tamaños.reverse();
}

// Particiones estáticas variables
function inicializarParticionesFijasVariables() {
    memoria = []; // Reiniciar la memoria

    // Generar las particiones variables
    const tamanosParticiones = particionarEspaciosVariables();

    tamanosParticiones.forEach((tamano, i) => {
        memoria[i] = {
            tipo: 'particion',
            nombre: `Partición ${i + 1}`,
            tamano: tamano,
            ocupado: false,
            proceso: null,
            fragmentacionInterna: 0
        };
    });

    const procesoSO = { nombre: 'SO', tamano: 1024 };

    const particionSO = aplicarAlgoritmoSeleccion(memoria, procesoSO.tamano, 'Primer ajuste');

    if (particionSO) {
        particionSO.ocupado = true;
        particionSO.proceso = procesoSO;
        particionSO.fragmentacionInterna = particionSO.tamano - procesoSO.tamano;

        // Mover el SO a la primera posición (solo para mantener orden visual)
        const indiceSO = memoria.indexOf(particionSO);
        if (indiceSO !== 0) {
            const soData = memoria.splice(indiceSO, 1)[0];
            memoria.unshift(soData);
        }
    } else {
        alert("No hay partición disponible para alojar el Sistema Operativo.");
    }

    asignarProgramasPredeterminados();
}

function asignarProcesoEstaticaFijaVariable(proceso, algoritmo) {
    const LIMITE_TAMANO_PARTICION_KiB = 2048;

    if (proceso.tamano > LIMITE_TAMANO_PARTICION_KiB) {
        alert(`ERROR: El tamaño del proceso no puede exceder ${LIMITE_TAMANO_PARTICION_KiB} KiB.`);
        return false;
    }

    if (proceso.tamano <= 0) {
        alert(`ERROR: El tamaño debe ser mayor a 0 KiB.`);
        return false;
    }

    // Aquí aplicamos el algoritmo seleccionado
    const particionSeleccionada = aplicarAlgoritmoSeleccion(memoria, proceso.tamano, algoritmo);

    if (!particionSeleccionada) {
        alert("No hay particiones libres disponibles que cumplan con los requisitos.");
        return false;
    }

    // --- Asignación real ---
    particionSeleccionada.ocupado = true;
    particionSeleccionada.proceso = proceso;
    particionSeleccionada.fragmentacionInterna = particionSeleccionada.tamano - proceso.tamano;

    actualizarVisualizacionMemoria();
    mostrarInformacionMemoria();

    return true;
}

function eliminarProcesoEstaticaVariable(nombreProceso) {
    let procesoEliminado = false;
    
    memoria.forEach(bloque => {
        if (bloque.ocupado && bloque.proceso && bloque.proceso.nombre === nombreProceso) {
            bloque.ocupado = false;
            bloque.proceso = null;
            bloque.fragmentacionInterna = 0;
            procesoEliminado = true;

            procesos = procesos.filter(p => !p.startsWith(`${nombreProceso} (`));
        }
    });
    
    if (procesoEliminado) {
        actualizarVisualizacionMemoria();
        actualizarListaProcesos();
        return true;
    }
    
    return false;
}