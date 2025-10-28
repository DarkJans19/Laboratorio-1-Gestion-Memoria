import { PrimerAjuste } from './Algoritmos/PrimerAjuste.js';
import { PeorAjuste } from './Algoritmos/PeorAjuste.js';
import { MejorAjuste } from './Algoritmos/MejorAjuste.js';
import { MemoriaDinamicaConCompactacion } from './Memoria/MemoriaDinamicaConCompactacion.js';
import { MemoriaDinamicaSinCompactacion } from './Memoria/MemoriaDinamicaSinCompactacion.js';
import { MemoriaEstaticaFija } from './Memoria/MemoriaEstaticaFija.js';
import { MemoriaEstaticaVariable } from './Memoria/MemoriaEstaticaVariable.js';
import { MemoriaSegmentada } from './Memoria/MemoriaSegmentada.js';
import { Proceso } from './Proceso/Proceso.js';

// Variables globales
let memoriaManager = null;
let particionElegida = null;
let algoritmoElegido = null;
let procesos = [];
let proximoPID = 1;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventListeners();
    mostrarInformacionMemoria();
    inicializarBotonesProcesos();
});

// Actualizar toda la interfaz
function refrescarVista() {
    if (memoriaManager) {
        actualizarVisualizacionMemoria();
        mostrarInformacionMemoria();
        actualizarListaProcesos();
    }
}

// Inicializar memoria según el tipo seleccionado
function inicializarMemoria() {
    if (!particionElegida) return;
    
    // Primero crear la estrategia por defecto (se actualizará después con la selección del algoritmo)
    const estrategiaDefault = new PrimerAjuste();
    
    switch(particionElegida) {
        case 'Estática de tamaño fijo':
            memoriaManager = new MemoriaEstaticaFija(MEMORIA_TOTAL_KiB, estrategiaDefault);
            break;
        case 'Estática de tamaño variable':
            memoriaManager = new MemoriaEstaticaVariable(MEMORIA_TOTAL_KiB, estrategiaDefault);
            break;
        case 'Dinámica (sin compactación)':
            memoriaManager = new MemoriaDinamicaSinCompactacion(MEMORIA_TOTAL_KiB, estrategiaDefault);
            memoriaManager.inicializarMemoria();
            break;
        case 'Dinámica (con compactación)':
            memoriaManager = new MemoriaDinamicaConCompactacion(MEMORIA_TOTAL_KiB, estrategiaDefault);
            memoriaManager.inicializarMemoria();
            break;
        case 'Segmentación Pura':
            memoriaManager = new MemoriaSegmentada(MEMORIA_TOTAL_KiB, estrategiaDefault);
            break;
    }
    
    // Agregar Sistema Operativo
    inicializarMemoriaConSO();
    proximoPID = 1;

    // Si ya tenemos algoritmo seleccionado, configurarlo
    if (algoritmoElegido) {
        configurarEstrategiaAlgoritmo();
    }
}

function inicializarMemoriaConSO() {
    if (!memoriaManager) return;
    
    const procesoSO = new Proceso(0, "SO", 1024);
    
    // Para memorias estáticas, asignar el SO a la primera partición
    if (particionElegida.includes('Estática') && memoriaManager.particiones.length > 0) {
        memoriaManager.particiones[0].añadirProceso(procesoSO);
    } else {
        // Para memoria dinámica, usar el método normal
        memoriaManager.añadirProceso(procesoSO);
    }
}

// Precargar programas predefinidos
/*
function precargarProgramas() {
    if (!memoriaManager) return;
    
    let programasAsignados = 0;
    
    PROGRAMAS_PREDEFINIDOS.forEach(programa => {
        if (programasAsignados < 5) {
            const proceso = new Proceso(proximoPID++, programa.nombre, programa.tamano);
            
            try {
                memoriaManager.añadirProceso(proceso);
                procesos.push(`${programa.nombre} (${programa.tamano} KiB)`);
                programasAsignados++;
            } catch (error) {
                console.log(`No se pudo asignar ${programa.nombre}: ${error.message}`);
            }
        }
    });
    
    refrescarVista();
}
*/

function actualizarVisualizacionMemoria() {
    if (!memoriaManager) return;
    
    const memoriaBox = document.querySelector('.memoria-box');
    const etiquetasMemoria = document.querySelector('.etiquetas-memoria');
    const etiquetasHex = document.querySelector('.etiquetas-hex');

    // Limpiar contenido anterior
    memoriaBox.innerHTML = '';
    etiquetasMemoria.innerHTML = '';
    etiquetasHex.innerHTML = '';

    memoriaManager.particiones.forEach((particion) => {
        // Crear bloque de memoria
        const div = document.createElement('div');
        
        // Determinar clase CSS según el tipo de bloque
        if (particion.proceso && particion.proceso.nombreProceso === 'SO') {
            div.className = 'bloque so';
            div.textContent = 'SO';
        } else if (particion.estado) {
            div.className = 'bloque proceso';
            
            // MOSTRAR INFORMACIÓN DEL SEGMENTO - CORREGIDO
            if (particion.segmento) {
                // Para segmentación: mostrar proceso + segmento + tamaño del segmento
                div.textContent = `${particion.proceso.nombreProceso}\n${particion.segmento.nombre}\n${particion.tamañoParticion} KiB`;
            } else {
                // Para particiones normales: mostrar proceso + tamaño de la partición
                div.textContent = `${particion.proceso.nombreProceso}\n${particion.proceso.tamañoProceso} KiB`;
            }
        } else {
            div.className = 'bloque libre';
            div.textContent = 'Libre';
        }
        
        memoriaBox.appendChild(div);

        // Crear etiqueta de tamaño
        const etiqueta = document.createElement('div');
        etiqueta.className = 'etiqueta-bloque';
        etiqueta.textContent = `${particion.tamañoParticion} KiB`;
        etiquetasMemoria.appendChild(etiqueta);

        // Crear etiqueta hexadecimal
        const etiquetaHex = document.createElement('div');
        etiquetaHex.className = 'etiqueta-hex';
        etiquetaHex.textContent = `0x${(particion.direccionInicio * 1024).toString(16).toUpperCase()}`;
        etiquetasHex.appendChild(etiquetaHex);
    });
}

// Actualizar lista de procesos
function actualizarListaProcesos() {
    if (!memoriaManager) {
        listaProcesos.textContent = "Procesos: —";
        return;
    }

    const procesosActivos = memoriaManager.particiones
        .filter(p => p.estado && p.proceso && p.proceso.nombreProceso !== 'SO')
        .map(p => `${p.proceso.nombreProceso} (${p.proceso.tamañoProceso} KiB)`);
    
    listaProcesos.textContent = `Procesos: ${procesosActivos.length > 0 ? procesosActivos.join(", ") : "—"}`;
}

// Mostrar información de memoria
function mostrarInformacionMemoria() {
    const infoEleccion = document.querySelector('.info-eleccion');
    
    if (!memoriaManager) {
        infoEleccion.innerHTML = `
            <ul>
                <li>Particiones libres: —</li>
                <li>Memoria usada: —</li>
                <li>Fragmentación interna: —</li>
            </ul>
        `;
        return;
    }

    const particionesLibres = memoriaManager.particiones.filter(p => !p.estado).length;
    const memoriaUsada = memoriaManager.particiones
        .filter(p => p.estado)
        .reduce((total, p) => total + (p.proceso?.tamañoProceso || 0), 0);
    
    const fragmentacionInterna = memoriaManager.particiones
        .filter(p => p.estado)
        .reduce((total, p) => total + (p.tamañoParticion - p.proceso.tamañoProceso), 0);

    const html = `
        <ul>
            <li>Particiones libres: ${particionesLibres}</li>
            <li>Memoria usada: ${memoriaUsada} KiB</li>
            <li>Fragmentación interna: ${fragmentacionInterna} KiB</li>
        </ul>
    `;
    
    infoEleccion.innerHTML = html;
}

// Asignar proceso
function asignarProceso(procesoData) {
    if (!memoriaManager) {
        alert("Primero selecciona tipo de partición y algoritmo");
        return false;
    }
    
    try {
        const proceso = new Proceso(proximoPID++, procesoData.nombre, procesoData.tamano);
        memoriaManager.añadirProceso(proceso);
        procesos.push(`${procesoData.nombre} (${procesoData.tamano} KiB)`);
        refrescarVista();
        return true;
    } catch (error) {
        console.error("Error al asignar proceso:", error);
        return false;
    }
}

// Eliminar proceso
function eliminarProceso(nombreProceso) {
    if (!memoriaManager) {
        alert("Primero selecciona tipo de partición");
        return false;
    }
    
    // Buscar el proceso por nombre
    const particion = memoriaManager.particiones.find(p => 
        p.proceso && p.proceso.nombreProceso === nombreProceso
    );
    
    if (!particion) {
        return false;
    }
    
    const pid = particion.proceso.PID;
    const resultado = memoriaManager.eliminarProceso(pid);
    
    if (resultado) {
        // Remover de la lista de procesos
        procesos = procesos.filter(p => !p.startsWith(nombreProceso));
        refrescarVista();
    }
    
    return resultado;
}

// Configurar estrategia de algoritmo
function configurarEstrategiaAlgoritmo() {
    if (!memoriaManager || !algoritmoElegido) return;
    
    let estrategia;
    switch (algoritmoElegido) {
        case 'Primer ajuste':
            estrategia = new PrimerAjuste();
            break;
        case 'Mejor ajuste':
            estrategia = new MejorAjuste();
            break;
        case 'Peor ajuste':
            estrategia = new PeorAjuste();
            break;
        default:
            estrategia = new PrimerAjuste();
    }
    
    memoriaManager.estrategiaAlgoritmo = estrategia;
}

// Actualizar lista para eliminación
function actualizarListaEliminacion() {
    const select = document.getElementById("proceso-eliminar");
    select.innerHTML = '';

    if (!memoriaManager) {
        select.innerHTML = '<option value="">No hay procesos</option>';
        return;
    }

    const procesosActivos = memoriaManager.particiones
        .filter(p => p.estado && p.proceso && p.proceso.nombreProceso !== 'SO')
        .map(p => p.proceso);

    if (procesosActivos.length === 0) {
        select.innerHTML = '<option value="">No hay procesos para eliminar</option>';
    } else {
        // Eliminar duplicados
        const nombresUnicos = [...new Set(procesosActivos.map(p => p.nombreProceso))];
        
        nombresUnicos.forEach(nombre => {
            const proceso = procesosActivos.find(p => p.nombreProceso === nombre);
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = `${nombre} (${proceso.tamañoProceso} KiB)`;
            select.appendChild(option);
        });
    }
}

// Botones dinamicos

function inicializarBotonesProcesos() {
    PROGRAMAS_PREDEFINIDOS.forEach(programa => {
        const nuevoLi = document.createElement("li");

        const botonProceso = document.createElement('button');
        botonProceso.textContent = programa.nombre;
        botonProceso.addEventListener('click', () => asignarProceso(programa));

        const botonSegmentos = document.createElement('button');
        botonSegmentos.textContent = "Editar segmentos";
        botonSegmentos.addEventListener('click', () => abrirVentanaSegmentos(programa));

        // NUEVO: Botón para ver tabla (solo cuando el proceso esté cargado)
        const botonVerTabla = document.createElement('button');
        botonVerTabla.textContent = "Ver tabla";
        botonVerTabla.addEventListener('click', () => {
            // Buscar si el proceso ya está cargado
            const procesoCargado = encontrarProcesoPorNombre(programa.nombre);
            if (procesoCargado) {
                abrirVentanaTablasProcesos();
                // Seleccionar automáticamente este proceso
                setTimeout(() => {
                    document.getElementById('selector-proceso-tabla').value = procesoCargado.PID;
                    mostrarTablaProceso(procesoCargado.PID);
                }, 100);
            } else {
                alert("El proceso debe estar cargado en memoria para ver su tabla");
            }
        });

        nuevoLi.appendChild(botonProceso);
        nuevoLi.appendChild(botonSegmentos);
        nuevoLi.appendChild(botonVerTabla);
        menuProcesosPredeterminados.appendChild(nuevoLi);
    });
}

// Función auxiliar para encontrar proceso por nombre
function encontrarProcesoPorNombre(nombre) {
    if (!memoriaManager) return null;
    
    for (let particion of memoriaManager.particiones) {
        if (particion.estado && particion.proceso && particion.proceso.nombreProceso === nombre) {
            return particion.proceso;
        }
    }
    return null;
}

function abrirVentanaSegmentos(programa) {
    const modal = document.getElementById("ventana-segmentos");
    const lista = document.getElementById("lista-segmentos");
    const titulo = document.getElementById("titulo-segmentos");

    // Actualiza el título
    titulo.textContent = `Segmentos de ${programa.nombre}`;

    // Limpia la lista anterior
    lista.innerHTML = "";

    // Crea los campos para modificar los tamaños
    programa.segmentos.forEach((seg, index) => {
        const divSeg = document.createElement("div");
        divSeg.classList.add("segmento-item");

        divSeg.innerHTML = `
        <label>${seg.nombre}:</label>
        <input type="number" value="${seg.tamaño}" id="seg-${index}" min="1">
        `;

        lista.appendChild(divSeg);
    });

    // Muestra la ventana
    modal.style.display = "block";

    // Botón guardar
    const botonGuardar = document.getElementById("guardar-segmentos");
    botonGuardar.onclick = function() {
        let total = 0;
        programa.segmentos.forEach((seg, index) => {
        const nuevoTam = parseInt(document.getElementById(`seg-${index}`).value);
        seg.tamaño = nuevoTam;
        total += nuevoTam;
        });

        // Actualiza el tamaño total del programa según los segmentos
        programa.tamano = total;

        alert(`Segmentos actualizados para ${programa.nombre}. Tamaño total: ${total} KiB`);
        modal.style.display = "none";
    };
}

// Función para abrir la ventana de tablas
function abrirVentanaTablasProcesos() {
    if (!memoriaManager) {
        alert("Primero inicializa la memoria con algún tipo de partición");
        return;
    }
    
    const modal = document.getElementById("ventana-tablas-procesos");
    actualizarSelectorProcesos();
    modal.style.display = "block";
}

// Actualizar el selector de procesos
function actualizarSelectorProcesos() {
    const selector = document.getElementById("selector-proceso-tabla");
    selector.innerHTML = '<option value="">-- Selecciona un proceso --</option>';
    
    if (!memoriaManager) return;
    
    // Obtener procesos únicos (pueden tener múltiples particiones/segmentos)
    const procesosUnicos = [];
    const procesosVistos = new Set();
    
    memoriaManager.particiones.forEach(particion => {
        if (particion.estado && particion.proceso && particion.proceso.nombreProceso !== 'SO') {
            if (!procesosVistos.has(particion.proceso.PID)) {
                procesosVistos.add(particion.proceso.PID);
                procesosUnicos.push(particion.proceso);
            }
        }
    });
    
    // Añadir opciones al selector
    procesosUnicos.forEach(proceso => {
        const option = document.createElement('option');
        option.value = proceso.PID;
        option.textContent = `${proceso.nombreProceso} (PID: ${proceso.PID})`;
        selector.appendChild(option);
    });
    
    // Añadir evento al selector
    selector.onchange = function() {
        const pidSeleccionado = parseInt(this.value);
        if (pidSeleccionado) {
            mostrarTablaProceso(pidSeleccionado);
        } else {
            ocultarTablas();
        }
    };
}

// Mostrar tabla de un proceso específico
function mostrarTablaProceso(pid) {
    const proceso = encontrarProcesoPorPID(pid);
    if (!proceso) return;
    
    // Mostrar información general
    document.getElementById('info-proceso-tabla').style.display = 'block';
    document.getElementById('nombre-proceso-tabla').textContent = proceso.nombreProceso;
    document.getElementById('pid-proceso-tabla').textContent = proceso.PID;
    document.getElementById('tamano-proceso-tabla').textContent = proceso.tamañoReal + ' KiB';
    
    // Mostrar tabla de segmentos
    mostrarTablaSegmentos(proceso);
    
    // Mostrar mapa de memoria
    mostrarMapaMemoriaProceso(proceso);
}

// Encontrar proceso por PID
function encontrarProcesoPorPID(pid) {
    if (!memoriaManager) return null;
    
    for (let particion of memoriaManager.particiones) {
        if (particion.estado && particion.proceso && particion.proceso.PID === pid) {
            return particion.proceso;
        }
    }
    return null;
}

// Mostrar tabla de segmentos
function mostrarTablaSegmentos(proceso) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-segmentos');
    cuerpoTabla.innerHTML = '';
    
    if (!proceso.tablaSegmentos || proceso.tablaSegmentos.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay segmentos definidos</td></tr>';
        return;
    }
    
    proceso.tablaSegmentos.forEach(segmento => {
        const fila = document.createElement('tr');
        
        const estaCargado = segmento.direccionFisica !== null && segmento.direccionFisica !== undefined;
        
        fila.innerHTML = `
            <td>${segmento.id}</td>
            <td>${segmento.nombre}</td>
            <td>${segmento.tamaño} KiB</td>
            <td>0x${segmento.direccionBase.toString(16).toUpperCase()}</td>
            <td>${estaCargado ? '0x' + (segmento.direccionFisica * 1024).toString(16).toUpperCase() : '—'}</td>
            <td>${segmento.permiso || 'RW'}</td>
            <td class="${estaCargado ? 'estado-cargado' : 'estado-no-cargado'}">
                ${estaCargado ? 'CARGADO' : 'NO CARGADO'}
            </td>
        `;
        
        cuerpoTabla.appendChild(fila);
    });
    
    document.getElementById('contenedor-tabla-segmentos').style.display = 'block';
}

// Mostrar mapa de memoria del proceso
function mostrarMapaMemoriaProceso(proceso) {
    const contenedor = document.getElementById('visualizacion-memoria-proceso');
    contenedor.innerHTML = '';
    
    if (!proceso.tablaSegmentos) return;
    
    // Crear visualización del espacio de direcciones del proceso
    const mapa = document.createElement('div');
    mapa.className = 'mapa-memoria-proceso';
    
    proceso.tablaSegmentos.forEach(segmento => {
        const bloque = document.createElement('div');
        bloque.className = `bloque-memoria-proceso ${segmento.direccionFisica ? 'bloque-segmento' : 'bloque-no-asignado'}`;
        
        const estado = segmento.direccionFisica ? 'Cargado' : 'No cargado';
        const direccionFisica = segmento.direccionFisica ? 
            `0x${(segmento.direccionFisica * 1024).toString(16).toUpperCase()}` : '—';
        
        bloque.innerHTML = `
            <strong>${segmento.nombre}</strong><br>
            Tamaño: ${segmento.tamaño} KiB<br>
            Dirección lógica: 0x${segmento.direccionBase.toString(16).toUpperCase()}<br>
            Dirección física: ${direccionFisica}<br>
            <em>${estado}</em>
        `;
        
        // Ajustar altura proporcional al tamaño
        const alturaBase = 80; // altura base en px
        const altura = Math.max(alturaBase, (segmento.tamaño / 50) * alturaBase);
        bloque.style.height = `${altura}px`;
        bloque.style.minHeight = `${alturaBase}px`;
        
        mapa.appendChild(bloque);
    });
    
    contenedor.appendChild(mapa);
    document.getElementById('mapa-memoria-proceso').style.display = 'block';
}

// Ocultar tablas
function ocultarTablas() {
    document.getElementById('info-proceso-tabla').style.display = 'none';
    document.getElementById('contenedor-tabla-segmentos').style.display = 'none';
    document.getElementById('mapa-memoria-proceso').style.display = 'none';
}

// Función para traducción de direcciones (demo)
function demostrarTraduccionDireccion(proceso, segmentoId, desplazamiento) {
    try {
        const direccionFisica = proceso.traducirDireccion(segmentoId, desplazamiento);
        console.log(`Traducción: Segmento ${segmentoId} + ${desplazamiento} = 0x${direccionFisica.toString(16).toUpperCase()}`);
        return direccionFisica;
    } catch (error) {
        console.error('Error en traducción:', error.message);
        return null;
    }
}

// Event Listeners
function inicializarEventListeners() {
    // Botón para seleccionar tipo de partición
    document.getElementById("btn-particion").addEventListener("click", () => {
        if (!particionElegida) {
            menuParticion.style.display = "flex";
        } else {
            alert("Reinicia para volver a escoger partición");
        }
    });

    document.getElementById("btn-ver-tablas").addEventListener("click", () => {
        abrirVentanaTablasProcesos();
    });

    // Botón para seleccionar algoritmo
    document.getElementById("btn-algoritmo").addEventListener("click", () => {
        if (!particionElegida) {
            alert("Primero selecciona el tipo de partición");
        } else if (!algoritmoElegido) {
            menuAlgoritmo.style.display = "flex";
        } else {
            alert("Reinicia para volver a escoger algoritmo");
        }
    });

    // Boton para seleccionar procesos predeterminados
    document.getElementById("btn-procesos-predeterminados").addEventListener("click", () => {
        if (!particionElegida || !algoritmoElegido) {
        alert("Primero selecciona partición y algoritmo");
        } else {
        document.getElementById("menu-procesos").style.display = "flex";
        }
    });

    // Botón para añadir proceso
    document.getElementById("btn-anadir-proceso").addEventListener("click", () => {
        if (!particionElegida || !algoritmoElegido) {
            alert("Primero selecciona partición y algoritmo");
        } else {
            menuAnadirP.style.display = "flex";
        }
    });

    // Botón para eliminar proceso
    document.getElementById("btn-eliminar-proceso").addEventListener("click", () => {
        if (!particionElegida) {
            alert("Primero selecciona tipo de partición");
        } else {
            actualizarListaEliminacion();
            menuEliminarP.style.display = "flex";
        }
    });

    // Botones de cerrar
    document.querySelectorAll('[id^="cerrar-"]').forEach(btn => {
        btn.addEventListener("click", () => {
            btn.closest(".ventana-oculta").style.display = "none";
        });
    });

    // Selección de partición
    document.querySelectorAll("#menu-particion ul button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const map = {
                'btn-particion-fija': 'Estática de tamaño fijo',
                'btn-particion-variable': 'Estática de tamaño variable',
                'btn-particion-dinamica-sin': 'Dinámica (sin compactación)',
                'btn-particion-dinamica-con': 'Dinámica (con compactación)',
                'btn-particion-segmentada': 'Segmentación Pura'
            };

            particionElegida = map[btn.id];
            tipoParticion.textContent = `Partición: ${particionElegida}`;
            
            // Inicializar la memoria cuando se selecciona partición
            inicializarMemoria();
            
            menuParticion.style.display = "none";
            refrescarVista();
        });
    });

    // Selección de algoritmo
    document.querySelectorAll("#menu-algoritmo ul button").forEach(btn => {
        btn.addEventListener("click", () => {
            algoritmoElegido = btn.textContent;
            tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
            
            // Configurar la estrategia cuando se selecciona algoritmo
            configurarEstrategiaAlgoritmo();
            
            menuAlgoritmo.style.display = "none";
            refrescarVista();
        });
    });

    // Agregar proceso
    document.getElementById("btn-agregar-proceso").addEventListener("click", e => {
        e.preventDefault();
        const nombre = document.getElementById("nombre-proceso").value.trim();
        const tamano = parseInt(document.getElementById("tamano-proceso").value);

        if (!nombre) {
            alert("El nombre del proceso no puede estar vacío");
            return;
        }
        if (isNaN(tamano) || tamano <= 0) {
            alert("El tamaño debe ser mayor que 0");
            return;
        }

        if (asignarProceso({ nombre, tamano })) {
            alert(`Proceso "${nombre}" añadido exitosamente`);
        } else {
            alert(`No se pudo añadir el proceso "${nombre}" - No hay espacio suficiente`);
        }

        document.getElementById("nombre-proceso").value = "";
        document.getElementById("tamano-proceso").value = "";
        menuAnadirP.style.display = "none";
    });

    // Eliminar proceso
    document.getElementById("btn-eliminar-proceso-form").addEventListener("click", e => {
        e.preventDefault();
        const nombreProceso = document.getElementById("proceso-eliminar").value;
        if (!nombreProceso) {
            alert("No hay procesos para eliminar");
            return;
        }

        if (eliminarProceso(nombreProceso)) {
            alert(`Proceso ${nombreProceso} eliminado`);
        } else {
            alert(`No se encontró el proceso ${nombreProceso}`);
        }
        menuEliminarP.style.display = "none";
        actualizarVisualizacionMemoria();
    });

    // Reiniciar
    reiniciar.addEventListener("click", () => {
        memoriaManager = null;
        particionElegida = null;
        algoritmoElegido = null;
        procesos = [];
        proximoPID = 1;

        tipoParticion.textContent = "Partición: —";
        tipoAlgoritmo.textContent = "Algoritmo: —";
        listaProcesos.textContent = "Procesos: —";

        document.querySelector('.memoria-box').innerHTML = '';
        document.querySelector('.etiquetas-memoria').innerHTML = '';
        document.querySelector('.etiquetas-hex').innerHTML = '';
        mostrarInformacionMemoria();
    });
}
