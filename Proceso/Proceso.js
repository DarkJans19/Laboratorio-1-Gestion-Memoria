export class Proceso {
    constructor(PID, nombreProceso, tamañoProceso) {
        this.PID = PID;
        this.nombreProceso = nombreProceso;
        this._tamañoProceso = tamañoProceso;
        // Inicializar segmentos por defecto al crearse
        this.segmentos = [
            { nombre: "BSS", tamaño: Math.floor(tamañoProceso * 0.1) },
            { nombre: "Código", tamaño: Math.floor(tamañoProceso * 0.3) },
            { nombre: "Datos", tamaño: Math.floor(tamañoProceso * 0.2) },
            { nombre: "Heap", tamaño: 64 },
            { nombre: "Stack", tamaño: 128 }
        ];
        this.baseActual = 0;
    }

    get tamañoProceso() {
        return this._tamañoProceso;
    }

    get tamañoReal() {
        return this.segmentos.reduce((total, seg) => total + seg.tamaño, 0);
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
