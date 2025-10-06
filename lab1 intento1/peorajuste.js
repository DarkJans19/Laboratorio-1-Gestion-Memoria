function peorAjusteDinamico(tamano) {
  let peor = -1;
  let peorTamano = -1;
  memoria.forEach((b, i) => {
    if (!b.ocupado && b.tamano >= tamano && b.tamano > peorTamano) {
      peor = i;
      peorTamano = b.tamano;
    }
  });
  return peor;
}

function peorAjusteFijo(particionesLibres, tamanoProceso) {
    return particionesLibres.reduce((peor, actual) => {
        const sobrantePeor = peor.tamano - tamanoProceso;
        const sobranteActual = actual.tamano - tamanoProceso;
        return sobranteActual > sobrantePeor ? actual : peor;
    });
}