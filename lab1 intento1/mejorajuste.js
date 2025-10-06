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
