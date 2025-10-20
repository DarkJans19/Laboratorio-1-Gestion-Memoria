class MemoriaEstaticaFija extends Memoria{
    constructor(tamañoMemoria, estrategiaAlgoritmo){
        super(tamañoMemoria, estrategiaAlgoritmo);
        this.inicializarMemoria(tamañoMemoria);
    }

    inicializarMemoria(tamañoMemoria){
        const tamañoParticion = tamañoMemoria / 16;
        let posicionInicio = 0;
        let posicionFinal = tamañoParticion - 1;
        for(let i = 0; i < 16; i++){
            let particion = new Particion(null, false, tamañoParticion, posicionInicio, posicionFinal);
            this.particiones[i] = particion;
            posicionInicio = posicionFinal + 1;
            posicionFinal = posicionInicio + tamañoParticion - 1;
        }
    }
}