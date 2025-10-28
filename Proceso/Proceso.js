export class Proceso {
  constructor(PID, nombreProceso, tamañoProceso) {
    this.PID = PID;
    this.nombreProceso = nombreProceso;
    this._tamañoProceso = tamañoProceso;
    this.segmentos = [];
    this.baseActual = 0;
  }

  get tamañoProceso() {
    return this._tamañoProceso;
  }

  set tamañoProceso(tamañoProceso) {
    if (tamañoProceso > 0) {
      this._tamañoProceso = tamañoProceso;
    } else {
      throw new Error("El tamaño debe ser positivo.");
    }
  }

  agregarSegmento(nombre, tamaño) {
    const nuevoSegmento = new Segmento(
      this.segmentos.length,
      nombre,
      this.baseActual,
      tamaño
    );
    this.segmentos.push(nuevoSegmento);
    this.baseActual += tamaño;
  }
}
