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

  switch (particionElegida) {
    case 'Estática de tamaño fijo':
      return asignarProcesoEstaticaFija(proceso, algoritmoElegido);
    case 'Dinámica (sin compactación)':
      return asignarProcesoDinamicaSinCompactacion(proceso, algoritmoElegido);
    default:
      alert("Funcionalidad en desarrollo");
      return false;
  }
}

function eliminarProceso(nombreProceso) {
  if (!particionElegida) {
    alert("Primero selecciona tipo de partición");
    return false;
  }

  switch (particionElegida) {
    case 'Estática de tamaño fijo':
      return eliminarProcesoEstaticaFija(nombreProceso);
    case 'Dinámica (sin compactación)':
      return eliminarProcesoDinamicaSinCompactacion(nombreProceso);
    default:
      alert("Funcionalidad en desarrollo");
      return false;
  }
}

// EVENTOS DE MENÚ PRINCIPAL
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
      algoritmoElegido = null;
      tipoAlgoritmo.textContent = `Algoritmo: —`;
      alert("Particiones variables en desarrollo");
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

// Seleccionar algoritmo
document.querySelectorAll("#menu-algoritmo ul button").forEach(btn => {
  btn.addEventListener("click", () => {
    algoritmoElegido = btn.textContent;
    tipoAlgoritmo.textContent = `Algoritmo: ${algoritmoElegido}`;
    menuAlgoritmo.style.display = "none";
    refrescarVista();

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
  
  // Para particiones fijas, validar tamaño
  if (particionElegida === 'Estática de tamaño fijo' && tamano > TAMANO_PARTICION_KiB) {
    return alert(`El tamaño no puede ser mayor a ${TAMANO_PARTICION_KiB} KiB`);
  }

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