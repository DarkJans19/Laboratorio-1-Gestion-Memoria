const b1 = document.getElementById("b1");
const b2 = document.getElementById("b2");
const b3 = document.getElementById("b3");
const b4 = document.getElementById("b4");

const tipoParticion = document.getElementById("tipo-particion");
const tipoAlgoritmo = document.getElementById("tipo-algoritmo");
const listaProcesos = document.getElementById("lista-procesos");

let particionElegida = null;
let algoritmoElegido = null;
let memoria = [];
let procesos = [];

const menuParticion = document.getElementById("menu-particion");
const menuAlgoritmo = document.getElementById("menu-algoritmo");
const menuAnadirP = document.getElementById("menu-anadirproceso");
const menuEliminarP = document.getElementById("menu-eliminar-proceso");

const cerrarParticion = document.getElementById("cerrar-particion");
const cerrarAlgoritmo = document.getElementById("cerrar-algoritmo");
const cerrarAnadir = document.getElementById("cerrar-anadir");
const cerrarEliminar = document.getElementById("cerrar-eliminar");

const reiniciar = document.getElementById("reiniciar");

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
        /*
        if (bloque.tipo === 'SO') {
            textoEtiqueta = 'SO\n1024 KiB';
        } 
            */
        
        textoEtiqueta = `${bloque.tamano} KiB`;
        
        
        etiqueta.textContent = textoEtiqueta;
        etiquetasMemoria.appendChild(etiqueta);
    });
}

function actualizarListaProcesos() {
    listaProcesos.textContent = `Procesos: ${procesos.length > 0 ? procesos.join(", ") : "—"}`;
}

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
            // alert("Funcionalidad para particiones variables en desarrollo");
            // return false;
            break;
        case 'Dinámica (sin compactación)':
        case 'Dinámica (con compactación)':
            alert("Funcionalidad para particiones dinámicas en desarrollo");
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
            
        default:
            alert("Funcionalidad para este tipo de partición en desarrollo");
            return false;
    }
    
    return resultado;
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

b1.addEventListener("click", () => {
    if (!particionElegida) menuParticion.style.display = "flex";
    else alert("Reinicia para volver a escoger partición");
});

b2.addEventListener("click", () => {
    if (!particionElegida) {
        alert("Primero selecciona el tipo de partición");
        return;
    }
    if (!algoritmoElegido) menuAlgoritmo.style.display = "flex";
    else alert("Reinicia para volver a escoger algoritmo");
});

b3.addEventListener("click", () => {
    if (!particionElegida || !algoritmoElegido) {
        alert("Primero selecciona partición y algoritmo");
        return;
    }
    menuAnadirP.style.display = "flex";
});

b4.addEventListener("click", () => {
    if (!particionElegida) {
        alert("Primero selecciona tipo de partición");
        return;
    }

    const select = document.getElementById("proceso-eliminar");
    select.innerHTML = ''; // Limpiar opciones anteriores

    const procesosActivos = memoria
        .filter(bloque => bloque.ocupado && bloque.proceso && bloque.proceso.nombre !== 'SO')
        .map(bloque => bloque.proceso);

    const procesosUnicos = [];
    const nombresVistos = new Set();
    
    procesosActivos.forEach(proceso => {
        if (!nombresVistos.has(proceso.nombre)) {
            nombresVistos.add(proceso.nombre);
            procesosUnicos.push(proceso);
        }
    });
    
    if (procesosUnicos.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No hay procesos para eliminar";
        select.appendChild(option);
    } else {
        procesosUnicos.forEach(proceso => {
            const option = document.createElement('option');
            option.value = proceso.nombre;
            option.textContent = `${proceso.nombre} (${proceso.tamano} KiB)`;
            select.appendChild(option);
        });
    }
    
    menuEliminarP.style.display = "flex";
});

cerrarParticion.addEventListener("click", () => menuParticion.style.display = "none");
cerrarAlgoritmo.addEventListener("click", () => menuAlgoritmo.style.display = "none");
cerrarAnadir.addEventListener("click", () => menuAnadirP.style.display = "none");
cerrarEliminar.addEventListener("click", () => menuEliminarP.style.display = "none");

document.querySelectorAll("#menu-particion ul button").forEach(btn => {
    btn.addEventListener("click", () => {
        particionElegida = btn.textContent;
        tipoParticion.textContent = `Partición: ${particionElegida}`;
        
        if (particionElegida === 'Estática de tamaño fijo') {
            algoritmoElegido = 'Primer ajuste';
            tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
            inicializarParticionesFijas();
        } 
        else if (particionElegida === 'Estática de tamaño variable') {
            algoritmoElegido = 'Primer ajuste';
            tipoAlgoritmo.textContent = "Algoritmo: —";
            tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
            inicializarParticionesFijasVariables();
        }
        
        actualizarVisualizacionMemoria();
        mostrarInformacionMemoria();
        menuParticion.style.display = "none";
    });
});

document.querySelectorAll("#menu-algoritmo ul button").forEach(btn => {
    btn.addEventListener("click", () => {
        const algoritmoSeleccionado = btn.textContent;
        
        if (particionElegida === 'Estática de tamaño fijo' && algoritmoSeleccionado !== 'Primer ajuste') {
            alert(`ERROR: En partición estática fija solo se puede usar "Primer ajuste".\nEl algoritmo ya está establecido automáticamente.`);
            return;
        }
        
        algoritmoElegido = algoritmoSeleccionado;
        tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
        menuAlgoritmo.style.display = "none";
    });
});

menuAnadirP.querySelector("form button").addEventListener("click", (e) => {
    e.preventDefault(); 

    const nombre = document.getElementById("nombre").value.trim();
    const tamano = parseInt(document.getElementById("tamano").value);
    
    if (!nombre) {
        alert("El nombre del proceso no puede estar vacío");
        return;
    }
    
    if (isNaN(tamano) || tamano <= 0) {
        alert("El tamaño debe ser un número mayor a 0");
        return;
    }
    
    if (tamano > TAMANO_PARTICION_KiB) {
        alert(`El tamaño no puede ser mayor a ${TAMANO_PARTICION_KiB} KiB (tamaño de partición)`);
        return;
    }

    const proceso = { nombre, tamano };
    if (asignarProceso(proceso)) {
        procesos.push(`${nombre} (${tamano} KiB)`);
        actualizarListaProcesos();
        actualizarVisualizacionMemoria();
        mostrarInformacionMemoria();
        alert(`Proceso "${nombre}" añadido exitosamente`); 
    } else {
        alert(`No se pudo añadir el proceso "${nombre}"`);
    }

    document.getElementById("nombre").value = "";
    document.getElementById("tamano").value = "";
    menuAnadirP.style.display = "none";
});

document.querySelector("#menu-eliminar-proceso form button").addEventListener("click", (e) => {
    e.preventDefault();
    const select = document.getElementById("proceso-eliminar");
    const nombreProceso = select.value;
    
    if (!nombreProceso) {
        alert("No hay procesos para eliminar");
        return;
    }
    
    if (eliminarProceso(nombreProceso)) {
        alert(`Proceso ${nombreProceso} eliminado`);
        mostrarInformacionMemoria();
    } else {
        alert(`No se encontró el proceso ${nombreProceso}`);
    }
    
    menuEliminarP.style.display = "none";
});

reiniciar.addEventListener("click", () => {
    particionElegida = null;
    algoritmoElegido = null;
    procesos = [];
    memoria = [];

    tipoParticion.textContent = "Partición: —";
    tipoAlgoritmo.textContent = "Algoritmo: —";
    listaProcesos.textContent = "Procesos: —";

    const memoriaBox = document.querySelector('.memoria-box');
    const etiquetasMemoria = document.querySelector('.etiquetas-memoria');
    memoriaBox.innerHTML = '';
    etiquetasMemoria.innerHTML = '';
    
    mostrarInformacionMemoria();
});

document.addEventListener('DOMContentLoaded', mostrarInformacionMemoria);