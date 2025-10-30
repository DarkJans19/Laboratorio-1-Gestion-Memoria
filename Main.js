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
    
    // También actualizar el selector de procesos para eliminación
    actualizarListaEliminacion();
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

// FUNCIÓN UNIFICADA: Inicializar SO según tipo de memoria
function inicializarMemoriaConSO() {
    if (!memoriaManager) return;
    
    const procesoSO = new Proceso(0, "SO", 1024);
    
    // Para paginación (ya tiene SO en los primeros 4 marcos)
    if (particionElegida === 'Paginación') {
        return; // Ya está hecho en MemoriaPaginada.inicializarMemoria()
    }
    
    // Para memorias estáticas
    if (particionElegida.includes('Estática') && memoriaManager.particiones.length > 0) {
        memoriaManager.particiones[0].añadirProceso(procesoSO);
    } 
    // Para memoria dinámica y segmentación
    else {
        memoriaManager.añadirProceso(procesoSO);
    }
}

// FUNCIÓN UNIFICADA: Visualización de memoria
function actualizarVisualizacionMemoria() {
    if (!memoriaManager) return;
    
    const memoriaBox = document.querySelector('.memoria-box');
    const etiquetasMemoria = document.querySelector('.etiquetas-memoria');
    const etiquetasHex = document.querySelector('.etiquetas-hex');

    memoriaBox.innerHTML = '';
    etiquetasMemoria.innerHTML = '';
    etiquetasHex.innerHTML = '';

    // DETECTAR TIPO DE MEMORIA
    if (memoriaManager.marcos) {
        // PAGINACIÓN: Visualizar marcos
        visualizarPaginacion(memoriaBox, etiquetasMemoria, etiquetasHex);
    } else if (memoriaManager.particiones) {
        // SEGMENTACIÓN Y OTROS: Visualizar particiones
        visualizarSegmentacion(memoriaBox, etiquetasMemoria, etiquetasHex);
    }
}

// Visualización para PAGINACIÓN
function visualizarPaginacion(memoriaBox, etiquetasMemoria, etiquetasHex) {
    memoriaManager.marcos.forEach((marco) => {
        const div = document.createElement('div');
        
        const esSO = marco.proceso && marco.proceso.nombreProceso === 'SO';
        const estaOcupado = marco.ocupado || marco.estado;
        
        if (esSO) {
            div.className = 'bloque so';
            div.textContent = 'SO';
        } else if (estaOcupado && marco.proceso) {
            div.className = 'bloque proceso';
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

// Visualización para SEGMENTACIÓN
function visualizarSegmentacion(memoriaBox, etiquetasMemoria, etiquetasHex) {
    const totalParticiones = memoriaManager.particiones.length;
    const alturaMaximaContenedor = 600;
    const alturaMinimaBloque = 20;
    const alturaTotalNecesaria = totalParticiones * alturaMinimaBloque;
    
    if (alturaTotalNecesaria > alturaMaximaContenedor) {
        memoriaBox.style.height = `${alturaTotalNecesaria}px`;
    } else {
        memoriaBox.style.height = `${alturaMaximaContenedor}px`;
    }

    const alturaBloque = Math.max(alturaMinimaBloque, memoriaBox.clientHeight / totalParticiones);

    memoriaManager.particiones.forEach((particion) => {
        const div = document.createElement('div');
        div.style.height = `${alturaBloque}px`;
        div.style.minHeight = `${alturaMinimaBloque}px`;
        
        if (particion.proceso && particion.proceso.nombreProceso === 'SO') {
            div.className = 'bloque so';
            div.textContent = 'SO';
        } else if (particion.estado) {
            div.className = 'bloque proceso';
            if (particion.segmento) {
                div.innerHTML = `
                    <div style="font-size: ${Math.max(10, alturaBloque/5)}px; line-height: 1.2;">
                        <strong>${particion.proceso.nombreProceso}</strong><br>
                        ${particion.segmento.nombre}<br>
                        ${particion.tamañoParticion} KiB
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <div style="font-size: ${Math.max(10, alturaBloque/5)}px; line-height: 1.2;">
                        <strong>${particion.proceso.nombreProceso}</strong><br>
                        ${particion.proceso.tamañoProceso} KiB
                    </div>
                `;
            }
        } else {
            div.className = 'bloque libre';
            div.innerHTML = `
                <div style="font-size: ${Math.max(10, alturaBloque/5)}px;">
                    Libre<br>${particion.tamañoParticion} KiB
                </div>
            `;
        }
        
        div.title = `Dirección: 0x${(particion.direccionInicio * 1024).toString(16).toUpperCase()}\nTamaño: ${particion.tamañoParticion} KiB\n${particion.segmento ? `Segmento: ${particion.segmento.nombre}` : ''}`;
        
        memoriaBox.appendChild(div);

        // Etiquetas
        const etiqueta = document.createElement('div');
        etiqueta.className = 'etiqueta-bloque';
        etiqueta.style.height = `${alturaBloque}px`;
        etiqueta.style.minHeight = `${alturaMinimaBloque}px`;
        etiqueta.style.fontSize = `${Math.max(8, alturaBloque/6)}px`;
        etiqueta.textContent = `${particion.tamañoParticion} KiB`;
        etiquetasMemoria.appendChild(etiqueta);

        const etiquetaHex = document.createElement('div');
        etiquetaHex.className = 'etiqueta-hex';
        etiquetaHex.style.height = `${alturaBloque}px`;
        etiquetaHex.style.minHeight = `${alturaMinimaBloque}px`;
        etiquetaHex.style.fontSize = `${Math.max(8, alturaBloque/6)}px`;
        etiquetaHex.textContent = `0x${(particion.direccionInicio * 1024).toString(16).toUpperCase()}`;
        etiquetasHex.appendChild(etiquetaHex);
    });

    etiquetasMemoria.style.height = `${memoriaBox.style.height}`;
    etiquetasHex.style.height = `${memoriaBox.style.height}`;
}

// FUNCIÓN UNIFICADA: Mostrar información de memoria
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

    let html = '';
    
    if (memoriaManager.marcos) {
        // PAGINACIÓN
        const marcosLibres = memoriaManager.marcos.filter(m => !m.ocupado).length;
        const marcosTotales = memoriaManager.marcos.length;
        const memoriaUsada = memoriaManager.marcos.filter(m => m.ocupado).length * (memoriaManager.marcos[0]?.tamañoMarco || 0);
        
        html = `
            <ul>
                <li>Marcos libres: ${marcosLibres}/${marcosTotales}</li>
                <li>Memoria usada: ${memoriaUsada} KiB</li>
                <li>Tamaño marco: ${memoriaManager.marcos[0]?.tamañoMarco || 0} KiB</li>
            </ul>
        `;
    } else {
        // SEGMENTACIÓN Y OTROS
        const particionesLibres = memoriaManager.particiones.filter(p => !p.estado).length;
        
        // MEMORIA USADA: Sumar el tamaño REAL ocupado (segmentos o procesos)
        const memoriaUsada = memoriaManager.particiones
            .filter(p => p.estado)
            .reduce((total, p) => {
                if (p.segmento) {
                    // Segmentación: usar tamaño del segmento
                    return total + p.segmento.tamaño;
                } else {
                    // Otros: usar tamaño del proceso
                    return total + p.proceso.tamañoProceso;
                }
            }, 0);
        
        // FRAGMENTACIÓN INTERNA: Espacio asignado pero no utilizado
        const fragmentacionInterna = memoriaManager.particiones
            .filter(p => p.estado)
            .reduce((total, p) => {
                if (p.segmento) {
                    // Segmentación: diferencia entre tamaño partición y tamaño segmento
                    return total + (p.tamañoParticion - p.segmento.tamaño);
                } else {
                    // Otros: diferencia entre tamaño partición y tamaño proceso
                    return total + (p.tamañoParticion - p.proceso.tamañoProceso);
                }
            }, 0);

        html = `
            <ul>
                <li>Particiones libres: ${particionesLibres}</li>
                <li>Memoria usada: ${memoriaUsada} KiB</li>
                <li>Fragmentación interna: ${Math.max(0, fragmentacionInterna)} KiB</li>
                <li>Total particiones: ${memoriaManager.particiones.length}</li>
            </ul>
        `;
    }
    
    infoEleccion.innerHTML = html;
}

// FUNCIÓN UNIFICADA: Asignar proceso
function asignarProceso(procesoData) {
    if (!memoriaManager) {
        alert("Primero selecciona tipo de partición y algoritmo");
        return false;
    }
    
    try {
        const proceso = new Proceso(proximoPID++, procesoData.nombre, procesoData.tamano);
        
        // PARA TODOS los tipos de memoria, usar el tamaño real
        if (procesoData.segmentosConfig) {
            proceso.tablaSegmentos.forEach((seg, index) => {
                if (procesoData.segmentosConfig[index]) {
                    seg.tamaño = procesoData.segmentosConfig[index].tamaño;
                }
            });
            // Siempre recalcular el tamaño real
            proceso._tamañoProceso = proceso.tablaSegmentos.reduce((total, seg) => total + seg.tamaño, 0);
        }
        
        // Intentar añadir el proceso a la memoria
        const resultado = memoriaManager.añadirProceso(proceso);
        
        if (resultado !== false) { // Algunos métodos pueden retornar false explícitamente
            // Agregar a la lista de procesos para mostrar en la interfaz
            procesos.push(`${procesoData.nombre} (${proceso.tamañoProceso} KiB)`);
            refrescarVista();
            return true;
        } else {
            console.error("No se pudo asignar el proceso - memoriaManager.añadirProceso retornó false");
            return false;
        }
    } catch (error) {
        console.error("Error al asignar proceso:", error);
        alert(`Error al asignar proceso: ${error.message}`);
        return false;
    }
}

// FUNCIÓN UNIFICADA: Eliminar proceso
function eliminarProceso(pid) {
    if (!memoriaManager) {
        alert("Primero selecciona tipo de partición");
        return false;
    }
    
    const resultado = memoriaManager.eliminarProceso(pid);
    
    if (resultado) {
        // Filtrar procesos por PID
        procesos = procesos.filter(p => {
            const nombreProceso = p.split(' (')[0];
            if (memoriaManager.marcos) {
                const procesoEliminado = memoriaManager.marcos.find(
                    m => m.proceso && m.proceso.PID === pid && m.proceso.nombreProceso === nombreProceso
                );
                return !procesoEliminado;
            } else if (memoriaManager.particiones) {
                const procesoEliminado = memoriaManager.particiones.find(
                    p => p.proceso && p.proceso.PID === pid && p.proceso.nombreProceso === nombreProceso
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

// FUNCIÓN UNIFICADA: Actualizar lista para eliminación
function actualizarListaEliminacion() {
    const select = document.getElementById("proceso-eliminar");
    select.innerHTML = '';

    if (!memoriaManager) {
        select.innerHTML = '<option value="">No hay procesos</option>';
        return;
    }

    const procesosActivos = new Map();
    
    if (memoriaManager.marcos) {
        // PAGINACIÓN
        memoriaManager.marcos.forEach(marco => {
            if (marco.ocupado && marco.proceso && marco.proceso.nombreProceso !== 'SO') {
                const pid = marco.proceso.PID;
                if (!procesosActivos.has(pid)) {
                    procesosActivos.set(pid, marco.proceso);
                }
            }
        });
    } else if (memoriaManager.particiones) {
        // SEGMENTACIÓN
        memoriaManager.particiones.forEach(particion => {
            if (particion.estado && particion.proceso && particion.proceso.nombreProceso !== 'SO') {
                const pid = particion.proceso.PID;
                if (!procesosActivos.has(pid)) {
                    procesosActivos.set(pid, particion.proceso);
                }
            }
        });
    }

    if (procesosActivos.size === 0) {
        select.innerHTML = '<option value="">No hay procesos para eliminar</option>';
    } else {
        procesosActivos.forEach((proceso, pid) => {
            const option = document.createElement('option');
            option.value = pid;
            option.textContent = `${proceso.nombreProceso} (PID: ${pid}, ${proceso.tamañoProceso} KiB)`;
            select.appendChild(option);
        });
    }
}

// FUNCIÓN UNIFICADA: Mostrar tabla de proceso
function mostrarTablaProceso(pid) {
    const proceso = encontrarProcesoPorPID(pid);
    if (!proceso) return;
    
    document.getElementById('info-proceso-tabla').style.display = 'block';
    document.getElementById('nombre-proceso-tabla').textContent = proceso.nombreProceso;
    document.getElementById('pid-proceso-tabla').textContent = proceso.PID;
    document.getElementById('tamano-proceso-tabla').textContent = proceso.tamañoProceso + ' KiB';
    
    // DIFERENCIADO POR TIPO DE MEMORIA
    if (particionElegida === 'Paginación') {
        mostrarTablaPaginasProceso(pid);
    } else if (particionElegida === 'Segmentación Pura') {
        mostrarTablaSegmentos(proceso);
        mostrarMapaMemoriaProceso(proceso);
    }
}

// FUNCIÓN UNIFICADA: Encontrar proceso por PID
function encontrarProcesoPorPID(pid) {
    if (!memoriaManager) return null;
    
    if (memoriaManager.marcos) {
        for (let marco of memoriaManager.marcos) {
            if (marco.ocupado && marco.proceso && marco.proceso.PID === pid) {
                return marco.proceso;
            }
        }
    } else if (memoriaManager.particiones) {
        for (let particion of memoriaManager.particiones) {
            if (particion.estado && particion.proceso && particion.proceso.PID === pid) {
                return particion.proceso;
            }
        }
    }
    return null;
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


// Botones dinamicos

function inicializarBotonesProcesos() {
    PROGRAMAS_PREDEFINIDOS.forEach(programa => {
        const nuevoLi = document.createElement("li");

        // En inicializarBotonesProcesos(), actualiza el event listener:
        const botonProceso = document.createElement('button');
        botonProceso.textContent = programa.nombre;
        botonProceso.addEventListener('click', () => {
            if (asignarProceso(programa)) {
                console.log(`Proceso ${programa.nombre} asignado correctamente`);
            } else {
                alert(`No se pudo asignar el proceso ${programa.nombre} - No hay espacio suficiente`);
            }
        });

        const botonSegmentos = document.createElement('button');
        botonSegmentos.textContent = "Editar segmentos";
        botonSegmentos.addEventListener('click', () => {
            // Crear una instancia temporal SOLO para mostrar/editar, pero guardar en el original
            const procesoParaEditar = new Proceso(0, programa.nombre, programa.tamano);
            
            // Guardar referencia al programa original para poder actualizarlo
            abrirVentanaSegmentos(procesoParaEditar, programa);
        });

        // Botón para ver tabla (solo cuando el proceso esté cargado)
        const botonVerTabla = document.createElement('button');
        botonVerTabla.textContent = "Ver tabla";
        botonVerTabla.addEventListener('click', () => {
            // Buscar si el proceso ya está cargado
            const procesoCargado = encontrarProcesoPorNombre(programa.nombre);
            if (procesoCargado) {
                abrirVentanaTablasProcesos();
                // Seleccionar automáticamente este proceso
                setTimeout(() => {
                    const selector = document.getElementById('selector-proceso-tabla');
                    if (selector) {
                        selector.value = procesoCargado.PID;
                        mostrarTablaProceso(procesoCargado.PID);
                    }
                }, 100);
            } else {
                alert("El proceso debe estar cargado en memoria para ver su tabla");
            }
        });

        nuevoLi.appendChild(botonProceso);
        nuevoLi.appendChild(botonSegmentos);
        nuevoLi.appendChild(botonVerTabla);
        
        const menuProcesosPredeterminados = document.getElementById("menu-procesos");
        if (menuProcesosPredeterminados) {
            menuProcesosPredeterminados.appendChild(nuevoLi);
        }
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

function abrirVentanaSegmentos(procesoParaEditar, programaOriginal) {
    console.log("Proceso para editar:", procesoParaEditar);
    
    // Validación robusta
    if (!procesoParaEditar) {
        console.error("Proceso para editar es undefined");
        alert("Error: No se recibió un proceso válido");
        return;
    }

    if (!procesoParaEditar.tablaSegmentos || !Array.isArray(procesoParaEditar.tablaSegmentos)) {
        console.error("tablaSegmentos no existe o no es un array:", procesoParaEditar.tablaSegmentos);
        alert("Error: El proceso no tiene una tabla de segmentos válida");
        return;
    }

    const modal = document.getElementById("ventana-segmentos");
    const lista = document.getElementById("lista-segmentos");
    const titulo = document.getElementById("titulo-segmentos");

    if (!modal || !lista || !titulo) {
        console.error("No se encontraron elementos del DOM necesarios");
        return;
    }

    // Actualiza el título
    titulo.textContent = `Segmentos de ${procesoParaEditar.nombreProceso}`;

    // Limpia la lista anterior
    lista.innerHTML = "";

    // Crea los campos para modificar los tamaños - CON RESTRICCIONES
    procesoParaEditar.tablaSegmentos.forEach((seg, index) => {
        const divSeg = document.createElement("div");
        divSeg.classList.add("segmento-item");

        // Determinar si el segmento es editable basado en sus permisos
        const esEditable = !seg.permiso || seg.permiso.includes('W');
        const esSoloLectura = !esEditable;
        
        divSeg.innerHTML = `
        <label>${seg.nombre} ${esSoloLectura ? '(No modificable)' : ''}:</label>
        <input type="number" 
                value="${seg.tamaño}" 
                id="seg-${index}" 
                min="1"
                ${esSoloLectura ? 'readonly' : ''}
                style="${esSoloLectura ? 'background-color: #f0f0f0; color: #666;' : ''}">
        <small>Permisos: ${seg.permiso || 'RW'}</small>
        `;

        lista.appendChild(divSeg);
    });

    // Muestra la ventana
    modal.style.display = "block";

    // Botón guardar
    const botonGuardar = document.getElementById("guardar-segmentos");
    if (botonGuardar) {
        // Remover event listeners anteriores para evitar duplicados
        botonGuardar.replaceWith(botonGuardar.cloneNode(true));
        const nuevoBotonGuardar = document.getElementById("guardar-segmentos");
        
        nuevoBotonGuardar.onclick = function() {
            let total = 0;
            const nuevosSegmentos = [];
            
            procesoParaEditar.tablaSegmentos.forEach((seg, index) => {
                const input = document.getElementById(`seg-${index}`);
                if (input && !isNaN(parseInt(input.value))) {
                    const nuevoTam = parseInt(input.value);
                    
                    // VERIFICAR PERMISOS antes de permitir modificación
                    const esEditable = !seg.permiso || seg.permiso.includes('W');
                    
                    if (esEditable) {
                        nuevosSegmentos.push({
                            nombre: seg.nombre,
                            tamaño: nuevoTam,
                            permiso: seg.permiso
                        });
                        total += nuevoTam;
                    } else {
                        // Para segmentos no editables, mantener el tamaño original
                        nuevosSegmentos.push({
                            nombre: seg.nombre,
                            tamaño: seg.tamaño, // Mantener tamaño original
                            permiso: seg.permiso
                        });
                        total += seg.tamaño;
                        console.log(`Segmento ${seg.nombre} no es modificable (permisos: ${seg.permiso})`);
                    }
                }
            });

            // ACTUALIZAR EL PROGRAMA ORIGINAL con los nuevos tamaños
            if (programaOriginal) {
                programaOriginal.tamano = total;
                // Guardar la configuración de segmentos para uso futuro
                programaOriginal.segmentosConfig = nuevosSegmentos;
            }

            alert(`Segmentos actualizados para ${procesoParaEditar.nombreProceso}. Tamaño total: ${total} KiB\n\nNota: Los segmentos de solo lectura (Código) no se pueden modificar.`);
            modal.style.display = "none";
            
            console.log("Programa original actualizado:", programaOriginal);
        };
    }

    // Botón cerrar
    const botonCerrar = modal.querySelector('button[onclick]');
    if (botonCerrar) {
        botonCerrar.onclick = function() {
            modal.style.display = 'none';
        };
    }
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
