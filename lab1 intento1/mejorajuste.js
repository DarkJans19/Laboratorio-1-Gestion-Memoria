function mejorAjusteDinamico(tamano) {
  let mejor = -1;
  let mejorTamano = Infinity;
  memoria.forEach((b, i) => {
    if (!b.ocupado && b.tamano >= tamano && b.tamano < mejorTamano) {
      mejor = i;
      mejorTamano = b.tamano;
    }
  });
  return mejor;
}

function mejorAjusteFijo(particionesLibres, tamanoProceso) {
    return particionesLibres.reduce((mejor, actual) => {
        const sobranteMejor = mejor.tamano - tamanoProceso;
        const sobranteActual = actual.tamano - tamanoProceso;
        return sobranteActual < sobranteMejor ? actual : mejor;
    });
}