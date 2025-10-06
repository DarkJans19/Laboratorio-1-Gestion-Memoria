const MEMORIA_TOTAL_MiB = 16;
const MEMORIA_TOTAL_KiB = MEMORIA_TOTAL_MiB * 1024;
const TAMANO_PARTICION_MiB = 1;
const TAMANO_PARTICION_KiB = TAMANO_PARTICION_MiB * 1024;

const PROGRAMAS_PREDEFINIDOS = [
  { nombre: 'Notepad', tamano: 225 },
  { nombre: 'Word', tamano: 287 },
  { nombre: 'Excel', tamano: 309 },
  { nombre: 'AutoCAD', tamano: 436 },
  { nombre: 'Calculadora', tamano: 209 }
];

// VARIABLES GLOBALES
let particionElegida = null;
let algoritmoElegido = null;
let memoria = [];
let procesos = [];

// REFERENCIAS DOM
const tipoParticion = document.getElementById("tipo-particion");
const tipoAlgoritmo = document.getElementById("tipo-algoritmo");
const listaProcesos = document.getElementById("lista-procesos");

const menuParticion = document.getElementById("menu-particion");
const menuAlgoritmo = document.getElementById("menu-algoritmo");
const menuAnadirP = document.getElementById("menu-anadirproceso");
const menuEliminarP = document.getElementById("menu-eliminar-proceso");

const reiniciar = document.getElementById("btn-reiniciar");

// FUNCIONES DE VISUALIZACIÓN
// Función para inicializar el array de memoria con el SO en la posición 0
function inicializarMemoriaConSO() {
    memoria = [{
        tipo: 'SO',
        nombre: 'Sistema Operativo',
        tamano: 1024,
        ocupado: true,
        proceso: { nombre: 'SO', tamano: 1024 }
    }];
}

// Función para inicializar el Sistema Operativo esto quizas se podria quitar
function inicializarSistemaOperativo() {
    memoria.push({
        tipo: 'SO',
        nombre: 'Sistema Operativo',
        tamano: 1024,
        ocupado: true,
        proceso: { nombre: 'SO', tamano: 1024 }
    });
}

// Particiones estáticas fijas
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

function particionarEspaciosVariables() {
    const tamaño_inicial = 2 * 1024; // 2 MiB
    const razon = 1 / 2;
    const niveles = 3; // hasta 0.5 MiB
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

    // Buscar la primera partición válida para el SO
    let indiceParticionSO = memoria.findIndex(bloque => 
        !bloque.ocupado && bloque.tipo === 'particion' && bloque.tamano >= 1024
    );

    if (indiceParticionSO !== -1) {
        // Asignar el SO a la partición encontrada
        const particionSO = memoria[indiceParticionSO];
        particionSO.ocupado = true;
        particionSO.proceso = { nombre: 'SO', tamano: 1024 };
        particionSO.fragmentacionInterna = particionSO.tamano - 1024;

        // Mover la partición del SO a la primera posición
        if (indiceParticionSO !== 0) {
            const particionSOData = memoria.splice(indiceParticionSO, 1)[0];
            memoria.unshift(particionSOData);
        }
    } else {
        alert("No hay partición disponible para alojar el Sistema Operativo.");
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
                
                procesos.push(`${programa.nombre} (${programa.tamano} KiB)`);
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
    
    // VALIDACIONES MEJORADAS
    if (proceso.tamano <= 0) {
        alert(`ERROR: El tamaño debe ser mayor a 0 KiB`);
        return false;
    }
    
    if (proceso.tamano > TAMANO_PARTICION_KiB) {
        alert(`ERROR: El proceso ${proceso.nombre} requiere ${proceso.tamano} KiB pero las particiones son de ${TAMANO_PARTICION_KiB} KiB`);
        return false;
    }

    let particionSeleccionada = null;
    
    for (let i = 0; i < memoria.length; i++) {
        const bloque = memoria[i];
        if (bloque.tipo === 'particion' && !bloque.ocupado) {
            particionSeleccionada = bloque;
            break; 
        }
    }
    
    if (!particionSeleccionada) {
        alert("No hay particiones libres disponibles");
        return false;
    }
    
    particionSeleccionada.ocupado = true;
    particionSeleccionada.proceso = proceso;
    particionSeleccionada.fragmentacionInterna = TAMANO_PARTICION_KiB - proceso.tamano;
    return true;
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

    // 👉 Aquí aplicamos el algoritmo seleccionado
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


function eliminarProcesoEstaticaFija(nombreProceso) {
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

// Funciones de visualización

function actualizarVisualizacionMemoria() {
    const memoriaBox = document.querySelector('.memoria-box');
    const etiquetasMemoria = document.querySelector('.etiquetas-memoria');

    memoriaBox.innerHTML = '';
    etiquetasMemoria.innerHTML = '';

    memoria.forEach(bloque => {
    const div = document.createElement('div');
    div.className = `bloque ${bloque.tipo === 'SO' ? 'so' : bloque.ocupado ? 'proceso' : 'libre'}`;

    const altura = (bloque.tamano / MEMORIA_TOTAL_KiB) * 600; 
    div.style.height = `${altura}px`;

    const contenido = bloque.tipo === 'SO'
        ? 'SO'
        : bloque.ocupado
        ? `${bloque.proceso.nombre}\n${bloque.proceso.tamano} KiB`
        : 'Libre';
    div.textContent = contenido;
    memoriaBox.appendChild(div);

    const etiqueta = document.createElement('div');
    etiqueta.className = 'etiqueta-bloque';
    etiqueta.textContent = `${bloque.inicio} - ${bloque.inicio + bloque.tamano} KiB`;
    etiquetasMemoria.appendChild(etiqueta);
    });
    
    memoriaBox.innerHTML = '';
    etiquetasMemoria.innerHTML = '';
    
    memoria.forEach((bloque, index) => {
        const div = document.createElement('div');
        div.className = `bloque ${bloque.tipo === 'SO' ? 'so' : bloque.ocupado ? 'proceso' : 'libre'}`;
        
        let contenido = '';
        if (bloque.tipo === 'SO') {
            contenido = 'SO';
        } else if (bloque.ocupado && bloque.proceso) {
            contenido = `${bloque.proceso.nombre}\n${bloque.proceso.tamano} KiB`;
        } else {
            contenido = 'Libre';
        }
        
        div.textContent = contenido;
        memoriaBox.appendChild(div);
        
        // Crear etiqueta al lado izquierdo - SIEMPRE MOSTRAR TAMAÑO FIJO
        const etiqueta = document.createElement('div');
        etiqueta.className = 'etiqueta-bloque';
        
        let textoEtiqueta = '';
        
        textoEtiqueta = `${bloque.tamano} KiB`;
        
        
        etiqueta.textContent = textoEtiqueta;
        etiquetasMemoria.appendChild(etiqueta);
    });
}

function actualizarListaProcesos() {
    listaProcesos.textContent = `Procesos: ${procesos.length > 0 ? procesos.join(", ") : "—"}`;
}

function mostrarInformacionMemoria() {
    const infoEleccion = document.querySelector('.info-eleccion');
    const html = `
        <ul>
        <li id="tipo-particion">Partición: ${particionElegida || '—'}</li>
        <li id="tipo-algoritmo">Algoritmo: ${algoritmoElegido || '—'}</li>
        <li id="lista-procesos">Procesos: ${procesos.length > 0 ? procesos.join(", ") : "—"}</li>
        </ul>
    `;
    infoEleccion.innerHTML = html;
}

function refrescarVista() {
  actualizarVisualizacionMemoria();
  actualizarListaProcesos();
  mostrarInformacionMemoria();
}

// FUNCIONES DE ASIGNACIÓN
function asignarProceso(proceso) {
    if (!particionElegida || !algoritmoElegido) {
        alert("Primero selecciona tipo de partición y algoritmo");
        return false;
    }
    
    let resultado = false;
    
    switch(particionElegida) {
        case 'Estática de tamaño fijo':
            resultado = asignarProcesoEstaticaFija(proceso, algoritmoElegido);
            break;
            
        case 'Estática de tamaño variable':
            resultado = asignarProcesoEstaticaFijaVariable(proceso, algoritmoElegido);
            break;
        case 'Dinámica (sin compactación)':
            // revisar
            return asignarProcesoDinamicaSinCompactacion(proceso, algoritmoElegido);
        default:
        alert("Funcionalidad en desarrollo");
        return false;
    }
    
    return resultado;
}

function eliminarProceso(nombreProceso) {
    if (!particionElegida) {
        alert("Primero selecciona tipo de partición");
        return false;
    }
    
    let resultado = false;
    
    switch(particionElegida) {
        case 'Estática de tamaño fijo':
            resultado = eliminarProcesoEstaticaFija(nombreProceso);
            break;
            
        case 'Estática de tamaño variable':
            alert("Funcionalidad para particiones variables en desarrollo");
            return false;
        case 'Dinámica (sin compactación)':
            return eliminarProcesoDinamicaSinCompactacion(nombreProceso);
        default:
            alert("Funcionalidad para este tipo de partición en desarrollo");
            return false;
    }
    
    return resultado;
}

// Algoritmos

function aplicarAlgoritmoSeleccion(memoria, tamanoProceso, algoritmo) {
    const particionesLibres = memoria.filter(bloque =>
        bloque.tipo === 'particion' &&
        !bloque.ocupado &&
        bloque.tamano >= tamanoProceso
    );

    if (particionesLibres.length === 0) return null;

    switch (algoritmo) {
        case 'Primer ajuste':
            for (const bloque of memoria) {
                if (
                    bloque.tipo === 'particion' &&
                    !bloque.ocupado &&
                    bloque.tamano >= tamanoProceso
                ) {
                    return bloque;
                }
            }
            return null;

        case 'Mejor ajuste':
            return particionesLibres.reduce((mejor, actual) => {
                const sobranteMejor = mejor.tamano - tamanoProceso;
                const sobranteActual = actual.tamano - tamanoProceso;
                return sobranteActual < sobranteMejor ? actual : mejor;
            });

        case 'Peor ajuste':
            return particionesLibres.reduce((peor, actual) => {
                const sobrantePeor = peor.tamano - tamanoProceso;
                const sobranteActual = actual.tamano - tamanoProceso;
                return sobranteActual > sobrantePeor ? actual : peor;
            });

        default:
            console.warn("Algoritmo desconocido:", algoritmo);
            return null;
    }
}



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

// Event listeners

document.getElementById("btn-particion").addEventListener("click", () => {
    if (!particionElegida) menuParticion.style.display = "flex";
    else alert("Reinicia para volver a escoger partición");
});

document.getElementById("btn-algoritmo").addEventListener("click", () => {
    if (!particionElegida) return alert("Primero selecciona el tipo de partición");
    if (!algoritmoElegido) menuAlgoritmo.style.display = "flex";
    else alert("Reinicia para volver a escoger algoritmo");
});

document.getElementById("btn-anadir-proceso").addEventListener("click", () => {
    if (!particionElegida || !algoritmoElegido)
        return alert("Primero selecciona partición y algoritmo");
    menuAnadirP.style.display = "flex";
});

document.getElementById("btn-eliminar-proceso").addEventListener("click", () => {
    if (!particionElegida) return alert("Primero selecciona tipo de partición");

    const select = document.getElementById("proceso-eliminar");
    select.innerHTML = '';

    const procesosActivos = memoria.filter(b =>
        b.ocupado && b.proceso && b.proceso.nombre !== 'SO'
    ).map(b => b.proceso);

    const nombres = new Set();
    const unicos = procesosActivos.filter(p => !nombres.has(p.nombre) && nombres.add(p.nombre));

    if (unicos.length === 0) {
        select.innerHTML = '<option value="">No hay procesos para eliminar</option>';
    } else {
        unicos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.nombre;
        option.textContent = `${p.nombre} (${p.tamano} KiB)`;
        select.appendChild(option);
        });
    }

    menuEliminarP.style.display = "flex";
});

// EVENTOS SECUNDARIOS
document.querySelectorAll('[id^="cerrar-"]').forEach(btn => {
    btn.addEventListener("click", () => {
        btn.closest(".ventana-oculta").style.display = "none";
    });
});

// Seleccionar partición
document.querySelectorAll("#menu-particion ul button").forEach(btn => {
btn.addEventListener("click", (e) => {
    e.preventDefault();

    const map = {
        'btn-particion-fija': 'Estática de tamaño fijo',
        'btn-particion-variable': 'Estática de tamaño variable',
        'btn-particion-dinamica-sin': 'Dinámica (sin compactación)',
        'btn-particion-dinamica-con': 'Dinámica (con compactación)'
    };

    const opcion = map[btn.id] || btn.textContent.trim();
    particionElegida = opcion;
    tipoParticion.textContent = `Partición: ${particionElegida}`;

    if (btn.id === 'btn-particion-fija') {
        algoritmoElegido = 'Primer ajuste';
        tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
        if (typeof inicializarParticionesFijas === 'function') {
            inicializarParticionesFijas();
        } else {
            console.error('inicializarParticionesFijas no está definida');
        }
    } else if (btn.id === 'btn-particion-dinamica-sin') {
        if (typeof inicializarDinamicaSinCompactacion === 'function') {
        inicializarDinamicaSinCompactacion();
        } else {
        console.error('inicializarDinamicaSinCompactacion no está definida');
        }
    } else if (btn.id === 'btn-particion-variable') {
        inicializarParticionesFijasVariables();
    } else if (btn.id === 'btn-particion-dinamica-con') {
        algoritmoElegido = null;
        tipoAlgoritmo.textContent = `Algoritmo: —`;
        alert("Dinámica con compactación en desarrollo");
    } else {
        alert("Opción no reconocida.");
        return;
    }

    refrescarVista();
    menuParticion.style.display = "none";
    });
});

document.querySelectorAll("#menu-algoritmo ul button").forEach(btn => {
    btn.addEventListener("click", () => {
        const algoritmoSeleccionado = btn.textContent;

        // Validación para partición estática de tamaño fijo
        if (particionElegida === 'Estática de tamaño fijo' && algoritmoSeleccionado !== 'Primer ajuste') {
            alert(`ERROR: En partición estática fija solo se puede usar "Primer ajuste".`);
            return; // Cancelar el resto si no es válido
        }

        // Guardar algoritmo y actualizar UI
        algoritmoElegido = algoritmoSeleccionado;
        tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
        menuAlgoritmo.style.display = "none";
        refrescarVista();

        // Precargar si es dinámica sin compactación
        if (particionElegida === 'Dinámica (sin compactación)') {
            precargarProgramasDinamicos();
        }
    });
});


// Agregar proceso
document.getElementById("btn-agregar-proceso").addEventListener("click", e => {
    e.preventDefault();
    const nombre = document.getElementById("nombre-proceso").value.trim();
    const tamano = parseInt(document.getElementById("tamano-proceso").value);

    if (!nombre) return alert("El nombre del proceso no puede estar vacío");
    if (isNaN(tamano) || tamano <= 0) return alert("El tamaño debe ser mayor que 0");

    const proceso = { nombre, tamano };
    if (asignarProceso(proceso)) {
        alert(`Proceso "${nombre}" añadido exitosamente`);
    } else {
        alert(`No se pudo añadir el proceso "${nombre}"`);
    }

    document.getElementById("nombre-proceso").value = "";
    document.getElementById("tamano-proceso").value = "";
    menuAnadirP.style.display = "none";
});

// Eliminar proceso
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

// Reiniciar simulación
reiniciar.addEventListener("click", () => {
    particionElegida = null;
    algoritmoElegido = null;
    procesos = [];
    memoria = [];

    tipoParticion.textContent = "Partición: —";
    tipoAlgoritmo.textContent = "Algoritmo: —";
    listaProcesos.textContent = "Procesos: —";

    document.querySelector('.memoria-box').innerHTML = '';
    document.querySelector('.etiquetas-memoria').innerHTML = '';
    mostrarInformacionMemoria();
});

// Inicializar info al cargar
document.addEventListener('DOMContentLoaded', mostrarInformacionMemoria);