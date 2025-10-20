class MejorAjuste extends EstrategiaAlgoritmo {
    buscarHueco(particiones, proceso) {
        let mejorParticion = null;
        
        for (let particion of particiones) {
            // Verificar: partición libre Y tamaño suficiente
            if (!particion.estado && particion.tamañoParticion >= proceso.tamañoProceso) {
                
                // Si no tenemos mejor partición o esta es mejor (más ajustada)
                if (!mejorParticion || 
                    particion.tamañoParticion < mejorParticion.tamañoParticion) {
                    mejorParticion = particion;
                }
            }
        }
        return mejorParticion;
    }
}