class MemoriaDinamicaSinCompactacion extends Memoria{
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
        
        const particionLibre = new Particion(
            null, 
            false, 
            division.tamañoLibre, 
            division.inicioLibre, 
            division.finalLibre
        );
        
        return [particionProceso, particionLibre];
    }

    actualizarMemoria(indiceHueco, nuevasParticiones) {
        this.particiones.splice(indiceHueco, 1, ...nuevasParticiones);
        return true;
    }

    fusionarParticion(indice){
        let fusionable = false;
        if (indice >= 0 && (indice + 1) < this.particiones.length) {
            fusionable = !this.particiones[indice].estado && !this.particiones[indice + 1].estado;
        }
        
        if (fusionable) {
            const tamanoSiguiente = this.particiones[indice + 1].tamañoParticion;
            this.particiones[indice].tamañoParticion += tamanoSiguiente;
            this.particiones.splice(indice + 1, 1);
        }
        
        return fusionable;
    }
}