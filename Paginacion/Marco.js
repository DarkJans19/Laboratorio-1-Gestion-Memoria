export class Marco {
    constructor(id, tamañoMarco, direccionInicio) {
        this.id = id;
        this.tamañoMarco = tamañoMarco;
        this.direccionInicio = direccionInicio;
        this.direccionFinal = direccionInicio + tamañoMarco - 1;
        this.ocupado = false;
        this.proceso = null;
        this.pagina = null;
    }

    asignarPagina(proceso, pagina) {
        this.ocupado = true;
        this.proceso = proceso;
        this.pagina = pagina;
    }

    liberar() {
        this.ocupado = false;
        this.proceso = null;
        this.pagina = null;
    }

    obtenerInformacion() {
        return {
            numeroMarco: this.id,
            tamañoMarco: this.tamañoMarco,
            direccionInicio: this.direccionInicio,
            direccionFinal: this.direccionFinal,
            ocupado: this.ocupado,
            procesoAsignado: this.proceso?.nombreProceso ?? null,
            paginaAsignada: this.pagina?.id ?? null
        };
    }
}s