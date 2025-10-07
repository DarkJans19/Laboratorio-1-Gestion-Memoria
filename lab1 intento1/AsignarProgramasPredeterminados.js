function asignarProgramasPredeterminados() {
    let programasAsignados = 0;
    
    PROGRAMAS_PREDEFINIDOS.forEach(programa => {
        if (programasAsignados < 5) {
            const proceso = { nombre: programa.nombre, tamano: programa.tamano };
            const particionesLibres = memoria.filter(bloque => 
                bloque.tipo === 'particion' && !bloque.ocupado
            );
            
            if (particionesLibres.length > 0 && proceso.tamano <= TAMANO_PARTICION_KiB) {
                const particion = particionesLibres[0];
                particion.ocupado = true;
                particion.proceso = proceso;
                particion.fragmentacionInterna = TAMANO_PARTICION_KiB - proceso.tamano;
                procesos.push(`${programa.nombre} (${programa.tamano} KiB)`);
                programasAsignados++;
            }
        }
    });
    actualizarVisualizacionMemoria();
    actualizarListaProcesos();
}