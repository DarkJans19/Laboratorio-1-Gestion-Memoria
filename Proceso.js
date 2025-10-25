export class Proceso{
    constructor (PID, nombreProceso, tamañoProceso){
        this.PID = PID;
        this.nombreProceso = nombreProceso;
        this._tamañoProceso = tamañoProceso;
    }

    get tamañoProceso(){
        return this._tamañoProceso;
    }
    
    set tamañoProceso(tamañoProceso){
        if (tamañoProceso > 0){
            this._tamañoProceso = tamañoProceso
        }
        else{
            throw new Error("El tamaño debe ser positivo.");
        }
    }
}
