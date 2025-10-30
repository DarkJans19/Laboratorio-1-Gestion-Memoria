import { PrimerAjuste } from './Algoritmos/PrimerAjuste.js';
import { PeorAjuste } from './Algoritmos/PeorAjuste.js';
import { MejorAjuste } from './Algoritmos/MejorAjuste.js';
import { MemoriaDinamicaConCompactacion } from './Memoria/MemoriaDinamicaConCompactacion.js';
import { MemoriaDinamicaSinCompactacion } from './Memoria/MemoriaDinamicaSinCompactacion.js';
import { MemoriaEstaticaFija } from './Memoria/MemoriaEstaticaFija.js';
import { MemoriaEstaticaVariable } from './Memoria/MemoriaEstaticaVariable.js';
import { MemoriaSegmentada } from './Memoria/MemoriaSegmentada.js';
import { Proceso } from './Proceso/Proceso.js';
import { MemoriaPaginada } from './Memoria/MemoriaPaginada.js';


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

function mostrarInformacionMemoria() {
    const infoBox = document.getElementById('info-memoria');
    if (!infoBox) return;
    
    if (!memoriaManager) {
        infoBox.innerHTML = 'Selecciona partición y algoritmo';
        return;
    }
    
    let info = `
        <p><strong>Tipo de Memoria:</strong> ${particionElegida || 'No definida'}</p>
        <p><strong>Algoritmo:</strong> ${algoritmoElegido || 'No definido'}</p>
        <p><strong>Memoria Total:</strong> ${MEMORIA_TOTAL_KiB} KiB</p>
    `;
    
    if (memoriaManager.marcos) {
        const marcosLibres = memoriaManager.marcos.filter(m => !m.ocupado).length;
        const marcosTotales = memoriaManager.marcos.length;
        info += `<p><strong>Marcos:</strong> ${marcosLibres}/${marcosTotales} libres</p>`;
    }
    
    infoBox.innerHTML = info;
}

// 2. FUNCIÓN FALTANTE - actualizarListaProcesos()
function actualizarListaProcesos() {
    const listaProcesosEl = document.getElementById('lista-procesos');
    if (!listaProcesosEl) return;
    
    if (!memoriaManager || procesos.length === 0) {
        listaProcesosEl.innerHTML = '<p>Sin procesos</p>';
        return;
    }
    
    let html = '<ul>';
    procesos.forEach(p => {
        html += `<li>${p}</li>`;
    });
    html += '</ul>';
    
    listaProcesosEl.innerHTML = html;
}

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
        case 'Paginación':
    memoriaManager = new MemoriaPaginada(MEMORIA_TOTAL_KiB, estrategiaDefault);
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
    
    // Para paginación (ya tiene SO en los primeros 4 marcos)
    if (particionElegida === 'Paginación') {
        // Ya está hecho en MemoriaPaginada.inicializarMemoria()
        return;
    }
    
    // Para memorias estáticas
    if (particionElegida.includes('Estática') && memoriaManager.particiones.length > 0) {
        memoriaManager.particiones[0].añadirProceso(procesoSO);
    } 
    // Para memoria dinámica
    else {
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

    memoriaBox.innerHTML = '';
    etiquetasMemoria.innerHTML = '';
    etiquetasHex.innerHTML = '';

    memoriaManager.marcos.forEach((marco) => {
        const div = document.createElement('div');
        
        const esSO = marco.proceso && marco.proceso.nombreProceso === 'SO';
        const estaOcupado = marco.ocupado || marco.estado;
        
        if (esSO) {
            div.className = 'bloque so';
            div.textContent = 'SO';
        } else if (estaOcupado && marco.proceso) {
            div.className = 'bloque proceso';
            
            // En paginación, mostrar: Proceso - Marco - Página
            const pagNum = marco.pagina?.id ?? '?';
            div.textContent = `${marco.proceso.nombreProceso}\nMarco${marco.id}\nPág${pagNum}`;
        } else {
            div.className = 'bloque libre';
            div.textContent = 'Libre';
        }
        
        memoriaBox.appendChild(div);

        // Etiqueta de tamaño
        const etiqueta = document.createElement('div');
        etiqueta.className = 'etiqueta-bloque';
        etiqueta.textContent = `${marco.tamañoMarco} KiB`;
        etiquetasMemoria.appendChild(etiqueta);

        // Etiqueta hexadecimal
        const etiquetaHex = document.createElement('div');
        etiquetaHex.className = 'etiqueta-hex';
        etiquetaHex.textContent = `0x${((marco.direccionInicio || 0) * 1024).toString(16).toUpperCase()}`;
        etiquetasHex.appendChild(etiquetaHex);
    });
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
function eliminarProceso(pid) {
    if (!memoriaManager) {
        alert("Primero selecciona tipo de partición");
        return false;
    }
    
    const resultado = memoriaManager.eliminarProceso(pid);
    
    if (resultado) {
        // Filtrar procesos por el nombre (no por PID en la lista)
        // La lista de procesos guarda el nombre y tamaño
        procesos = procesos.filter(p => {
            // Obtener el nombre del proceso de la cadena
            const nombreProceso = p.split(' (')[0];
            // Buscar en memoriaManager si este proceso tiene ese PID
            if (memoriaManager.marcos) {
                const procesoEliminado = memoriaManager.marcos.find(
                    m => m.proceso && m.proceso.PID === pid && m.proceso.nombreProceso === nombreProceso
                );
                return !procesoEliminado;
            }
            return true;
        });
        
        console.log("✅ Proceso eliminado correctamente");
        refrescarVista();
    } else {
        console.log("❌ No se encontró el proceso con PID:", pid);
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

    // En paginación, un proceso puede ocupar múltiples marcos
    // Usar Set para evitar duplicados
    const procesosActivos = new Map();
    
    memoriaManager.marcos.forEach(marco => {
        if (marco.ocupado && marco.proceso && marco.proceso.nombreProceso !== 'SO') {
            const pid = marco.proceso.PID;
            if (!procesosActivos.has(pid)) {
                procesosActivos.set(pid, marco.proceso);
            }
        }
    });

    if (procesosActivos.size === 0) {
        select.innerHTML = '<option value="">No hay procesos para eliminar</option>';
    } else {
        procesosActivos.forEach((proceso, pid) => {
            const option = document.createElement('option');
            option.value = pid; // Usar PID como valor
            option.textContent = `${proceso.nombreProceso} (PID: ${pid}, ${proceso.tamañoProceso} KiB)`;
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
    
    // Verificar si es paginación (tiene marcos)
    if (memoriaManager.marcos) {
        for (let marco of memoriaManager.marcos) {
            if (marco.ocupado && marco.proceso && marco.proceso.nombreProceso === nombre) {
                return marco.proceso;
            }
        }
    } 
    // Para otros tipos (tienen particiones)
    else if (memoriaManager.particiones) {
        for (let particion of memoriaManager.particiones) {
            if (particion.estado && particion.proceso && particion.proceso.nombreProceso === nombre) {
                return particion.proceso;
            }
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
    
    // En paginación, evitar duplicados de procesos
    const procesosUnicos = new Map();
    
    memoriaManager.marcos.forEach(marco => {
        if (marco.ocupado && marco.proceso && marco.proceso.nombreProceso !== 'SO') {
            const pid = marco.proceso.PID;
            if (!procesosUnicos.has(pid)) {
                procesosUnicos.set(pid, marco.proceso);
            }
        }
    });
    
    procesosUnicos.forEach((proceso, pid) => {
        const option = document.createElement('option');
        option.value = pid;
        option.textContent = `${proceso.nombreProceso} (PID: ${pid})`;
        selector.appendChild(option);
    });
    
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
    document.getElementById('tamano-proceso-tabla').textContent = proceso.tamañoProceso + ' KiB';
    
    // DIFERENCIADO POR TIPO DE MEMORIA
    if (particionElegida === 'Paginación') {
        mostrarTablaPaginasProceso(pid);
        mostrarMapaMemoriaPaginacion(pid);
    } else if (particionElegida === 'Segmentación Pura') {
        mostrarTablaSegmentos(proceso);
        mostrarMapaMemoriaProceso(proceso);
    }
}
// Encontrar proceso por PID
function encontrarProcesoPorPID(pid) {
    if (!memoriaManager) return null;
    
    // Verificar si es paginación (tiene marcos)
    if (memoriaManager.marcos) {
        for (let marco of memoriaManager.marcos) {
            if (marco.ocupado && marco.proceso && marco.proceso.PID === pid) {
                return marco.proceso;
            }
        }
    } 
    // Para otros tipos (tienen particiones)
    else if (memoriaManager.particiones) {
        for (let particion of memoriaManager.particiones) {
            if (particion.estado && particion.proceso && particion.proceso.PID === pid) {
                return particion.proceso;
            }
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

function mostrarTablaPaginasProceso(pid) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-segmentos');
    cuerpoTabla.innerHTML = '';
    
    // Obtener todos los marcos de este proceso
    const marcosDelProceso = memoriaManager.marcos.filter(marco => 
        marco.ocupado && marco.proceso && marco.proceso.PID === pid
    ).sort((a, b) => a.id - b.id); // Ordenar por ID de marco
    
    if (marcosDelProceso.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay páginas cargadas</td></tr>';
        return;
    }
    
    // Actualizar el título de la tabla
    document.querySelector('#tabla-segmentos thead tr').innerHTML = `
        <th style="padding: 8px; border: 1px solid #ddd;">Número Página</th>
        <th style="padding: 8px; border: 1px solid #ddd;">Número Marco</th>
        <th style="padding: 8px; border: 1px solid #ddd;">Tamaño (KiB)</th>
        <th style="padding: 8px; border: 1px solid #ddd;">Dirección Lógica</th>
        <th style="padding: 8px; border: 1px solid #ddd;">Dirección Física</th>

    `;
    
    marcosDelProceso.forEach(marco => {
        const fila = document.createElement('tr');
        
        // Información del marco y página
        const numPagina = marco.pagina?.id ?? '?';
        const numMarco = marco.id;
        const tamanoMarco = marco.tamañoMarco;
        
        // DIRECCIÓN LÓGICA (Virtual)
        // Fórmula: Número de Página * Tamaño de Página
        const direccionLogica = numPagina * tamanoMarco;
        
        // DIRECCIÓN FÍSICA (Real en memoria)
        // Fórmula: Dirección inicio del marco * 1024 (para convertir a bytes)
        const direccionFisica = marco.direccionInicio * 1024;
        // Generar la fila de la tabla
        fila.innerHTML = `
            <td style="padding: 8px; border: 1px solid #ff1111ff; text-align: center;">
                <strong>${numPagina}</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ff1111ff; text-align: center;">
                <strong>${numMarco}</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                ${tamanoMarco} KiB
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">
                0x${direccionLogica.toString(16).toUpperCase().padStart(4, '0')}
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">
                0x${direccionFisica.toString(16).toUpperCase().padStart(6, '0')}
            </td>
        `;
        
        cuerpoTabla.appendChild(fila);
    });
    
    document.getElementById('contenedor-tabla-segmentos').style.display = 'block';
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
                'btn-particion-segmentada': 'Segmentación Pura',
                'btn-particion-paginada': 'Paginación'
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

const btnAgregarProceso = document.getElementById("btn-agregar-proceso");
if (btnAgregarProceso) {
    // Limpiar listeners anteriores
    const nuevoBtn = btnAgregarProceso.cloneNode(true);
    btnAgregarProceso.parentNode.replaceChild(nuevoBtn, btnAgregarProceso);
    
    const btnAgregarProcesoNuevo = document.getElementById("btn-agregar-proceso");
    btnAgregarProcesoNuevo.addEventListener("click", e => {
        e.preventDefault();
        console.log("✅ Botón agregar proceso clickeado");
        
        const nombreInput = document.getElementById("input-nombre-proceso");
const tamanoInput = document.getElementById("input-tamano-proceso");        
        if (!nombreInput || !tamanoInput) {
            console.error("❌ Inputs no encontrados");
            alert("Error: Inputs no encontrados");
            return;
        }
        
        const nombre = nombreInput.value.trim();
        const tamano = parseInt(tamanoInput.value);

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

        nombreInput.value = "";
        tamanoInput.value = "";
        
        // Cerrar el menu
        const menuAnadirP = document.getElementById("menu-anadirproceso");
        if (menuAnadirP) {
            menuAnadirP.style.display = "none";
        }
    });
}

const btnAnadirProceso = document.getElementById("btn-anadir-proceso");
if (btnAnadirProceso) {
    btnAnadirProceso.addEventListener("click", () => {
        console.log("📂 Abriendo menu añadir proceso");
        
        if (!particionElegida || !algoritmoElegido) {
            alert("Primero selecciona partición y algoritmo");
            return;
        }
        
        const menuAnadirP = document.getElementById("menu-anadirproceso");
        if (menuAnadirP) {
            menuAnadirP.style.display = "flex";
            console.log("✅ Menu abierto");
        } else {
            console.error("❌ No encontré menu-anadirproceso");
        }
    });
}

    // Eliminar proceso
const btnEliminarForm = document.getElementById("btn-eliminar-proceso-form");
if (btnEliminarForm) {
    // Primero, remove el listener anterior (si existe)
    const nuevoBoton = btnEliminarForm.cloneNode(true);
    btnEliminarForm.parentNode.replaceChild(nuevoBoton, btnEliminarForm);
    
    // Ahora agrega el nuevo listener
    const btnEliminarFormNuevo = document.getElementById("btn-eliminar-proceso-form");
    btnEliminarFormNuevo.addEventListener("click", e => {
        e.preventDefault();
        
        const procesoEliminarSelect = document.getElementById("proceso-eliminar");
        
        if (!procesoEliminarSelect) {
            console.error("❌ Select 'proceso-eliminar' no encontrado");
            alert("Error: Select no encontrado");
            return;
        }
        
        const pidSeleccionado = parseInt(procesoEliminarSelect.value);
        
        console.log("📋 PID Seleccionado para eliminar:", pidSeleccionado);
        
        if (!pidSeleccionado || pidSeleccionado === 0 || isNaN(pidSeleccionado)) {
            alert("No hay procesos para eliminar");
            return;
        }

        if (eliminarProceso(pidSeleccionado)) {
            alert(`Proceso eliminado correctamente`);
        } else {
            alert(`No se encontró el proceso con PID: ${pidSeleccionado}`);
        }
        
        const menuEliminarP = document.getElementById("menu-eliminar-proceso");
        if (menuEliminarP) {
            menuEliminarP.style.display = "none";
        }
        
        // Limpiar y actualizar la lista
        actualizarListaEliminacion();
        actualizarVisualizacionMemoria();
    });
}

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
