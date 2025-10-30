import { Memoria } from './Memoria.js';

export class MemoriaPaginada extends Memoria {
    constructor(tamañoMemoria) {
        super(tamañoMemoria, null);
        
        this.tablasPaginas = new Map();
        this.marcos = [];
        this.inicializarMemoria();
    }

    inicializarMemoria() {
        const tamañoMarco = 512; // 0.5 MiB
        const numMarcos = 32;
        this.marcos = [];
        
        for (let i = 0; i < numMarcos; i++) {
            const marco = {
                id: i,
                tamañoMarco: tamañoMarco,
                tamañoParticion: tamañoMarco,
                direccionInicio: i * tamañoMarco,
                direccionFinal: (i * tamañoMarco) + tamañoMarco - 1,
                ocupado: false,
                estado: false,
                proceso: null,
                pagina: null,
                
                añadirProceso: function(proceso) {
                    this.ocupado = true;
                    this.estado = true;
                    this.proceso = proceso;
                },
                eliminarProceso: function() {
                    this.ocupado = false;
                    this.estado = false;
                    this.proceso = null;
                    this.pagina = null;
                },
                toString: function() {
                    if (this.ocupado && this.proceso) {
                        if (this.proceso.nombreProceso === "SO") {
                            return `MARCO ${this.id}: SO`;
                        }
                        return `MARCO ${this.id}: ${this.proceso.nombreProceso}${this.pagina ? '-Pag' + this.pagina.id : ''}`;
                    }
                    return `MARCO ${this.id}: Libre`;
                }
            };
            
            this.marcos.push(marco);
        }
        
        // SO ocupa primeros 4 marcos
        const procesoSO = { nombreProceso: "SO", PID: 0, tamañoProceso: 2048 };
        for (let i = 0; i < 4; i++) {
            this.marcos[i].añadirProceso(procesoSO);
            this.marcos[i].pagina = { id: i };
        }
        this.particiones = this.marcos;
    }

    añadirProceso(proceso) {
        const tamañoPagina = 512;
        const numPaginas = Math.ceil(proceso.tamañoProceso / tamañoPagina);
        
        let marcosAsignados = 0;
        
        for (let i = 0; i < numPaginas; i++) {
            const marcoLibre = this.marcos.find(marco => !marco.ocupado);
            
            if (marcoLibre) {
                marcoLibre.añadirProceso(proceso);
                marcoLibre.pagina = { id: i };
                marcosAsignados++;
            } else {
                break;
            }
        }
        
        if (marcosAsignados === 0) {
            throw new Error("No hay marcos libres disponibles");
        }
        
        return marcosAsignados > 0;
    }

    eliminarProceso(PID) {
        let eliminado = false;
        
        this.marcos.forEach(marco => {
            if (marco.proceso && marco.proceso.PID === PID) {
                marco.eliminarProceso();
                eliminado = true;
            }
        });
        
        return eliminado;
    }
}