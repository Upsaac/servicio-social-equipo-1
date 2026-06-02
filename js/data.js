/* ─────────────────────────────────────────
   Fuente central de datos — Huella Solidaria
   Todos los valores de stats se calculan desde aquí.
───────────────────────────────────────── */

const ODS_LIST = [
  { num: 1,  nombre: 'Fin de la pobreza',                       color: '#E5243B' },
  { num: 2,  nombre: 'Hambre cero',                             color: '#DDA63A' },
  { num: 3,  nombre: 'Salud y bienestar',                       color: '#4C9F38' },
  { num: 4,  nombre: 'Educación de calidad',                    color: '#C5192D' },
  { num: 5,  nombre: 'Igualdad de género',                      color: '#FF3A21' },
  { num: 6,  nombre: 'Agua limpia y saneamiento',               color: '#26BDE2' },
  { num: 7,  nombre: 'Energía asequible y no contaminante',     color: '#FCC30B' },
  { num: 8,  nombre: 'Trabajo decente y crecimiento económico', color: '#A21942' },
  { num: 9,  nombre: 'Industria, innovación e infraestructura', color: '#FD6925' },
  { num: 10, nombre: 'Reducción de las desigualdades',          color: '#DD1367' },
  { num: 11, nombre: 'Ciudades y comunidades sostenibles',      color: '#FD9D24' },
  { num: 12, nombre: 'Producción y consumo responsables',       color: '#BF8B2E' },
  { num: 13, nombre: 'Acción por el clima',                     color: '#3F7E44' },
  { num: 14, nombre: 'Vida submarina',                          color: '#0A97D9' },
  { num: 15, nombre: 'Vida de ecosistemas terrestres',          color: '#56C02B' },
  { num: 16, nombre: 'Paz, justicia e instituciones sólidas',   color: '#00689D' },
  { num: 17, nombre: 'Alianzas para lograr los objetivos',      color: '#19486A' },
];

const HS_PROYECTOS = [
  { nombre: 'Selelios',                       ods: 4,  lider: 'Víctor Ortiz',   ubicacion: 'Puebla, Puebla',   zona: 'Puebla',   beneficiarios: 186, desempeno: 55 },
  { nombre: 'Alfabetización Digital Rural',   ods: 4,  lider: 'Carlos Ramírez', ubicacion: 'Puebla, Puebla',   zona: 'Puebla',   beneficiarios: 180, desempeno: 70 },
  { nombre: 'Salud Preventiva Comunitaria',   ods: 3,  lider: 'Ana Torres',     ubicacion: 'Cholula, Puebla',  zona: 'Cholula',  beneficiarios: 450, desempeno: 92 },
  { nombre: 'Huertos Urbanos Comunitarios',   ods: 2,  lider: 'Luis Pérez',     ubicacion: 'Tehuacan, Puebla', zona: 'Tehuacan', beneficiarios: 120, desempeno: 60 },
  { nombre: 'Brigadas de Salud Infantil',     ods: 3,  lider: 'María López',    ubicacion: 'Puebla, Puebla',   zona: 'Puebla',   beneficiarios: 310, desempeno: 78 },
  { nombre: 'Escuela al Campo',               ods: 1,  lider: 'Jorge Herrera',  ubicacion: 'Cholula, Puebla',  zona: 'Cholula',  beneficiarios: 90,  desempeno: 45 },
  { nombre: 'Red de Compostaje',              ods: 12, lider: 'Sofía Ruiz',     ubicacion: 'Puebla, Puebla',   zona: 'Puebla',   beneficiarios: 55,  desempeno: 83 },
  { nombre: 'Talleres de Oficios',            ods: 8,  lider: 'Ricardo Vega',   ubicacion: 'Cholula, Puebla',  zona: 'Cholula',  beneficiarios: 40,  desempeno: 50 },
  { nombre: 'Clínica Móvil Comunitaria',      ods: 3,  lider: 'Elena Soto',     ubicacion: 'Tehuacan, Puebla', zona: 'Tehuacan', beneficiarios: 95,  desempeno: 88 },
  { nombre: 'Biblioteca Digital Comunitaria', ods: 10, lider: 'Pablo Flores',   ubicacion: 'Cholula, Puebla',  zona: 'Cholula',  beneficiarios: 70,  desempeno: 65 },
  { nombre: 'Limpieza de Ríos',               ods: 14, lider: 'Carmen Díaz',    ubicacion: 'Puebla, Puebla',   zona: 'Puebla',   beneficiarios: 30,  desempeno: 72 },
  { nombre: 'Nutrición Escolar',              ods: 2,  lider: 'Roberto Gil',    ubicacion: 'Puebla, Puebla',   zona: 'Puebla',   beneficiarios: 42,  desempeno: 91 },
  { nombre: 'Código para Todos',              ods: 9,  lider: 'Daniela Mora',   ubicacion: 'Cholula, Puebla',  zona: 'Cholula',  beneficiarios: 25,  desempeno: 58 },
  { nombre: 'Reforestación Comunitaria',      ods: 15, lider: 'Adrián Cruz',    ubicacion: 'Tehuacan, Puebla', zona: 'Tehuacan', beneficiarios: 202, desempeno: 80 },
];

/* ── Stats derivados automáticamente ── */
const HS_STATS = (function () {
  const total        = HS_PROYECTOS.length;
  const beneficiarios = HS_PROYECTOS.reduce((s, p) => s + p.beneficiarios, 0);
  const zonas        = new Set(HS_PROYECTOS.map(p => p.zona)).size;

  return {
    totalProyectos:      total,
    totalBeneficiarios:  beneficiarios,
    lideresActivos:      16,
    zonasIntervencion:   zonas,
    actividades:         67,
    beneficiariosHombres: 865,
    beneficiariosMujeres: 830,
  };
})();
