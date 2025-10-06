function primerAjusteDinamico(tamano) {
  for (let i = 0; i < memoria.length; i++) {
    if (!memoria[i].ocupado && memoria[i].tamano >= tamano) {
      return i;
    }
  }
  return -1;
}

function primerAjuste(espaciosLibres, tamanoProceso) {
  for (let i = 0; i < espaciosLibres.length; i++) {
    if (espaciosLibres[i].tamano >= tamanoProceso) {
      return {
        encontrado: true,
        indice: i,
        espacio: espaciosLibres[i]
      };
    }
  }
  return { encontrado: false };
}