const MEMORIA_TOTAL_MiB = 16;
const MEMORIA_TOTAL_KiB = MEMORIA_TOTAL_MiB * 1024;
const TAMANO_PARTICION_MiB = 1;
const TAMANO_PARTICION_KiB = TAMANO_PARTICION_MiB * 1024;

const Notepad = new Proceso(
    1,
    "Notepad",
    225
);

const Word = new Proceso(
    2,
    "Word",
    289
);

const Excel = new Proceso(
    3,
    "Excel",
    309
);

const AutoCAD = new Proceso(
    4,
    "AutoCAD",
    436
);

const Calculadora = new Proceso(
    5,
    "Calculadora",
    206
);