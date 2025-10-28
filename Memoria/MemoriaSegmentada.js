import { Memoria } from './Memoria.js';
import { Particion } from '../Particion/Particion.js';

export class MemoriaSegmentada extends Memoria {
    constructor(tamañoMemoria, estrategiaAlgoritmo) {
        super(tamañoMemoria, estrategiaAlgoritmo);
        this.inicializarMemoria();
    }

    inicializarMemoria() {
        this.particiones = [
            new Particion(null, false, this.tamañoMemoria, 0, this.tamañoMemoria - 1)
        ];
    }

    añadirProceso(proceso) {
        console.log("Asignando proceso con segmentación:", proceso.nombreProceso);
        
        // Intentar asignar CADA SEGMENTO del proceso
        const segmentosAsignados = [];
        let todosAsignados = true;

        for (const segmento of proceso.tablaSegmentos) {
            const hueco = this.estrategiaAlgoritmo.buscarHueco(this.particiones, {
                tamañoProceso: segmento.tamaño
            });

            if (hueco) {
                // Asignar este segmento
                const indiceHueco = this.particiones.indexOf(hueco);
                const division = this.calcularLimites(hueco, { tamañoProceso: segmento.tamaño });
                const nuevasParticiones = this.crearParticiones(division, proceso, segmento);
                
                this.particiones.splice(indiceHueco, 1, ...nuevasParticiones);
                
                // La primera partición contiene el segmento
                const particionAsignada = nuevasParticiones[0];
                segmento.direccionFisica = particionAsignada.direccionInicio;
                segmento.particionAsignada = particionAsignada;
                
                segmentosAsignados.push(segmento);
                console.log(`Segmento ${segmento.nombre} asignado en ${segmento.direccionFisica}`);
            } else {
                console.log(`No hay hueco para segmento ${segmento.nombre}`);
                todosAsignados = false;
                
                // DESHACER asignaciones anteriores si falla algún segmento
                this.desasignarSegmentos(segmentosAsignados);
                break;
            }
        }

        if (todosAsignados) {
            console.log(`Proceso ${proceso.nombreProceso} completamente asignado`);
            return true;
        } else {
            console.log(`No se pudo asignar el proceso ${proceso.nombreProceso} - memoria insuficiente`);
            return false;
        }
    }

    desasignarSegmentos(segmentos) {
        segmentos.forEach(segmento => {
            if (segmento.particionAsignada) {
                segmento.particionAsignada.eliminarProceso();
                segmento.direccionFisica = null;
                segmento.particionAsignada = null;
            }
        });
        this.fusionarParticion();
    }

    eliminarProceso(PID) {
        let procesoEliminado = false;
        
        // Buscar todas las particiones que pertenecen a este proceso
        this.particiones.forEach(particion => {
            if (particion.proceso && particion.proceso.PID === PID) {
                // Limpiar referencia en la tabla de segmentos
                if (particion.segmento) {
                    particion.segmento.direccionFisica = null;
                    particion.segmento.particionAsignada = null;
                }
                particion.eliminarProceso();
                procesoEliminado = true;
            }
        });
        
        if (procesoEliminado) {
            this.fusionarParticion();
        }
        
        return procesoEliminado;
    }

    calcularLimites(hueco, segmento) {
        const inicioProceso = hueco.direccionInicio;
        const finalProceso = inicioProceso + segmento.tamañoProceso - 1;
        const inicioLibre = finalProceso + 1;
        const tamañoLibre = hueco.tamañoParticion - segmento.tamañoProceso;
        
        return {
            inicioProceso,
            finalProceso, 
            inicioLibre,
            tamañoLibre,
            finalLibre: hueco.direccionFinal
        };
    }

    crearParticiones(division, proceso, segmento) {
        const particionProceso = new Particion(
            proceso, 
            true, 
            segmento.tamaño, 
            division.inicioProceso, 
            division.finalProceso
        );
        
        // Guardar referencia al segmento en la partición
        particionProceso.segmento = segmento;
        
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
            return [particionProceso];
        }
    }

    fusionarParticion() {
        for(let i = 0; i < this.particiones.length - 1; i++) {
            if (!this.particiones[i].estado && !this.particiones[i+1].estado) {
                let particionFusionada = new Particion(
                    null, 
                    false, 
                    this.particiones[i].tamañoParticion + this.particiones[i+1].tamañoParticion,
                    this.particiones[i].direccionInicio, 
                    this.particiones[i+1].direccionFinal
                );
                this.particiones.splice(i, 2, particionFusionada);
                i--;
            }
        }
    }

    // Visualización especial para segmentación
    visualizarSegmentos() {
        const segmentos = [];
        this.particiones.forEach(particion => {
            if (particion.estado && particion.segmento) {
                segmentos.push({
                    proceso: particion.proceso.nombreProceso,
                    segmento: particion.segmento.nombre,
                    direccion: particion.direccionInicio,
                    tamaño: particion.tamañoParticion,
                    permiso: particion.segmento.permiso
                });
            }
        });
        return segmentos;
    }
}