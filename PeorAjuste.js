class PeorAjuste extends EstrategiaAlgoritmo {
    buscarHueco(particiones, proceso) {
        let peorParticion = null;
        
        for (let particion of particiones) {
            // Verificar: partición libre Y tamaño suficiente
            if (!particion.estado && particion.tamañoParticion >= proceso.tamañoProceso) {
                
                // Si no tenemos peor partición o esta es peor (menos ajustada)
                if (!peorParticion || 
                    particion.tamañoParticion > peorParticion.tamañoParticion) {
                    peorParticion = particion;
                }
            }
        }
        return peorParticion;
    }
}