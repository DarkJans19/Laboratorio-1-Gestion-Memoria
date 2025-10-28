export class Particion {
    constructor(proceso, estado, tamañoParticion, direccionInicio, direccionFinal) {
        this.validarTamaño(tamañoParticion);
        this.validarDirecciones(direccionInicio, direccionFinal);
        
        this.proceso = proceso;
        this.estado = estado;
        this._tamañoParticion = tamañoParticion;
        this.direccionInicio = direccionInicio;
        this.direccionFinal = direccionFinal;

        this.segmento = null;
    }

    get tamañoParticion(){
        return this._tamañoParticion;
    }

    toString() {
        const procesoInfo = this.proceso ? 
            `Proceso: ${this.proceso.nombreProceso} (PID: ${this.proceso.PID})` : 
            'Proceso: Ninguno';
        
        const estadoTexto = this.estado ? 'Ocupada' : 'Libre';
        
        return `Particion [${estadoTexto}] - Tamaño: ${this.tamañoParticion} | ${procesoInfo} | Direcciones: ${this.direccionInicio}-${this.direccionFinal}`;
    }

    validarTamaño(tamaño) {
        if (tamaño <= 0) {
            throw new Error("El tamaño de la partición debe ser positivo");
        }
    }

    validarDirecciones(inicio, fin) {
        if (inicio < 0 || fin < 0) {
            throw new Error("Las direcciones no pueden ser negativas");
        }
        if (inicio > fin) {
            throw new Error("La dirección inicial no puede ser mayor que la final");
        }
    }

    // Métodos de la clase
    añadirProceso(proceso){
        this.proceso = proceso;
        this.estado = true;
    }

    eliminarProceso(){
        this.proceso = null;
        this.estado = false;
    }
}