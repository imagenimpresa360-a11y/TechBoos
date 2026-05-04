import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Building2, ShieldCheck, Users, Activity, CheckCircle2, Trash2, Plus, LayoutDashboard, Receipt, Settings, Landmark, AlertTriangle, Smartphone, CreditCard, Ticket, Calendar, Calculator, FileText, Download, CheckSquare, Search, MapPin, Coins, Database } from 'lucide-react';
import RecuperacionSocios from './components/RecuperacionSocios';
import PaginaPago from './components/PaginaPago';
import './index.css';

// Configuración de API
const API_BASE = window.location.hostname === 'localhost' 
    ? "http://localhost:3001/api" 
    : "/api"; 

const fmt = (n) => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—';
const MESES = ['enero', 'febrero', 'marzo', 'abril'];
const MES_LABEL = { enero: 'Enero', febrero: 'Febrero', marzo: 'Marzo', abril: 'Abril' };

// ... (Rest of global data exactly as before)
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
const DATA_FRESHNESS = { bci: "2026-04-06 (Histórico)", boxmagic: "2026-04-09 (Hoy)", virtualpost: "2026-04-01 (Cierre Mensual)", lioren: "S/N (Sin Extracción)" };
const DATA_LEVELS = {
    enero: { bci: { abonos: 6844400, egresos: 5200000 }, virtualpost: { abonos: 5697680 }, boxmagic: { abonos: 15400000 } },
    febrero: { bci: { abonos: 5707900, egresos: 4800000 }, virtualpost: { abonos: 4707900 }, boxmagic: { abonos: 12100000 } },
    marzo: { bci: { abonos: 7394080, egresos: 6100000 }, virtualpost: { abonos: 6394080 }, boxmagic: { abonos: 13900000 } },
    abril: { bci: { abonos: 0, egresos: 0 }, virtualpost: { abonos: 0 }, boxmagic: { abonos: 0 } }
};

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

  const fetchStats = async () => { try { const res = await fetch(`${API_BASE}/stats/${mes}`); setDbStats(await res.json()); } catch(e) { console.error(e); } };
  const fetchPool = async () => { try { const res = await fetch(`${API_BASE}/conciliacion/pool`); setConciliacionPool(await res.json()); } catch(e) { console.error(e); } };
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resN, resE, resC, resF] = await Promise.all([
        fetch(`${API_BASE}/nomina/${mes}`), fetch(`${API_BASE}/egresos/${mes}`), fetch(`${API_BASE}/cuentas`), fetch(`${API_BASE}/compras/${mes}`)
      ]);
      const [dataN, dataE, dataC, dataF] = await Promise.all([resN.json(), resE.json(), resC.json(), resF.json()]);
      setNomina(Array.isArray(dataN) ? dataN : []); setEgresos(Array.isArray(dataE) ? dataE : []); setCuentas(Array.isArray(dataC) ? dataC : []); setFacturas(Array.isArray(dataF) ? dataF : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); fetchPool(); fetchStats(); }, [mes]);

  const addManualEgre = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/egresos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...manualEgre, mes, monto: Number(manualEgre.monto), abonado: 0, status: 'Ingresado', origen: 'Manual'}) });
    setManualEgre({ ...manualEgre, item: '', monto: '' }); fetchData();
  };

  const deleteEgreso = async (id) => { if(!window.confirm("¿Eliminar registro?")) return; await fetch(`${API_BASE}/egresos/${id}`, { method: 'DELETE' }); fetchData(); };
  const applyAbono = async (id, val) => {
    if(!val) return; const item = egresos.find(e => e.id === id); const nuevoAbono = (item.abonado || 0) + Number(val);
    await fetch(`${API_BASE}/egresos/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({abonado: nuevoAbono, status: nuevoAbono >= item.monto ? 'Aprobado' : 'Parcial'}) });
    setAbonoInput({...abonoInput, [id]: ''}); fetchData();
  };

  const [abonoInput, setAbonoInput] = useState({});
  const [manualEgre, setManualEgre] = useState({ item: '', monto: '', sede: 'Campanario', cat: 'Arriendos' });
  const [newCuenta, setNewCuenta] = useState({ nombre: '', tipo: 'Egreso' });

  const totEgresosDB = egresos.reduce((sum, e) => sum + e.monto, 0);
  const isDbEmpty = !dbStats || dbStats.bci?.abonos === 0;
  const dataLvl = (!isDbEmpty ? dbStats : DATA_LEVELS[mes]) || DATA_LEVELS.enero;
  const diffBoxMagic = (dataLvl.boxmagic?.abonos || 0) - (dataLvl.virtualpost?.abonos || 0);

  const ERPContent = () => (
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
          <button onClick={() => setView('auditoria')} className={view === 'auditoria' ? 'nav-item active' : 'nav-item'}><ShieldCheck size={18}/> Auditoría T.R.</button>
          <button onClick={() => setView('cuentas')} className={view === 'cuentas' ? 'nav-item active' : 'nav-item'}><Settings size={18}/> Plan de Cuentas</button>
        </nav>
      </aside>
      <main className="erp-main">
        <header className="main-header">
            <div className="header-mes-nav">{MESES.map(m => (<button key={m} onClick={() => setMes(m)} className={mes === m ? 'm-link active' : 'm-link'}>{MES_LABEL[m].toUpperCase()}</button>))}</div>
            <div className="header-status" style={{color: '#14b8a6'}}>{loading ? 'SYNC...' : '● INFRAESTRUCTURA MÚLTIPLE PROTEGIDA'}</div>
        </header>
        <section className="content-area">
          {view === 'dashboard' && <div className="fade-in"><h2>Dashboard — {MES_LABEL[mes]}</h2><div className="glass-card" style={{padding:'20px'}}>BCI: {fmt(dataLvl.bci?.abonos)}</div></div>}
          {view === 'recuperacion' && <RecuperacionSocios />}
          {view === 'ap' && <div className="fade-in"><h3>Egresos</h3></div>}
          {view === 'rrhh' && <div className="fade-in"><h3>Nómina</h3></div>}
          {view === 'ingesta' && <div className="fade-in"><h3>Ingesta</h3></div>}
          {/* ... all other views would go here ... */}
        </section>
      </main>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pago/:id" element={<PaginaPago />} />
        <Route path="/*" element={<ERPContent />} />
      </Routes>
    </BrowserRouter>
  );
}
