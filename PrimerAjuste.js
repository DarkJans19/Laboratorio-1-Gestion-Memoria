import { EstrategiaAlgoritmo } from './EstrategiaAlgoritmo.js';

export class PrimerAjuste extends EstrategiaAlgoritmo {
    buscarHueco(particiones, proceso) {
        for (let particion of particiones) {
            // Verificar: partición libre Y tamaño suficiente
            if (!particion.estado && particion.tamañoParticion >= proceso.tamañoProceso) {
                return particion
            }
        }
        return null;
    }
}