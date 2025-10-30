export class Proceso {
    constructor(PID, nombreProceso, tamañoProceso) {
        this.PID = PID;
        this.nombreProceso = nombreProceso;
        this._tamañoProceso = tamañoProceso;
        
        // TABLA DE SEGMENTOS del proceso
        this.tablaSegmentos = [];
        this.baseActual = 0;
        
        // Inicializar segmentos por defecto
        this.inicializarSegmentos();
    }

    inicializarSegmentos() {
        // Limpiar segmentos existentes
        this.tablaSegmentos = [];
        
        // Crear segmentos con tamaños proporcionales
        let tamañoTotalSegmentos = 0;
        const segmentosConfig = [
            { nombre: "BSS", tamaño: Math.floor(this._tamañoProceso * 0.1) },
            { nombre: "Código", tamaño: Math.floor(this._tamañoProceso * 0.3) },
            { nombre: "Datos", tamaño: Math.floor(this._tamañoProceso * 0.2) },
            { nombre: "Heap", tamaño: 64 },
            { nombre: "Stack", tamaño: 128 }
        ];
        
        segmentosConfig.forEach(config => {
            tamañoTotalSegmentos += config.tamaño;
        });
        
        // Ajustar el tamaño del proceso al real
        this._tamañoProceso = tamañoTotalSegmentos;
        
        let direccionBase = 0;
        segmentosConfig.forEach((config, index) => {
            if (config.tamaño > 0) {
                this.tablaSegmentos.push({
                    id: index,
                    nombre: config.nombre,
                    direccionBase: direccionBase, // Dirección LÓGICA dentro del proceso
                    tamaño: config.tamaño,
                    direccionFisica: null, // Se asignará cuando se cargue en memoria
                    particionAsignada: null,
                    permiso: this.obtenerPermisosSegmento(config.nombre)
                });
                direccionBase += config.tamaño;
            }
        });
    }

    obtenerPermisosSegmento(nombre) {
        const permisos = {
            "Código": "RX",
            "Datos": "RW",
            "BSS": "RW", 
            "Heap": "RW",
            "Stack": "RW"
        };
        return permisos[nombre] || "RW";
    }

    get tamañoProceso() {
        return this._tamañoProceso;
    }

    get tamañoReal() {
        return this.tablaSegmentos.reduce((total, seg) => total + seg.tamaño, 0);
    }

    // Traducir dirección lógica a física
    traducirDireccion(segmentoId, desplazamiento) {
        const segmento = this.tablaSegmentos[segmentoId];
        if (!segmento) {
            throw new Error(`Segmento ${segmentoId} no existe`);
        }
        
        if (desplazamiento < 0 || desplazamiento >= segmento.tamaño) {
            throw new Error(`Desplazamiento fuera de rango en segmento ${segmento.nombre}`);
        }
        
        if (!segmento.direccionFisica) {
            throw new Error(`Segmento ${segmento.nombre} no cargado en memoria`);
        }
        
        return segmento.direccionFisica + desplazamiento;
    }

    // Actualizar segmentos cuando cambia el tamaño
    actualizarSegmentos(nuevosSegmentos) {
        nuevosSegmentos.forEach((nuevoSeg, index) => {
            if (this.tablaSegmentos[index]) {
                this.tablaSegmentos[index].tamaño = nuevoSeg.tamaño;
            }
        });
        
        // Recalcular tamaño total
        this._tamañoProceso = this.tablaSegmentos.reduce((total, seg) => total + seg.tamaño, 0);
    }
}