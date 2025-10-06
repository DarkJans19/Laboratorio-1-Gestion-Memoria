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
