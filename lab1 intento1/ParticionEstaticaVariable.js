function particionarEspaciosVariables() {
    const tamaño_inicial = 2 * 1024;  // Tamaño inicial de la primera partición 
    const razon = 1 / 2;              // Reducción para cada nivel
    const niveles = 3;                // Cantidad de niveles de particiones
    const particionesPorNivel = 4;    // Número de particiones por nivel

    let tamaños = [];

    // Genera los tamaños de partición
    for (let i = 0; i < niveles; i++) {
        const tamaño = tamaño_inicial * (razon ** i);
        for (let j = 0; j < particionesPorNivel; j++) {
            tamaños.push(tamaño);
        }
    }

    // Agrega un último nivel de tamaño igual al menor anterior
    const ultimoTamano = tamaño_inicial * (razon ** (niveles - 1));
    for (let j = 0; j < particionesPorNivel; j++) {
        tamaños.push(ultimoTamano);
    }

    return tamaños.reverse();
}

function inicializarParticionesFijasVariables() {
    memoria = []; // Reinicia la memoria

    // Genera las particiones variables
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

    // Crea el proceso del Sistema Operativo
    const procesoSO = { nombre: 'SO', tamano: 1024 };

    // Busca una partición adecuada para el SO (Primer ajuste)
    const particionSO = aplicarAlgoritmoSeleccion(memoria, procesoSO.tamano, 'Primer ajuste');

    if (particionSO) {
        particionSO.ocupado = true;
        particionSO.proceso = procesoSO;
        particionSO.fragmentacionInterna = particionSO.tamano - procesoSO.tamano;
 
        // Mueve la partición del SO al inicio de la lista
        const indiceSO = memoria.indexOf(particionSO);
        if (indiceSO !== 0) {
            const soData = memoria.splice(indiceSO, 1)[0];
            memoria.unshift(soData);
        }
    } 
    // Si no hay espacio para el SO
    else {
        alert("No hay partición para el Sistema Operativo.");
    }
    asignarProgramasPredeterminados();
}

function asignarProcesoEstaticaFijaVariable(proceso, algoritmo) {
    const LIMITE_TAMANO_PARTICION_KiB = 2048;

    // Validar tamaño máximo
    if (proceso.tamano > LIMITE_TAMANO_PARTICION_KiB) {
        alert(`El tamaño del proceso no puede exceder ${LIMITE_TAMANO_PARTICION_KiB} KiB.`);
        return false;
    }

    // Validar tamaño mínimo
    if (proceso.tamano <= 0) {
        alert(`El tamaño debe ser mayor a 0 KiB.`);
        return false;
    }

    // Aplica el algoritmo de selección (Primer, Mejor o Peor ajuste)
    const particionSeleccionada = aplicarAlgoritmoSeleccion(memoria, proceso.tamano, algoritmo);

    // Si no se encontró partición disponible
    if (!particionSeleccionada) {
        alert("No hay particiones libres disponibles.");
        return false;
    }

    // Asigna el proceso a la partición elegida
    particionSeleccionada.ocupado = true;
    particionSeleccionada.proceso = proceso;
    particionSeleccionada.fragmentacionInterna = particionSeleccionada.tamano - proceso.tamano;

    // Actualiza la interfaz
    actualizarVisualizacionMemoria();
    mostrarInformacionMemoria();

    return true;
}

function eliminarProcesoEstaticaVariable(nombreProceso) {
    let procesoEliminado = false;
    // Busca el proceso y libera la partición
    memoria.forEach(bloque => {
        if (bloque.ocupado && bloque.proceso && bloque.proceso.nombre === nombreProceso) {
            bloque.ocupado = false;
            bloque.proceso = null;
            bloque.fragmentacionInterna = 0;
            procesoEliminado = true;

            // Elimina el proceso de la lista
            procesos = procesos.filter(p => !p.startsWith(`${nombreProceso} (`));
        }
    });
    
    // Si se eliminó, actualiza la vista
    if (procesoEliminado) {
        actualizarVisualizacionMemoria();
        actualizarListaProcesos();
        return true;
    }
    
    return false; // No se encontró el proceso
}
