const b1 = document.getElementById("b1");
const b2 = document.getElementById("b2");
const b3 = document.getElementById("b3");
const b4 = document.getElementById("b4");

const menuParticion = document.getElementById("menu-particion");
const menuAlgoritmo = document.getElementById("menu-algoritmo");
const menuAnadirP = document.getElementById("menu-anadirproceso");
const menuEliminarP = document.getElementById("menu-eliminar-proceso");

const cerrarParticion = document.getElementById("cerrar-particion");
const cerrarAlgoritmo = document.getElementById("cerrar-algoritmo");
const cerrarAnadir = document.getElementById("cerrar-anadir");
const cerrarEliminar = document.getElementById("cerrar-eliminar");

b1.addEventListener("click", () => menuParticion.style.display = "flex");
b2.addEventListener("click", () => menuAlgoritmo.style.display = "flex");
b3.addEventListener("click", () => menuAnadirP.style.display = "flex");
b4.addEventListener("click", () => menuEliminarP.style.display = "flex");

cerrarParticion.addEventListener("click", () => menuParticion.style.display = "none");
cerrarAlgoritmo.addEventListener("click", () => menuAlgoritmo.style.display = "none");
cerrarAnadir.addEventListener("click", () => menuAnadirP.style.display = "none");
cerrarEliminar.addEventListener("click", () => menuEliminarP.style.display = "none");
