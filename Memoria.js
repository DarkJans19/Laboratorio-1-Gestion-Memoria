class Memoria{
    constructor(tamañoMemoria, particiones, estrategiaParticion, estrategiaAlgoritmo){
        this.tamañoMemoria = tamañoMemoria;
        this.particiones = particiones;
        this.estrategiaAlgoritmo = estrategiaAlgoritmo;
        this.estrategiaParticion = estrategiaParticion;
    }

    listarParticiones(){
        for(let i = 0; i < this.particiones.length; i++)
            console.log(`[${i}] ${this.particiones[i].toString()}`);
    }

    añadirProceso(proceso){
        // particion hueco
        const hueco = this.estrategiaAlgoritmo.buscarHueco(this.particiones, proceso);
        if (hueco){
            hueco.añadirProceso(proceso);
        }
        else{
            console.error("No hay espacio suficiente para el proceso " + proceso.nombreProceso);
        }
    }

    eliminarProceso(PID){
        this.particiones.forEach(particion => {
            if(particion.proceso && particion.proceso.PID === PID){
                particion.eliminarProceso();
            }            
        });
    }
}