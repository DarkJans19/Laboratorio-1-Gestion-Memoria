class MemoriaEstaticaFija extends Memoria{
    constructor(tamañoMemoria, estrategiaAlgoritmo){
        super(tamañoMemoria, estrategiaAlgoritmo);
        this.inicializarMemoria(tamañoMemoria);
    }

    inicializarMemoria(tamañoMemoria) {
    const tamañoParticion = tamañoMemoria / 16
    const tamaño_inicial = 2 * tamañoParticion;  // Tamaño inicial de la primera partición 
    const razon = 1 / 2;              // Reducción para cada nivel
    const niveles = 3;                // Cantidad de niveles de particiones
    const particionesPorNivel = 4;    // Número de particiones por nivel

    let posicionInicio = 0;
    let posicionFinal = tamaño_inicial - 1;

    // Genera los tamaños de partición
    for (let i = 0; i < niveles; i++) {
        const tamaño = tamaño_inicial * (razon ** i);
        for (let j = 0; j < particionesPorNivel; j++) {
            let particion = new Particion(null, false, tamaño, posicionInicio, posicionFinal)
            this.particiones.push(particion);
            posicionInicio = posicionFinal + 1;
            posicionFinal = posicionInicio + tamaño - 1;
        }
    }

    // Agrega un último nivel de tamaño igual al menor anterior
    const ultimoTamano = tamaño_inicial * (razon ** (niveles - 1));
    for (let j = 0; j < particionesPorNivel; j++) {
        let particion = new Particion(null, false, ultimoTamano, posicionInicio, posicionFinal)
        this.particiones.push(particion);
        posicionInicio = posicionFinal + 1;
        posicionFinal = posicionInicio + ultimoTamano - 1;
    }

    this.particiones = this.particiones.reverse();
    }
}