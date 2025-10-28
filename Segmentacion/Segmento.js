class Segmento{
  constructor(id, nombreSegmento, direccionBase, tamañoSegmento, permiso){
    this.id = id;
    this.nombreSegmento = nombreSegmento;
    this.direccionBase = direccionBase;
    this.tamañoSegmento = tamañoSegmento;
    this.permiso = permiso; // R W X
  }

  traducirDireccion(desplazamiento) {
    if (desplazamiento < 0 || desplazamiento >= this.tamañoSegmento) {
      throw new Error(`Desplazamiento fuera de rango en el segmento ${this.nombreSegmento}`);
    }
    return this.baseSegmento + desplazamiento;
  }
}
