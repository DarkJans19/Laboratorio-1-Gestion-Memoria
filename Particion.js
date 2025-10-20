class Particion {
    constructor(proceso, estado, tamañoParticion, direccionInicio, direccionFinal) {
        this.validarTamaño(tamañoParticion);
        this.validarDirecciones(direccionInicio, direccionFinal);
        
        this.proceso = proceso;
        this.estado = estado;
        this._tamañoParticion = tamañoParticion;
        this.direccionInicio = direccionInicio;
        this.direccionFinal = direccionFinal;
    }

    toString() {
        const procesoInfo = this.proceso ? 
            `Proceso: ${this.proceso.nombreProceso} (PID: ${this.proceso.PID})` : 
            'Proceso: Ninguno';
        
        const estadoTexto = this.estado ? 'Ocupada' : 'Libre';
        
        return `Particion [${estadoTexto}] - Tamaño: ${this.tamañoParticion} | ${procesoInfo} | Direcciones: ${this.direccionInicio}-${this.direccionFinal}`;
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