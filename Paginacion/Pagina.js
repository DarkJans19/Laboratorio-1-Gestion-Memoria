export class Pagina {
    constructor(id, proceso, tamañoPaginaEstandar, tamañoReal) {
        this.id = id;
        this.proceso = proceso;
        this.tamañoPaginaEstandar = tamañoPaginaEstandar; 
        this.tamañoReal = tamañoReal; 
        this.marcoAsignado = null;
        this.cargada = false;
        this.fragmentacionInterna = this.tamañoPaginaEstandar - this.tamañoReal; 
    }

    asignarMarco(marco) {
        this.marcoAsignado = marco;
        this.cargada = true;
        marco.asignarPagina(this.proceso, this);
        
    }

    liberarMarco() {
        if (this.marcoAsignado) {
            this.marcoAsignado.liberar();
            this.marcoAsignado = null;
        }
        this.cargada = false;
    }

    obtenerInformacion() {
        return {
            numeroPagena: this.id,
            tamañoEstandar: this.tamañoPaginaEstandar,
            tamañoReal: this.tamañoReal,
            fragmentacionInterna: this.fragmentacionInterna,
            marcoAsignado: this.marcoAsignado?.id ?? null,
            cargada: this.cargada
        };
    }
}