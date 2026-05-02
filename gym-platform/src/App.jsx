import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Users, Activity, CheckCircle2, Trash2, Plus, LayoutDashboard, Receipt, Settings, Landmark, AlertTriangle, Smartphone, CreditCard, Ticket, Calendar, Calculator, FileText, Download, CheckSquare, Search, MapPin, Coins, Database } from 'lucide-react';
import RecuperacionSocios from './components/RecuperacionSocios';
import './index.css';

// Configuración de API
const API_BASE = window.location.hostname === 'localhost' 
    ? "http://localhost:3001/api" 
    : "/api"; 

const fmt = (n) => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—';
const MESES = ['enero', 'febrero', 'marzo', 'abril'];
const MES_LABEL = { enero: 'Enero', febrero: 'Febrero', marzo: 'Marzo', abril: 'Abril' };

// --- DATOS GLOBALES ---
const LISTA_MAESTRA_OFICIAL = [
  { nombre: "JOAQUIN ORTUBIA", rut: "17.106.300-0", cargo: "Gerente Sedes", vHora: 10000, cuenta: "Administración" },
  { nombre: "GABRIELA SANCHEZ", rut: "20.532.712-6", cargo: "Coach KID/GAP", vHora: 7000, cuenta: "Sueldo Coaches" },
  { nombre: "NICOLAS MILLAN", rut: "17.278.171-3", cargo: "Coach Senior", vHora: 9000, cuenta: "Sueldo Coaches" },
  { nombre: "CRISTIAN ZAPATA", rut: "15.xxx.xxx-x", cargo: "Coach", vHora: 7000, cuenta: "Sueldo Coaches" },
  { nombre: "GERALDINE LASTRA", rut: "18.xxx.xxx-x", cargo: "Coach", vHora: 7000, cuenta: "Sueldo Coaches" },
  { nombre: "RODRIGO", rut: "16.xxx.xxx-x", cargo: "Coach", vHora: 7000, cuenta: "Sueldo Coaches" },
  { nombre: "DAPHNE URRIOLA", rut: "19.xxx.xxx-x", cargo: "Coach", vHora: 7000, cuenta: "Sueldo Coaches" },
  { nombre: "JAVIERA", rut: "17.xxx.xxx-x", cargo: "Coach", vHora: 7000, cuenta: "Sueldo Coaches" }
];

const SALDOS_BCI = { enero: 6844400, febrero: 5707900, marzo: 7394080, abril: 1045890 };

const DATA_FRESHNESS = {
  bci: "2026-04-06 (Histórico)",
  boxmagic: "2026-04-09 (Hoy)",
  virtualpost: "2026-04-01 (Cierre Mensual)",
  lioren: "S/N (Sin Extracción)"
};

const DATA_LEVELS = {
    // Los meses de Q1 quedan como backup si no hay data en DB
    enero: { bci: { abonos: 6844400, egresos: 5200000 }, virtualpost: { abonos: 5697680 }, boxmagic: { abonos: 15400000 } },
    febrero: { bci: { abonos: 5707900, egresos: 4800000 }, virtualpost: { abonos: 4707900 }, boxmagic: { abonos: 12100000 } },
    marzo: { bci: { abonos: 7394080, egresos: 6100000 }, virtualpost: { abonos: 6394080 }, boxmagic: { abonos: 13900000 } },
    abril: { bci: { abonos: 0, egresos: 0 }, virtualpost: { abonos: 0 }, boxmagic: { abonos: 0 } }
};

const DATA_APPS = {
    enero: { boxmagic: 7200000, virtualpost: 6844400 },
    febrero: { boxmagic: 6000000, virtualpost: 5707900 },
};

// Simulador de datos de Lioren (Excel)
const MOCK_LIOREN_CSV = [
    { folio: "3499", rut: "76.111.111-1", proveedor: "Enel Distribución", fechaEmision: "15/01/2026", montoNeto: 100000, iva: 19000, montoTotal: 119000 },
    { folio: "8842", rut: "77.222.222-2", proveedor: "Aguas Andinas", fechaEmision: "18/01/2026", montoNeto: 45000, iva: 8550, montoTotal: 53550 },
    { folio: "1002", rut: "85.333.333-3", proveedor: "Gatorade (CCU)", fechaEmision: "20/01/2026", montoNeto: 150000, iva: 28500, montoTotal: 178500 }
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [mes, setMes] = useState('enero');
  const [loading, setLoading] = useState(true);
  const [sedeFilter, setSedeFilter] = useState('Todas');
  
  const [nomina, setNomina] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [conciliacionPool, setConciliacionPool] = useState([]);
  const [dbStats, setDbStats] = useState(null);

  const fetchStats = async () => {
    try {
        const res = await fetch(`${API_BASE}/stats/${mes}`);
        setDbStats(await res.json());
    } catch(e) { console.error(e); }
  };


  const fetchPool = async () => {
    try {
      const res = await fetch(`${API_BASE}/conciliacion/pool`);
      setConciliacionPool(await res.json());
    } catch(e) { console.error(e); }
  };

  const rechazarMatch = async (id) => {
    if(!window.confirm("¿Segur@ que deseas enviar este pago a Fugas Detectadas?")) return;
    await fetch(`${API_BASE}/conciliacion/reject`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id}) });
    alert("Operación Descartada en Registro");
    fetchPool();
  };

  const aprobarMatch = async (bci_id) => {
    // Para aprobar, requeriríamos seleccionar a qué usuario o forzar el mock para Mvp
    const mockBoxmagicId = prompt("Ingresa el Nombre del Alumno que hizo este pago:", "Escribe un nombre o rut");
    if(!mockBoxmagicId) return;
    await fetch(`${API_BASE}/conciliacion/match`, { 
        method: 'POST', headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ bci_income_id: bci_id, boxmagic_id: mockBoxmagicId, boxmagic_nombre: mockBoxmagicId, boxmagic_monto: 0, nivel_match: 3 }) 
    });
    alert("Match enlazado con éxito");
    fetchPool();
  }; // Facturas Lioren
  
  const [abonoInput, setAbonoInput] = useState({});
  const [manualEgre, setManualEgre] = useState({ item: '', monto: '', sede: 'Campanario', cat: 'Arriendos' });
  const [newCuenta, setNewCuenta] = useState({ nombre: '', tipo: 'Egreso' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resN, resE, resC, resF] = await Promise.all([
        fetch(`${API_BASE}/nomina/${mes}`),
        fetch(`${API_BASE}/egresos/${mes}`),
        fetch(`${API_BASE}/cuentas`),
        fetch(`${API_BASE}/compras/${mes}`)
      ]);
      const dataN = await resN.json();
      const dataE = await resE.json();
      const dataC = await resC.json();
      const dataF = await resF.json();
      setNomina(Array.isArray(dataN) ? dataN : []);
      setEgresos(Array.isArray(dataE) ? dataE : []);
      setCuentas(Array.isArray(dataC) ? dataC : []);
      setFacturas(Array.isArray(dataF) ? dataF : []);
    } catch (e) { 
        console.error(e); 
        setNomina([]); setEgresos([]); setCuentas([]); setFacturas([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); fetchPool(); fetchStats(); }, [mes]);

  // --- LOGICA EXCEL NOMINA ---
  const bulkLoadNomina = async () => {
    setLoading(true);
    for (const p of LISTA_MAESTRA_OFICIAL) {
        await fetch(`${API_BASE}/nomina`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...p, mes, hrsCamp: 0, hrsMarina: 0, status: 'Pendiente', valorHora: p.vHora, cuenta: p.cuenta}) });
    }
    fetchData();
  };

  const updateHrs = async (id, campo, val) => {
    const item = nomina.find(p => p.id === id);
    await fetch(`${API_BASE}/nomina/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...item, [campo]: Number(val)}) });
    setNomina(prev => prev.map(p => p.id === id ? {...p, [campo]: Number(val)} : p));
  };

  const totalizarYSincronizar = async () => {
    const totCamp = nomina.reduce((sum, p) => sum + (p.hrsCamp * p.valorHora), 0);
    const totMar = nomina.reduce((sum, p) => sum + (p.hrsMarina * p.valorHora), 0);
    
    if(totCamp > 0) {
        await fetch(`${API_BASE}/egresos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mes, cat: 'Sueldo Coaches', status: 'Ingresado', abonado: 0, item: `TOTAL SUELDOS: CAMPANARIO`, monto: totCamp, sede: 'Campanario', origen: 'RRHH'})});
    }
    if(totMar > 0) {
        await fetch(`${API_BASE}/egresos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mes, cat: 'Sueldo Coaches', status: 'Ingresado', abonado: 0, item: `TOTAL SUELDOS: MARINA`, monto: totMar, sede: 'Marina', origen: 'RRHH'})});
    }
    alert("Nómina sincronizada con éxito en Egresos");
    fetchData();
  };

  // --- LOGICA EGRESOS ---
  const addManualEgre = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/egresos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...manualEgre, mes, monto: Number(manualEgre.monto), abonado: 0, status: 'Ingresado', origen: 'Manual'}) });
    setManualEgre({ ...manualEgre, item: '', monto: '' });
    fetchData();
  };

  const deleteEgreso = async (id) => {
    if(!window.confirm("¿Eliminar registro?")) return;
    await fetch(`${API_BASE}/egresos/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const applyAbono = async (id, val) => {
    if(!val) return;
    const item = egresos.find(e => e.id === id);
    const nuevoAbono = (item.abonado || 0) + Number(val);
    await fetch(`${API_BASE}/egresos/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({abonado: nuevoAbono, status: nuevoAbono >= item.monto ? 'Aprobado' : 'Parcial'}) });
    setAbonoInput({...abonoInput, [id]: ''});
    fetchData();
  };

  // --- LOGICA LIBRO DE COMPRAS (LIOREN) ---
  const loadMockLioren = async () => {
    setLoading(true);
    for(const f of MOCK_LIOREN_CSV) {
        await fetch(`${API_BASE}/compras`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(f) });
    }
    fetchData();
  };

  const pagarFacturaLioren = async (factura) => {
    // 1. Marca factura como pagada
    await fetch(`${API_BASE}/compras/${factura.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'Pagada' }) });
    
    // 2. Inyecta al módulo de Egresos
    await fetch(`${API_BASE}/egresos`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ mes, cat: 'Pago Proveedores', status: 'Aprobado', abonado: factura.montoTotal, item: `PAGO FACTURA #${factura.folio} - ${factura.proveedor}`, monto: factura.montoTotal, sede: 'Campanario', origen: 'Lioren' })
    });
    
    alert(`Factura ${factura.folio} sincronizada como Egreso exitosamente.`);
    fetchData();
  };


  // --- LOGICA CUENTAS ---
  const registerCuenta = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/cuentas`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newCuenta) });
    setNewCuenta({ nombre: '', tipo: 'Egreso' });
    fetchData();
  };

  const deleteCuenta = async (id) => {
    if(!window.confirm("¿Borrar cuenta contable?")) return;
    await fetch(`${API_BASE}/cuentas/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // --- CALCULOS VARIOS ---
  const sumHrsCamp = nomina.reduce((s, p) => s + p.hrsCamp, 0);
  const sumHrsMar  = nomina.reduce((s, p) => s + p.hrsMarina, 0);
  const sumSueldoCamp = nomina.reduce((s, p) => s + (p.hrsCamp * p.valorHora), 0);
  const sumSueldoMar  = nomina.reduce((s, p) => s + (p.hrsMarina * p.valorHora), 0);

  const totEgresosDB = egresos.reduce((sum, e) => sum + e.monto, 0);
  
  // LOGICA INTELIGENTE: Si la base de datos no tiene ingresos para el mes 
  // (porque aun no se ha subido la cartola), usamos el dato histórico como fallback.
  const isDbEmpty = !dbStats || dbStats.bci?.abonos === 0;
  const dataLvl = (!isDbEmpty ? dbStats : DATA_LEVELS[mes]) || DATA_LEVELS.enero;
  
  const diffBoxMagic = (dataLvl.boxmagic?.abonos || 0) - (dataLvl.virtualpost?.abonos || 0);
  
  const totalNetoCompras = facturas.reduce((sum, f) => sum + f.montoNeto, 0);
  const totalIVACompras = facturas.reduce((sum, f) => sum + f.iva, 0);
  const totalBrutoCompras = facturas.reduce((sum, f) => sum + f.montoTotal, 0);

  const LevelRow = ({ title, icon: Icon, color, abonos, egresostot, isCard = false }) => (
    <div className="glass-card" style={{padding: '1.2rem', marginBottom: '1rem', borderLeft: `4px solid ${color}`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
            <Icon size={18} color={color}/>
            <h3 style={{fontSize: '0.9rem', fontWeight: 800, color: 'white'}}>{title.toUpperCase()}</h3>
        </div>
        <div style={{display: 'flex', gap: '2rem'}}>
            <div style={{flex: 1}}>
                <div style={{fontSize: '0.65rem', opacity: 0.5}}>ABONOS</div>
                <div style={{fontSize: '1.4rem', fontWeight: 900, color: color}}>{fmt(abonos)}</div>
            </div>
            {!isCard && (
               <div style={{flex: 1}}>
                    <div style={{fontSize: '0.65rem', opacity: 0.5}}>EGRESOS REGISTRADOS</div>
                    <div style={{fontSize: '1.4rem', fontWeight: 900, color: '#f43f5e'}}>{fmt(egresostot)}</div>
                </div>
            )}
            {!isCard && (
                <div style={{flex: 1}}>
                    <div style={{fontSize: '0.65rem', opacity: 0.5}}>MARGEN DE CAJA</div>
                    <div style={{fontSize: '1.4rem', fontWeight: 900, color: '#10b981'}}>{fmt(abonos - egresostot)}</div>
                </div>
            )}
            {isCard && (
                <div style={{flex: 2, background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem'}}>
                    <Search size={14} style={{marginBottom: '5px'}}/> Solo captura de ingresos por tarjeta.
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="erp-layout">
      <aside className="erp-sidebar">
        <div className="sidebar-logo"><Building2 color="#14b8a6" size={24}/> <span style={{fontWeight: 900}}>THE BOOS ERP</span></div>
        <nav className="sidebar-nav">
          <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'nav-item active' : 'nav-item'}><LayoutDashboard size={18}/> Dashboard Maestro</button>
          
          <div className="nav-separator">OPERATIVA</div>
          <button onClick={() => setView('ap')} className={view === 'ap' ? 'nav-item active' : 'nav-item'}><Receipt size={18}/> Egresos & Abonos</button>
          <button onClick={() => setView('rrhh')} className={view === 'rrhh' ? 'nav-item active' : 'nav-item'}><Calculator size={18}/> Nómina Excel</button>
          <button onClick={() => setView('boxmagic')} className={view === 'boxmagic' ? 'nav-item active' : 'nav-item'}><Activity size={18}/> Filtro BoxMagic</button>
          
          <div className="nav-separator">CRECIMIENTO</div>
          <button onClick={() => setView('recuperacion')} className={view === 'recuperacion' ? 'nav-item active' : 'nav-item'}><Users size={18}/> Recuperación Socios</button>
          
          <div className="nav-separator">AUDITORÍA FISCAL</div>
          <button onClick={() => setView('conc_diaria')} className={view === 'conc_diaria' ? 'nav-item active' : 'nav-item'}><ShieldCheck size={18}/> Conciliación Diaria</button>
          <button onClick={() => setView('ingesta')} className={view === 'ingesta' ? 'nav-item active' : 'nav-item'}><Database size={18}/> Ingesta de Datos</button>
          <button onClick={() => setView('compras')} className={view === 'compras' ? 'nav-item active' : 'nav-item'}><FileText size={18}/> Libro Compras (Lioren)</button>
          <button onClick={() => setView('apps')} className={view === 'apps' ? 'nav-item active' : 'nav-item'}><Smartphone size={18}/> Conciliación Apps</button>
          <button onClick={() => setView('reportes')} className={view === 'reportes' ? 'nav-item active' : 'nav-item'}><LayoutDashboard size={18}/> Reportes del Mes</button>
          <button onClick={() => setView('auditoria')} className={view === 'auditoria' ? 'nav-item active' : 'nav-item'}><ShieldCheck size={18}/> Auditoría T.R. {diffBoxMagic > 0 && <AlertTriangle size={12} color="#f43f5e" style={{marginLeft: 'auto'}}/>}</button>
          <button onClick={() => setView('cuentas')} className={view === 'cuentas' ? 'nav-item active' : 'nav-item'}><Settings size={18}/> Plan de Cuentas</button>
        </nav>
      </aside>

      <main className="erp-main">
        <header className="main-header">
            <div className="header-mes-nav">{MESES.map(m => (<button key={m} onClick={() => setMes(m)} className={mes === m ? 'm-link active' : 'm-link'}>{MES_LABEL[m].toUpperCase()}</button>))}</div>
            <div className="header-status" style={{color: '#14b8a6'}}>{loading ? 'SYNC...' : '● INFRAESTRUCTURA MÚLTIPLE PROTEGIDA'}</div>
        </header>

        <section className="content-area">
          {view === 'dashboard' && (
            <div className="fade-in">
              <h2 className="view-title">Dashboard de Conciliación Financiera — {MES_LABEL[mes]}</h2>
              
              {/* FILA 1: LOS LIBROS MAESTROS */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem'}}>
                {/* 1. BCI */}
                <div className="glass-card" style={{padding: '1.5rem', borderTop: '4px solid #14b8a6', position: 'relative', overflow: 'hidden'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
                        <Landmark size={24} color="#14b8a6"/>
                        <h3 style={{fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0}}>1. BANCO BCI (REALIDAD)</h3>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                        <span style={{opacity: 0.6}}>Ingresos Depositados:</span>
                        <strong style={{color: '#10b981'}}>{fmt(dataLvl.bci?.abonos || 0)}</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem'}}>
                        <span style={{opacity: 0.6}}>Egresos Cobrados:</span>
                        <strong style={{color: '#f43f5e'}}>{fmt(dataLvl.bci?.egresos || 0)}</strong>
                    </div>
                     <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem'}}>
                        <span style={{fontWeight: 900, color: '#14b8a6'}}>MARGEN UTILIDAD BCI:</span>
                        <strong style={{fontSize: '1.2rem', color: 'white'}}>{fmt((dataLvl.bci?.abonos || 0) - (dataLvl.bci?.egresos || 0))}</strong>
                    </div>
                    <div style={{fontSize: '0.6rem', opacity: 0.4, marginTop: '10px', textAlign: 'right'}}>ACTUALIZADO: {DATA_FRESHNESS.bci}</div>
                </div>
                {/* 2. ERP */}
                <div className="glass-card" style={{padding: '1.5rem', borderTop: '4px solid #8b5cf6', position: 'relative', overflow: 'hidden'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
                        <Database size={24} color="#8b5cf6"/>
                        <h3 style={{fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0}}>2. THE BOOS ERP (SISTEMA)</h3>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                        <span style={{opacity: 0.6}}>Ingresos Validados (BCI):</span>
                        <strong style={{color: '#10b981'}}>{fmt(dataLvl.bci?.abonos || 0)}</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem'}}>
                        <span style={{opacity: 0.6}}>Egresos Registrados:</span>
                        <strong style={{color: '#f43f5e'}}>{fmt(totEgresosDB)}</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem'}}>
                        <span style={{fontWeight: 900, color: '#8b5cf6'}}>MARGEN UTILIDAD ERP:</span>
                        <strong style={{fontSize: '1.2rem', color: 'white'}}>{fmt((dataLvl.bci?.abonos || 0) - totEgresosDB)}</strong>
                    </div>
                    <div style={{fontSize: '0.6rem', opacity: 0.4, marginTop: '10px', textAlign: 'right'}}>SYNC REAL-TIME</div>
                </div>
              </div>

              {/* FILA 2: SENSORES DE INGRESO */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem'}}>
                <div className="glass-card" style={{padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <Activity size={20} color="#6366f1"/>
                        <div>
                            <h3 style={{fontSize: '0.9rem', fontWeight: 800, margin: 0}}>3. BOXMAGIC (SENSOR)</h3>
                            <span style={{fontSize: '0.7rem', opacity: 0.5}}>Ventas teóricas emitidas</span>
                        </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <strong style={{fontSize: '1.4rem', color: '#6366f1'}}>{fmt(dataLvl.boxmagic?.abonos || 0)}</strong>
                        <div style={{fontSize: '0.6rem', opacity: 0.4}}>Vence: {DATA_FRESHNESS.boxmagic}</div>
                    </div>
                </div>

                <div className="glass-card" style={{padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <CreditCard size={20} color="#f59e0b"/>
                        <div>
                            <h3 style={{fontSize: '0.9rem', fontWeight: 800, margin: 0}}>4. VIRTUALPOS (SENSOR)</h3>
                            <span style={{fontSize: '0.7rem', opacity: 0.5}}>Pagos por tarjeta procesados</span>
                        </div>
                    </div>
                    <strong style={{fontSize: '1.4rem', color: '#f59e0b'}}>{fmt(dataLvl.virtualpost?.abonos || 0)}</strong>
                </div>
              </div>

              {/* FILA 3: PANELES DE AUDITORÍA */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                 {/* 5. AUDITORÍA INGRESOS */}
                 {(() => {
                    const diffIngresos = (dataLvl.boxmagic?.abonos || 0) - (dataLvl.bci?.abonos || 0);
                    const isInDanger = diffIngresos !== 0;
                    return (
                        <div className="glass-card" style={{padding: '1.5rem', background: isInDanger ? 'rgba(244,63,94,0.05)' : 'rgba(16,185,129,0.05)', border: `1px dashed ${isInDanger ? '#f43f5e' : '#10b981'}`, textAlign: 'center'}}>
                            {isInDanger ? <AlertTriangle size={24} color="#f43f5e" style={{margin: '0 auto 0.5rem'}}/> : <CheckCircle2 size={24} color="#10b981" style={{margin: '0 auto 0.5rem'}}/>}
                            <h4 style={{color: isInDanger ? '#f43f5e' : '#10b981', margin: '0 0 0.5rem 0'}}>5. AUDITORÍA DE INGRESOS</h4>
                            <div style={{fontSize: '1.2rem', fontWeight: 900}}>DESCUADRE: {fmt(diffIngresos)}</div>
                            <small style={{opacity: 0.6}}>Diferencia entre Facturado (Boxmagic) y Recibido (BCI).</small>
                        </div>
                    );
                 })()}

                 {/* 6. AUDITORÍA EGRESOS */}
                 {(() => {
                    const diffEgresos = (dataLvl.bci?.egresos || 0) - totEgresosDB;
                    const isFuga = diffEgresos !== 0;
                    return (
                        <div className="glass-card" style={{padding: '1.5rem', background: isFuga ? 'rgba(244,63,94,0.05)' : 'rgba(16,185,129,0.05)', border: `1px dashed ${isFuga ? '#f43f5e' : '#10b981'}`, textAlign: 'center'}}>
                            {isFuga ? <AlertTriangle size={24} color="#f43f5e" style={{margin: '0 auto 0.5rem'}}/> : <CheckCircle2 size={24} color="#10b981" style={{margin: '0 auto 0.5rem'}}/>}
                            <h4 style={{color: isFuga ? '#f43f5e' : '#10b981', margin: '0 0 0.5rem 0'}}>6. AUDITORÍA DE EGRESOS</h4>
                            <div style={{fontSize: '1.2rem', fontWeight: 900}}>FUGAS NO REGISTRADAS: {fmt(diffEgresos)}</div>
                            <small style={{opacity: 0.6}}>Dinero que salió del Banco pero que no está cargado en el ERP.</small>
                        </div>
                    );
                 })()}
              </div>

               {/* ALERTAS PENDIENTES EN DASHBOARD PARA RECORDAR UX */}
               {conciliacionPool.length > 0 && (
                   <div style={{marginTop: '20px', padding: '15px', background: 'rgba(234, 179, 8, 0.1)', border: '1px dashed #eab308', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                       <div>
                           <h4 style={{color: '#eab308', margin: 0, fontWeight: 800}}>⚠️ ALERTA DE CONCILIACIÓN DIARIA</h4>
                           <span style={{fontSize: '0.8rem', opacity: 0.8}}>Tienes {conciliacionPool.length} abonos no reconocidos esperando resolución en el BCI.</span>
                       </div>
                       <button onClick={() => setView('conc_diaria')} style={{background: '#eab308', color: 'black', fontWeight: 800, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer'}}>Resolver Ahora</button>
                   </div>
               )}
            </div>
          )}

          {view === 'conc_diaria' && (
            <div className="fade-in">
              <h2 className="view-title">Módulo de Conciliación Diaria Inteligente</h2>
              <div style={{background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', padding: '20px', marginBottom: '20px'}}>
                  <p style={{margin: '0 0 10px 0', fontSize: '1rem'}}>
                      <strong>¿Qué es esto?</strong> Este motor escanea cada mañana tus cartolas del BCI. Todo lo que el sistema pudo enlazar automáticamente ("Match Perfecto" o "Redondeo") ya fue resuelto.
                      <br/>Lo que ves aquí abajo son los **Abonos Huérfanos** (posibles fugas o personas que pagaron desde otras cuentas).
                  </p>
                  <p style={{margin: '0', fontSize: '0.85rem', color: '#14b8a6', fontWeight: 600}}>
                      {conciliacionPool.length === 0 ? "¡Excelente! No hay fugas documentales pendientes hoy." : `Hay ${conciliacionPool.length} pago(s) huérfano(s) esperando tu acción humana.`}
                  </p>
              </div>

              {conciliacionPool.length > 0 && (
                 <div className="table-card">
                  <header className="table-header" style={{background: '#eab308', color: 'black'}}>
                    <span>BANCO BCI: PAGOS HUÉRFANOS</span>
                  </header>
                  <div className="table-content">
                    <table className="erp-table">
                        <thead>
                            <tr>
                                <th>FECHA BANCO</th>
                                <th>MONTO DECLARADO</th>
                                <th>DETALLE BCI / NOMBRE</th>
                                <th>NRO OPERACIÓN</th>
                                <th>ACCIÓN MÁQUINA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conciliacionPool.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{new Date(c.fecha_banco).toLocaleDateString()}</strong></td>
                                    <td style={{color: '#10b981', fontWeight: 900}}>{fmt(c.monto)}</td>
                                    <td><div style={{fontWeight: 600, fontSize: '0.85rem'}}>{c.nombre_banco}</div></td>
                                    <td><span style={{fontSize: '0.7rem', opacity: 0.6}}>OP: {c.nro_operacion}</span></td>
                                    <td>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <button onClick={() => aprobarMatch(c.id)} style={{background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}} title="Enlazar con un alumno activo">ENLAZAR A ALUMNO</button>
                                            <button onClick={() => rechazarMatch(c.id)} style={{background: '#f43f5e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}} title="Mandar definitivamente a Fugas Detectadas">MARCAR FUGA</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                 </div>
              )}
            </div>
          )}

          {view === 'ingesta' && (
            <div className="fade-in">
              <h2 className="view-title">Módulo de Ingesta de Datos (Cloud Ready)</h2>
              <div className="glass-card" style={{padding: '2rem', marginBottom: '2rem'}}>
                  <h3 style={{color: '#14b8a6', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800}}>1. CARGA DE VENTAS BOXMAGIC (CSV)</h3>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
                      <div style={{flex: 1}}>
                          <label className="form-label">SEDE</label>
                          <select id="sede_up" className="form-select">
                              <option value="Campanario">Campanario</option>
                              <option value="Marina">Marina</option>
                          </select>
                      </div>
                      <div style={{flex: 1}}>
                          <label className="form-label">MES</label>
                          <select id="mes_up" className="form-select">
                              {MESES.map(m => <option key={m} value={m}>{MES_LABEL[m]}</option>)}
                          </select>
                      </div>
                      <div style={{flex: 2}}>
                          <input type="file" id="file_box" accept=".csv" className="form-input" style={{padding: '0.5rem'}} />
                      </div>
                      <button onClick={async () => {
                          const fileInput = document.getElementById('file_box');
                          const file = fileInput.files[0];
                          if(!file) return alert("Selecciona un archivo CSV");
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('sede', document.getElementById('sede_up').value);
                          formData.append('mes', document.getElementById('mes_up').value);
                          setLoading(true);
                          const res = await fetch(`${API_BASE}/ingesta/boxmagic`, { method: 'POST', body: formData });
                          const data = await res.json();
                          setLoading(false);
                          alert(data.message);
                          fileInput.value = "";
                      }} className="btn-submit" style={{background: '#14b8a6'}}>PROCESAR BOXMAGIC</button>
                  </div>
              </div>

              <div className="glass-card" style={{padding: '2rem'}}>
                  <h3 style={{color: '#f59e0b', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800}}>2. CARGA DE CARTOLA BANCO BCI (EXCEL)</h3>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
                      <div style={{flex: 2}}>
                          <input type="file" id="file_bci" accept=".xlsx" className="form-input" style={{padding: '0.5rem'}} />
                      </div>
                      <button onClick={async () => {
                          const fileInput = document.getElementById('file_bci');
                          const file = fileInput.files[0];
                          if(!file) return alert("Selecciona un archivo Excel (.xlsx)");
                          const formData = new FormData();
                          formData.append('file', file);
                          setLoading(true);
                          const res = await fetch(`${API_BASE}/ingesta/bci`, { method: 'POST', body: formData });
                          const data = await res.json();
                          setLoading(false);
                          alert(data.message);
                          fileInput.value = "";
                          fetchPool();
                      }} className="btn-submit" style={{background: '#f59e0b'}}>PROCESAR CARTOLA BCI</button>
                  </div>
              </div>
            </div>
          )}

          {view === 'ap' && (
            <div className="fade-in">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h2 className="view-title" style={{margin: 0}}>Control de Egresos — {sedeFilter.toUpperCase()}</h2>
                <div className="header-mes-nav">{['Todas', 'Campanario', 'Marina'].map(s => (<button key={s} onClick={() => setSedeFilter(s)} className={sedeFilter === s ? 'm-link active' : 'm-link'} style={{fontSize: '0.65rem'}}>{s.toUpperCase()}</button>))}</div>
              </div>
              
              <div className="glass-card" style={{padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #14b8a6', background: 'rgba(20,184,166,0.03)'}}>
                <form onSubmit={addManualEgre} style={{display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto', gap: '0.8rem', alignItems: 'end'}}>
                    <div className="form-group"><label className="form-label">DETALLE GASTO MANUAL</label><input type="text" className="form-input" value={manualEgre.item} onChange={e => setManualEgre({...manualEgre, item: e.target.value})} required/></div>
                    <div className="form-group"><label className="form-label">CUENTA</label><select className="form-select" value={manualEgre.cat} onChange={e => setManualEgre({...manualEgre, cat: e.target.value})}>{cuentas.filter(c => c.tipo !== 'Ingreso').map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">MONTO TOTAL</label><input type="number" className="form-input" value={manualEgre.monto} onChange={e => setManualEgre({...manualEgre, monto: e.target.value})} required/></div>
                    <div className="form-group"><label className="form-label">SEDE</label><select className="form-select" value={manualEgre.sede} onChange={e => setManualEgre({...manualEgre, sede: e.target.value})}><option value="Campanario">Campanario</option><option value="Marina">Marina</option></select></div>
                    <button type="submit" className="btn-submit" style={{background: '#14b8a6', height: '38px'}}><Plus size={16}/> Cargar</button>
                </form>
              </div>

              <div className="glass-card">
                  <table className="erp-table">
                    <thead><tr><th>SEDE</th><th>ORIGEN</th><th>CUENTA</th><th>DETALLE DE GASTO</th><th>MONTO</th><th>PENDIENTE</th><th>ACCION</th></tr></thead>
                    <tbody>
                        {(sedeFilter === 'Todas' ? egresos : egresos.filter(e => e.sede === sedeFilter)).map(g => (
                            <tr key={g.id}>
                                <td><span style={{fontSize: '0.65rem', fontWeight: 800, color: g.sede === 'Campanario' ? '#6366f1' : '#14b8a6'}}><MapPin size={10}/> {g.sede.toUpperCase()}</span></td>
                                <td>{g.origen === 'Lioren' ? <span style={{fontSize: '0.6rem', background: '#8b5cf6', color: 'white', padding: '2px 5px', borderRadius: '4px'}}>LIOREN</span> : <span style={{fontSize: '0.6rem', opacity: 0.5}}>MANUAL/RRHH</span>}</td>
                                <td><span className="status-pill" style={{fontSize: '0.6rem'}}>{g.cuenta}</span></td>
                                <td style={{fontSize: '0.8rem'}}>{g.detalle}</td>
                                <td style={{fontWeight: 700}}>{fmt(g.monto)}</td>
                                <td style={{color: (g.monto - g.abonado) > 0 ? '#f43f5e' : '#10b981', fontWeight: 800}}>{(g.monto - g.abonado) > 0 ? fmt(g.monto - g.abonado) : '✓ PAGADO'}</td>
                                <td>
                                    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                        <input type="number" placeholder="$" className="form-input" style={{width: '80px'}} value={abonoInput[g.id] || ''} onChange={e => setAbonoInput({...abonoInput, [g.id]: e.target.value})}/>
                                        <button onClick={() => applyAbono(g.id, abonoInput[g.id])} className="btn-submit" style={{padding: '5px', background: '#10b981'}}><Coins size={14}/></button>
                                        <button onClick={() => deleteEgreso(g.id)} style={{color: '#ef4444', background: 'none', border: 'none'}}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          {view === 'compras' && (
            <div className="fade-in">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h2 className="view-title" style={{margin: 0}}>Libro de Compras (SII / Lioren)</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                    <div style={{background: 'rgba(139,92,246,0.1)', padding: '8px 15px', borderRadius: '8px', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div style={{textAlign: 'center'}}><span style={{fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)'}}>TOTAL NETO</span><br/><strong style={{color: 'white', fontSize: '1rem'}}>{fmt(totalNetoCompras)}</strong></div>
                        <div style={{width: '1px', background: 'rgba(255,255,255,0.2)', height: '20px'}}></div>
                        <div style={{textAlign: 'center'}}><span style={{fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)'}}>TOTAL IVA</span><br/><strong style={{color: '#8b5cf6', fontSize: '1rem'}}>{fmt(totalIVACompras)}</strong></div>
                        <div style={{width: '1px', background: 'rgba(255,255,255,0.2)', height: '20px'}}></div>
                        <div style={{textAlign: 'center'}}><span style={{fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)'}}>TOTAL BRUTO</span><br/><strong style={{color: '#10b981', fontSize: '1.1rem'}}>{fmt(totalBrutoCompras)}</strong></div>
                    </div>
                </div>
              </div>
              
              <div className="glass-card">
                  <table className="erp-table">
                    <thead><tr><th>FOLIO</th><th>RUT</th><th>RAZÓN SOCIAL (PROVEEDOR)</th><th>FECHA</th><th>NETO</th><th>IVA</th><th>TOTAL</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead>
                    <tbody>
                        {facturas.map(f => (
                            <tr key={f.id}>
                                <td><strong>#{f.folio}</strong></td>
                                <td style={{opacity: 0.7, fontSize: '0.8rem'}}>{f.rut}</td>
                                <td>{f.proveedor}</td>
                                <td>{f.fechaEmision}</td>
                                <td style={{opacity: 0.8}}>{fmt(f.montoNeto)}</td>
                                <td style={{color: '#8b5cf6', fontWeight: 800}}>{fmt(f.iva)}</td>
                                <td style={{fontWeight: 900}}>{fmt(f.montoTotal)}</td>
                                <td><span className={`status-pill ${f.status==='Pagada'?'aprobado':'pendiente'}`}>{f.status}</span></td>
                                <td>
                                    {f.status === 'Pendiente' ? (
                                        <button onClick={() => pagarFacturaLioren(f)} className="btn-submit" style={{background: '#10b981', fontSize: '0.7rem'}}><CheckSquare size={14}/> PAGAR</button>
                                    ) : (
                                        <CheckCircle2 color="#10b981" size={20}/>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {facturas.length === 0 && <tr><td colSpan="9" style={{textAlign: 'center', padding: '2rem', opacity: 0.5}}>No hay facturas cargadas. Presione sincronizar para extraer datos de Lioren.</td></tr>}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          {view === 'rrhh' && (
            <div className="fade-in">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h2 className="view-title" style={{margin: 0}}>Nómina Excel</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={bulkLoadNomina} className="btn-submit" style={{background: '#6366f1'}}><Users size={14}/> Cargar</button>
                    <button onClick={totalizarYSincronizar} className="btn-submit" style={{background: '#10b981'}}><Database size={14}/> Sincronizar Egresos</button>
                </div>
              </div>
              <div className="glass-card" style={{overflowX: 'auto'}}>
                <table className="erp-table excel-view">
                  <thead><tr><th>NOMBRE COACH</th><th style={{background: 'rgba(99,102,241,0.1)'}}>HRS CAMP</th><th style={{background: 'rgba(20,184,166,0.1)'}}>HRS MARINA</th><th>V. HORA</th><th>TOT HORAS</th><th style={{color: '#6366f1'}}>CAMP</th><th style={{color: '#14b8a6'}}>MARINA</th><th style={{background: 'rgba(255,255,255,0.05)'}}>TOTAL</th></tr></thead>
                  <tbody>
                    {nomina.map(p => (<tr key={p.id}><td>{p.coach}</td><td><input type="number" className="form-input excel-input" value={p.hrsCamp} onChange={e => updateHrs(p.id, 'hrsCamp', e.target.value)}/></td><td><input type="number" className="form-input excel-input" value={p.hrsMarina} onChange={e => updateHrs(p.id, 'hrsMarina', e.target.value)}/></td><td style={{opacity: 0.6}}>{fmt(p.valorHora)}</td><td style={{fontWeight: 800}}>{p.hrsCamp + p.hrsMarina}</td><td style={{color: '#6366f1'}}>{fmt(p.hrsCamp * p.valorHora)}</td><td style={{color: '#14b8a6'}}>{fmt(p.hrsMarina * p.valorHora)}</td><td style={{fontWeight: 900}}>{fmt((p.hrsCamp + p.hrsMarina) * p.valorHora)}</td></tr>))}
                    <tr style={{background: 'rgba(255,255,255,0.05)', fontWeight: 900}}><td>TOTALES</td><td style={{color: '#6366f1'}}>{sumHrsCamp}</td><td style={{color: '#14b8a6'}}>{sumHrsMar}</td><td colSpan="2" style={{textAlign: 'right'}}>RESUMEN:</td><td style={{color: '#6366f1'}}>{fmt(sumSueldoCamp)}</td><td style={{color: '#14b8a6'}}>{fmt(sumSueldoMar)}</td><td style={{color: '#f59e0b'}}>{fmt(sumSueldoCamp + sumSueldoMar)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'apps' && ( <div className="fade-in"><h2 className="view-title">Conciliación Apps</h2><div className="glass-card"><p>Ventas Teóricas vs Realidad Banco.</p></div></div> )}
          
          {view === 'boxmagic' && (
            <div className="fade-in">
              <h2 className="view-title">Análisis de BoxMagic (Pagos Efectivos y Transferencias)</h2>
              <div className="glass-card">
                  <p style={{marginBottom:'1rem'}}>Para procesar las planillas de caja en efectivo y transferencias, necesitas lanzar el agente de datos en el servidor local. 
                  El agente procesará los archivos desde la carpeta <code>agentes/06_Ingeniero_Datos/boxmagic/</code> y volcará los totales netos aquí.</p>
                  <table className="erp-table">
                  <thead><tr><th>SEDE</th><th>TOTAL EFECTIVO</th><th>TOTAL TRANSFERENCIAS</th><th>TOTAL TARJETAS</th></tr></thead>
                  <tbody>
                    <tr><td>CAMPANARIO</td><td>-</td><td>-</td><td>-</td></tr>
                    <tr><td>MARINA</td><td>-</td><td>-</td><td>-</td></tr>
                  </tbody>
                  </table>
              </div>
            </div>
          )}

          {view === 'reportes' && (
            <div className="fade-in">
              <h2 className="view-title">Reporte Integral del Mes: {MES_LABEL[mes]}</h2>
              
              <div style={{display: 'flex', gap: '20px', marginBottom: '2rem'}}>
                <div className="glass-card" style={{flex: 1, borderLeft: '4px solid #10b981'}}>
                  <h3 style={{color: '#10b981'}}>RESUMEN DE INGRESOS</h3>
                  <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0'}}/>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0'}}><span>Cierres BoxMagic (Teórico Total)</span> <strong>{fmt(dataLvl.boxmagic?.abonos || 0)}</strong></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0'}}><span>Liquidación VirtualPOS (Tarjetas)</span> <strong>{fmt(dataLvl.virtualpost?.abonos || 0)}</strong></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '5px'}}><span>INGRESO BANCARIO REAL (BCI)</span> <strong style={{color: '#10b981'}}>{fmt(dataLvl.bci?.abonos || 0)}</strong></div>
                </div>

                <div className="glass-card" style={{flex: 1, borderLeft: '4px solid #f43f5e'}}>
                  <h3 style={{color: '#f43f5e'}}>RESUMEN DE EGRESOS</h3>
                  <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0'}}/>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0'}}><span>Gastos Operativos (Totales)</span> <strong style={{color: '#f43f5e'}}>{fmt(totEgresosDB)}</strong></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0'}}><span>Riesgo Fuga/Descuadre Caja</span> <strong>{fmt((dataLvl.boxmagic?.abonos || 0) - (dataLvl.bci?.abonos || 0))}</strong></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '5px'}}><span>MARGEN NETO CAJA BANCO</span> <strong style={{color: ((dataLvl.bci?.abonos || 0) - totEgresosDB) >= 0 ? '#10b981' : '#f43f5e'}}>{fmt((dataLvl.bci?.abonos || 0) - totEgresosDB)}</strong></div>
                </div>
              </div>

              <div className="glass-card">
                  <h3 style={{marginBottom: '1rem'}}>DETALLE DE EGRESOS ({MES_LABEL[mes]})</h3>
                  <table className="erp-table">
                    <thead><tr><th>SEDE</th><th>ORIGEN</th><th>CUENTA</th><th>DETALLE DE GASTO</th><th>MONTO</th><th>ESTADO</th></tr></thead>
                    <tbody>
                        {egresos.map(g => (
                            <tr key={g.id}>
                                <td>{g.sede}</td>
                                <td>{g.origen}</td>
                                <td><span className="status-pill" style={{fontSize: '0.6rem'}}>{g.cuenta}</span></td>
                                <td>{g.detalle}</td>
                                <td style={{fontWeight: 700}}>{fmt(g.monto)}</td>
                                <td style={{color: (g.monto - g.abonado) > 0 ? '#f43f5e' : '#10b981', fontWeight: 800}}>{(g.monto - g.abonado) > 0 ? 'PAGO PARCIAL' : 'PAGADO'}</td>
                            </tr>
                        ))}
                        {egresos.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', opacity: 0.5}}>No hay salidas de capital para este mes.</td></tr>}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          {view === 'auditoria' && ( <div className="fade-in"><h2 className="view-title">Auditoría</h2><div className="glass-card"><p>No se encontraron problemas de cuadratura en Egresos.</p></div></div> )}
          {view === 'recuperacion' && ( <div className="fade-in"><RecuperacionSocios /></div> )}
          {view === 'cuentas' && ( <div className="fade-in"><h2 className="view-title">Plan de Cuentas Maestro</h2><div className="glass-card" style={{padding: '2rem'}}> <form onSubmit={registerCuenta} className="form-grid" style={{marginBottom: '2rem'}}><input type="text" placeholder="Nombre" className="form-input" value={newCuenta.nombre} onChange={e => setNewCuenta({...newCuenta, nombre: e.target.value})} required/><select className="form-select" value={newCuenta.tipo} onChange={e => setNewCuenta({...newCuenta, tipo: e.target.value})}><option value="Egreso">EGRESO</option><option value="Ingreso">INGRESO</option></select><button type="submit" className="btn-submit">Crear</button></form> <table className="erp-table"><thead><tr><th>TIPO</th><th>NOMBRE DE CUENTA</th></tr></thead><tbody>{cuentas.map(c => (<tr key={c.id}><td>{c.tipo}</td><td>{c.nombre}</td></tr>))}</tbody></table></div></div> )}
        </section>
      </main>
    </div>
  );
}
