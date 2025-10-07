function inicializarDinamicaConCompactacion() {
    const tamSO = 1024; // Tamaño reservado para el sistema operativo (1 MiB)

    memoria = [
        { tipo: 'SO', inicio: 0, tamano: tamSO, ocupado: true, proceso: { nombre: 'SO', tamano: tamSO } },
        { tipo: 'libre', inicio: tamSO, tamano: MEMORIA_TOTAL_KiB - tamSO, ocupado: false, proceso: null }
    ];
    
    procesos = []; // Lista de procesos actualmente cargados
    refrescarVista(); // Actualiza la representación gráfica de la memoria
}

// Cargar los programas predefinidos usando el algoritmo elegido
function precargarProgramasDinamicos() {
    let exitosos = 0;
    let fallidos = 0;

    PROGRAMAS_PREDEFINIDOS.forEach(p => {
        const resultado = asignarProcesoDinamicaConCompactacion(
            { nombre: p.nombre, tamano: p.tamano },
            algoritmoElegido
        );
        
        if (resultado) exitosos++;
        else fallidos++;
    });
}

// Asigna un proceso a la memoria dinámica usando un algoritmo específico
function asignarProcesoDinamicaConCompactacion(proceso, algoritmo) {
    if (!algoritmo) { alert("Selecciona un algoritmo antes de asignar procesos"); return false; }
    if (!proceso.tamano || proceso.tamano <= 0) { alert("El tamaño del proceso debe ser mayor a 0"); return false; }

    let indice = -1;

    // Según el algoritmo elegido, se busca el hueco donde colocar el proceso
    if (algoritmo === 'Primer ajuste') indice = primerAjusteDinamico(proceso.tamano);
    else if (algoritmo === 'Mejor ajuste') indice = mejorAjusteDinamico(proceso.tamano);
    else if (algoritmo === 'Peor ajuste') indice = peorAjusteDinamico(proceso.tamano);

    // Si no se encuentra espacio, se intenta compactar la memoria
    if (indice === -1) {
        compactarMemoria();

        // Se vuelve a intentar asignar después de compactar
        if (algoritmo === 'Primer ajuste') indice = primerAjusteDinamico(proceso.tamano);
        else if (algoritmo === 'Mejor ajuste') indice = mejorAjusteDinamico(proceso.tamano);
        else if (algoritmo === 'Peor ajuste') indice = peorAjusteDinamico(proceso.tamano);

        if (indice === -1) {
            alert(`No hay espacio disponible para ${proceso.nombre}`);
            return false;
        }
    }

    // Se actualiza el bloque de memoria encontrado
    const bloque = memoria[indice];
    const espacioRestante = bloque.tamano - proceso.tamano;

    if (espacioRestante === 0) {
        // El proceso ocupa toda la partición
        bloque.tipo = 'proceso';
        bloque.ocupado = true;
        bloque.proceso = { nombre: proceso.nombre, tamano: proceso.tamano };
    } else {
        // Se divide el bloque en una parte ocupada y la otra libre
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

    refrescarVista();
    return true;
}

// Elimina un proceso y compacta la memoria
function eliminarProcesoDinamicaConCompactacion(nombreProceso) {
    let eliminado = false;

    // Busca el proceso en memoria
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

    // Una vez eliminado se compacta la memoria 
    compactarMemoria();
    return true;
}

// Mueve todos los procesos hacia el inicio de la memoria
function compactarMemoria() {
    let nuevaMemoria = [];
    let inicioActual = 0;

    // Primero se copian los bloques ocupados al principio
    memoria.forEach(bloque => {
        if (bloque.ocupado) {
            nuevaMemoria.push({
                tipo: bloque.tipo,
                inicio: inicioActual,
                tamano: bloque.tamano,
                ocupado: true,
                proceso: bloque.proceso
            });
            inicioActual += bloque.tamano;
        }
    });

    // Se calcula el espacio libre restante
    const espacioLibre = MEMORIA_TOTAL_KiB - inicioActual;
    if (espacioLibre > 0) {
        nuevaMemoria.push({
            tipo: 'libre',
            inicio: inicioActual,
            tamano: espacioLibre,
            ocupado: false,
            proceso: null
        });
    }

    // Se reemplaza la memoria anterior con la compactada
    memoria = nuevaMemoria;
    refrescarVista();
}

// Recalcula los valores de inicio de cada bloque en memoria
function recalcularInicios() {
    let inicioActual = 0;
    memoria.forEach(b => {
        b.inicio = inicioActual;
        inicioActual += b.tamano;
    });
}
