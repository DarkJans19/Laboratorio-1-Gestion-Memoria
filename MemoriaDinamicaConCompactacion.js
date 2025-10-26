import { Memoria } from './Memoria.js'
import { Particion } from "./Particion.js";

export class MemoriaDinamicaConCompactacion extends Memoria{
    constructor(tamañoMemoria, estrategiaAlgoritmo){
        super(tamañoMemoria, estrategiaAlgoritmo)
    }

    inicializarMemoria(){
        this.particiones = [
            new Particion(null, false, this.tamañoMemoria, 0, this.tamañoMemoria - 1)
        ];
    }

    añadirProceso(proceso){
        const hueco = this.estrategiaAlgoritmo.buscarHueco(this.particiones, proceso);
        if (!hueco) return false;
        
        // 1. Encuentra la posición del hueco
        const indiceHueco = this.particiones.indexOf(hueco);
        
        // 2. se calcula la nueva división de las particiones
        const division = this.calcularLimites(hueco, proceso);
        
        // 3. Se crean las nuevas particiones
        const nuevasParticiones = this.crearParticiones(division, proceso);
        
        // 4. Se actualiza la memoria
        return this.actualizarMemoria(indiceHueco, nuevasParticiones);
    }

    eliminarProceso(PID){
        const indice = this.particiones.findIndex(p => p.proceso && p.proceso.PID === PID);
        if (indice === -1) return false;
        
        this.particiones[indice].eliminarProceso();
        this.compactarMemoria();
        this.fusionarParticion();
        return true;
    }

    calcularLimites(hueco, proceso) {
        const inicioProceso = hueco.direccionInicio;
        const finalProceso = inicioProceso + proceso.tamañoProceso - 1;
        const inicioLibre = finalProceso + 1;
        const tamañoLibre = hueco.tamañoParticion - proceso.tamañoProceso;
        
        return {
            inicioProceso,
            finalProceso, 
            inicioLibre,
            tamañoLibre,
            finalLibre: hueco.direccionFinal
        };
    }

    crearParticiones(division, proceso) {
        const particionProceso = new Particion(
            proceso, 
            true, 
            proceso.tamañoProceso, 
            division.inicioProceso, 
            division.finalProceso
        );
        
        // SOLO crear partición libre si hay espacio sobrante
        if (division.tamañoLibre > 0) {
            const particionLibre = new Particion(
                null, 
                false, 
                division.tamañoLibre, 
                division.inicioLibre, 
                division.finalLibre
            );
            return [particionProceso, particionLibre];
        } else {
            // Si no hay espacio libre, retornar solo el proceso
            return [particionProceso];
        }
    }

    actualizarMemoria(indiceHueco, nuevasParticiones) {
        this.particiones.splice(indiceHueco, 1, ...nuevasParticiones);
        return true;
    }

    fusionarParticion(){
        for(let i = 0; i < this.particiones.length - 1; i++){
            if (this.particiones[i].estado == false && this.particiones[i+1].estado == false){
                let particionFusionada = new Particion(null, false, this.particiones[i].tamañoParticion + this.particiones[i+1].tamañoParticion,this.particiones[i].direccionInicio, this.particiones[i+1].direccionFinal);
                this.particiones.splice(i, 2, particionFusionada);
                i--; // Con esto se valida nuevamente la posicion
            }
        }
    }

    compactarMemoria(){
        for(let i = 0; i < this.particiones.length - 1; i++){
            if (this.particiones[i].estado == false && this.particiones[i+1].estado == true){
                // espacio ocupado
                let particionCompactada = new Particion(
                    this.particiones[i+1].proceso, 
                    true, 
                    this.particiones[i+1].tamañoParticion,
                    this.particiones[i].direccionInicio,
                    this.particiones[i].direccionInicio + this.particiones[i+1].tamañoParticion - 1);
                // espacio liberado
                let particionLiberada = new Particion(
                    null,
                    false,
                    this.particiones[i].tamañoParticion,
                    particionCompactada.direccionInicio + particionCompactada.tamañoParticion,
                    particionCompactada.direccionFinal + this.particiones[i].tamañoParticion
                );
                this.particiones.splice(i, 2, particionCompactada, particionLiberada);
                i--; // Con esto se valida nuevamente la posicion
            }
        }
    }
}