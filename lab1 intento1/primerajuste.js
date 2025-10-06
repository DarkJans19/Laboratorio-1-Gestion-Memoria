function primerAjusteDinamico(tamano) {
  for (let i = 0; i < memoria.length; i++) {
    if (!memoria[i].ocupado && memoria[i].tamano >= tamano) {
      return i;
    }
  }
  return -1;
}

function primerAjusteFijo(memoria, tamanoProceso) {
    for (const bloque of memoria) {
        if (bloque.tipo === 'particion' && !bloque.ocupado && bloque.tamano >= tamanoProceso) {
            return bloque;
        }
    }
    return null;
}