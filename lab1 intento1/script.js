// Actualizar toda la interfaz para que se vea lo último
function refrescarVista(){
    actualizarVisualizacionMemoria();
    mostrarInformacionMemoria();
    actualizarListaProcesos();
}

// Aquí ponemos el Sistema Operativo, siempre ocupa 1024 KiB
function inicializarMemoriaConSO() {
    memoria = [{
        tipo: 'SO',
        nombre: 'Sistema Operativo',
        tamano: 1024,
        ocupado: true,
        proceso: { nombre: 'SO', tamano: 1024 }
    }];
}

// Carga automáticamente los primeros 5 programas predefinidos
function asignarProgramasPredeterminados() {
    let programasAsignados = 0;
    
    PROGRAMAS_PREDEFINIDOS.forEach(programa => {
        if (programasAsignados < 5) {
            const proceso = { nombre: programa.nombre, tamano: programa.tamano };

            // Buscamos particiones que estén libres
            const particionesLibres = memoria.filter(bloque => 
                bloque.tipo === 'particion' && !bloque.ocupado
            );
            
            // Si hay espacio disponible y el programa cabe, lo metemos
            if (particionesLibres.length > 0 && proceso.tamano <= TAMANO_PARTICION_KiB) {
                const particion = particionesLibres[0];
                particion.ocupado = true;
                particion.proceso = proceso;
                particion.fragmentacionInterna = TAMANO_PARTICION_KiB - proceso.tamano;
                
                procesos.push(`${programa.nombre} (${programa.tamano} KiB)`);
                programasAsignados++;
            }
        }
    });
    
    actualizarVisualizacionMemoria();
    actualizarListaProcesos();
}

// Aquí dibujamos visualmente cómo está la memoria en la pantalla
function actualizarVisualizacionMemoria() {
    const memoriaBox = document.querySelector('.memoria-box');
    const etiquetasMemoria = document.querySelector('.etiquetas-memoria');

    // Limpiamos lo anterior
    memoriaBox.innerHTML = '';
    etiquetasMemoria.innerHTML = '';
    
    // Recorremos cada bloque de memoria para dibujarlo
    memoria.forEach((bloque, index) => {
        const div = document.createElement('div');
        // Le ponemos color según si es SO, proceso o está libre
        div.className = `bloque ${bloque.tipo === 'SO' ? 'so' : bloque.ocupado ? 'proceso' : 'libre'}`;
        
        let contenido = '';
        if (bloque.tipo === 'SO') {
            contenido = 'SO';
        } else if (bloque.ocupado && bloque.proceso) {
            // Si hay un proceso, mostramos su nombre y tamaño
            contenido = `${bloque.proceso.nombre}\n${bloque.proceso.tamano} KiB`;
        } else {
            contenido = 'Libre';
        }
        
        div.textContent = contenido;
        memoriaBox.appendChild(div);

        // Creamos la etiqueta que va al lado mostrando el tamaño
        const etiqueta = document.createElement('div');
        etiqueta.className = 'etiqueta-bloque';
        
        let textoEtiqueta = '';
        
        textoEtiqueta = `${bloque.tamano} KiB`;
        
        etiqueta.textContent = textoEtiqueta;
        etiquetasMemoria.appendChild(etiqueta);
    });
}

// Actualizar la lista de procesos que se muestra arriba
function actualizarListaProcesos() {
    listaProcesos.textContent = `Procesos: ${procesos.length > 0 ? procesos.join(", ") : "—"}`;
}

// Muestra toda la info importante
function mostrarInformacionMemoria() {
    const infoEleccion = document.querySelector('.info-eleccion');
    
    const particionesLibres = memoria.filter(b => b.tipo === 'particion' && !b.ocupado).length;
    const memoriaUsada = memoria.reduce((total, bloque) => 
        bloque.ocupado ? total + (bloque.proceso?.tamano || 0) : total, 0
    );
    
    const fragmentacionInterna = memoria.reduce((total, bloque) => 
        total + (bloque.fragmentacionInterna || 0), 0
    );

    const html = `
        <ul>
            <li id="tipo-particion">Partición: ${particionElegida || '—'}</li>
            <li id="tipo-algoritmo">Algoritmo: ${algoritmoElegido || '—'}</li>
            <li>Particiones libres: ${particionesLibres}</li>
            <li>Memoria usada: ${memoriaUsada} KiB</li>
            <li>Fragmentación interna: ${fragmentacionInterna} KiB</li>
        </ul>
    `;
    
    infoEleccion.innerHTML = html;
}

// Intentar meter un proceso en memoria según el tipo de partición que elegimos
function asignarProceso(proceso) {
    if (!particionElegida || !algoritmoElegido) {
        alert("Primero selecciona tipo de partición y algoritmo");
        return false;
    }
    
    let resultado = false;
    
    // Dependiendo del tipo de partición, llamamos a la función correspondiente
    switch(particionElegida) {
        case 'Estática de tamaño fijo':
            resultado = asignarProcesoEstaticaFija(proceso, algoritmoElegido);
            break;
            
        case 'Estática de tamaño variable':
            resultado = asignarProcesoEstaticaFijaVariable(proceso, algoritmoElegido);
            break;
        case 'Dinámica (sin compactación)':
            resultado = asignarProcesoDinamicaSinCompactacion(proceso, algoritmoElegido);
            break;
        case 'Dinámica (con compactación)':
            resultado = asignarProcesoDinamicaConCompactacion(proceso, algoritmoElegido);
            break;
        default:
        alert("Error");
        return false;
    }
    
    return resultado;
}

// Función para sacar un proceso de la memoria
function eliminarProceso(nombreProceso) {
    if (!particionElegida) {
        alert("Primero selecciona tipo de partición");
        return false;
    }
    
    // Cada tipo de partición elimina de forma diferente
    switch(particionElegida) {
        case 'Estática de tamaño fijo':
            return eliminarProcesoEstaticaFija(nombreProceso);
        case 'Estática de tamaño variable':
            return  eliminarProcesoEstaticaVariable(nombreProceso);
        case 'Dinámica (sin compactación)':
            return eliminarProcesoDinamicaSinCompactacion(nombreProceso);
        case 'Dinámica (con compactación)':
            return eliminarProcesoDinamicaConCompactacion(nombreProceso);
        default:
            alert("Error");
            return false;
    }
}

// Esta función aplica el algoritmo de selección (Primer, Mejor o Peor ajuste)
function aplicarAlgoritmoSeleccion(memoria, tamanoProceso, algoritmo) {
    const particionesLibres = memoria.filter(bloque =>
        bloque.tipo === 'particion' &&
        !bloque.ocupado &&
        bloque.tamano >= tamanoProceso
    );

    if (particionesLibres.length === 0) return null;

    // Según el algoritmo elegido, buscamos la partición de diferente manera
    switch (algoritmo) {
        case 'Primer ajuste':
            return primerAjusteFijo(particionesLibres, tamanoProceso);
        case 'Mejor ajuste':
            return mejorAjusteFijo(particionesLibres)
        case 'Peor ajuste':
            return peorAjusteFijo(particionesLibres, tamanoProceso)
        default:
            alert("Error", algoritmo);
            return null;
    }
}

// Botón para seleccionar el tipo de partición
document.getElementById("btn-particion").addEventListener("click", () => {
    if (!particionElegida) menuParticion.style.display = "flex";
    else alert("Reinicia para volver a escoger partición");
});

// Botón para seleccionar el algoritmo
document.getElementById("btn-algoritmo").addEventListener("click", () => {
    if (!particionElegida) return alert("Primero selecciona el tipo de partición");
    if (!algoritmoElegido) menuAlgoritmo.style.display = "flex";
    else alert("Reinicia para volver a escoger algoritmo");
});

// Botón para añadir un nuevo proceso
document.getElementById("btn-anadir-proceso").addEventListener("click", () => {
    if (!particionElegida || !algoritmoElegido)
        return alert("Primero selecciona partición y algoritmo");
    menuAnadirP.style.display = "flex";
});

// Botón para eliminar un proceso existente
document.getElementById("btn-eliminar-proceso").addEventListener("click", () => {
    if (!particionElegida) return alert("Primero selecciona tipo de partición");

    const select = document.getElementById("proceso-eliminar");
    select.innerHTML = '';

    // Buscamos todos los procesos que están corriendo (excepto SO)
    const procesosActivos = memoria.filter(b =>
        b.ocupado && b.proceso && b.proceso.nombre !== 'SO'
    ).map(b => b.proceso);

    // Eliminamos duplicados usando un Set
    const nombres = new Set();
    const unicos = procesosActivos.filter(p => !nombres.has(p.nombre) && nombres.add(p.nombre));

    if (unicos.length === 0) {
        select.innerHTML = '<option value="">No hay procesos para eliminar</option>';
    } else {
        // Agregamos cada proceso
        unicos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.nombre;
        option.textContent = `${p.nombre} (${p.tamano} KiB)`;
        select.appendChild(option);
        });
    }

    menuEliminarP.style.display = "flex";
});

// Botones de cerrar para todos los menús
document.querySelectorAll('[id^="cerrar-"]').forEach(btn => {
    btn.addEventListener("click", () => {
        btn.closest(".ventana-oculta").style.display = "none";
    });
});

document.querySelectorAll("#menu-particion ul button").forEach(btn => {
btn.addEventListener("click", (e) => {
    e.preventDefault();

    // Mapeamos el ID del botón al nombre completo de la partición
    const map = {
        'btn-particion-fija': 'Estática de tamaño fijo',
        'btn-particion-variable': 'Estática de tamaño variable',
        'btn-particion-dinamica-sin': 'Dinámica (sin compactación)',
        'btn-particion-dinamica-con': 'Dinámica (con compactación)'
    };

    const opcion = map[btn.id] || btn.textContent.trim();
    particionElegida = opcion;
    tipoParticion.textContent = `Partición: ${particionElegida}`;

    // Para partición fija, solo hay un algoritmo (Primer ajuste)
    if (btn.id === 'btn-particion-fija') {
        algoritmoElegido = 'Primer ajuste';
        tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
        if (typeof inicializarParticionesFijas === 'function') {
            inicializarParticionesFijas();
        }
    } 
    // Para dinámica sin compactación
    else if (btn.id === 'btn-particion-dinamica-sin') {
        if (typeof inicializarDinamicaSinCompactacion === 'function') {
        inicializarDinamicaSinCompactacion();
        }
    } 
    // Para partición variable
    else if (btn.id === 'btn-particion-variable') {
        inicializarParticionesFijasVariables();
    } 
    
    // Para dinámica con compactación
    else if (btn.id === 'btn-particion-dinamica-con') {
        if (typeof inicializarDinamicaConCompactacion === 'function') {
            inicializarDinamicaConCompactacion();
        }
    }

    else {
        alert("Opción no reconocida.");
        return;
    }

    refrescarVista();
    menuParticion.style.display = "none";
    });
});

// Cuando se selecciona un algoritmo en el menú
document.querySelectorAll("#menu-algoritmo ul button").forEach(btn => {
    btn.addEventListener("click", () => {
        const algoritmoSeleccionado = btn.textContent;

        algoritmoElegido = algoritmoSeleccionado;
        tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
        menuAlgoritmo.style.display = "none";
        refrescarVista();

        if (particionElegida === 'Dinámica (sin compactación)') {
            precargarProgramasDinamicos();
        }

        if (particionElegida === 'Dinámica (con compactación)') {
            precargarProgramasDinamicos();
        }
    });
});

document.getElementById("btn-agregar-proceso").addEventListener("click", e => {
    e.preventDefault();
    const nombre = document.getElementById("nombre-proceso").value.trim();
    const tamano = parseInt(document.getElementById("tamano-proceso").value);

    // Validaciones 
    if (!nombre) return alert("El nombre del proceso no puede estar vacío");
    if (isNaN(tamano) || tamano <= 0) return alert("El tamaño debe ser mayor que 0");

    const proceso = { nombre, tamano };
    if (asignarProceso(proceso)) {
        alert(`Proceso "${nombre}" añadido exitosamente`);
    } else {
        alert(`No se pudo añadir el proceso "${nombre}"`);
    }

    // Limpiar los campos del formulario
    document.getElementById("nombre-proceso").value = "";
    document.getElementById("tamano-proceso").value = "";
    menuAnadirP.style.display = "none";
});

// Eliminar proceso en el formulario
document.getElementById("btn-eliminar-proceso-form").addEventListener("click", e => {
    e.preventDefault();
    const nombreProceso = document.getElementById("proceso-eliminar").value;
    if (!nombreProceso) return alert("No hay procesos para eliminar");

    if (eliminarProceso(nombreProceso)) {
        alert(`Proceso ${nombreProceso} eliminado`);
        refrescarVista();
    } else {
        alert(`No se encontró el proceso ${nombreProceso}`);
    }
    menuEliminarP.style.display = "none";
});

// Reiniciar toda la simulación
reiniciar.addEventListener("click", () => {
    particionElegida = null;
    algoritmoElegido = null;
    procesos = [];
    memoria = [];

    tipoParticion.textContent = "Partición: —";
    tipoAlgoritmo.textContent = "Algoritmo: —";
    listaProcesos.textContent = "Procesos: —";

    // Limpiar la visualización de memoria
    document.querySelector('.memoria-box').innerHTML = '';
    document.querySelector('.etiquetas-memoria').innerHTML = '';
    mostrarInformacionMemoria();
});
document.addEventListener('DOMContentLoaded', mostrarInformacionMemoria);