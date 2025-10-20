class MemoriaDinamicaConCompactacion extends Memoria{
    constructor(tamañoMemoria, estrategiaAlgoritmo){
        super(tamañoMemoria, estrategiaAlgoritmo)
    }

    inicializarMemoria(){
        // Una sola partición libre que ocupa toda la memoria
        this.particiones = [
            new Particion(null, false, tamañoMemoria, 0, tamañoMemoria - 1)
        ];
    }

    añadirProceso(Proceso){
        // particion hueco
        const hueco = this.estrategiaAlgoritmo.buscarHueco(this.particiones, proceso);
        if (hueco){
            hueco.añadirProceso(proceso);
        }

    }

    eliminarProceso(PID){

    }

    compactarParticion(){

    }

    recalcularPosicion(){
        
    }
}