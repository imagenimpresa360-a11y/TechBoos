import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Building2, ShieldCheck, Users, Activity, CheckCircle2, Trash2, Plus, LayoutDashboard, Receipt, Settings, Landmark, AlertTriangle, Smartphone, CreditCard, Ticket, Calendar, Calculator, FileText, Download, CheckSquare, Search, MapPin, Coins, Database } from 'lucide-react';
import RecuperacionSocios from './components/RecuperacionSocios';
import PaginaPago from './components/PaginaPago';
import ReporteROI from './components/ReporteROI';
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

  const approveMatch = async (bci_id) => {
    const mockBoxmagicId = prompt("Ingresa el Nombre del Alumno que hizo este pago:", "Escribe un nombre o rut");
    if(!mockBoxmagicId) return;
    await fetch(`${API_BASE}/conciliacion/match`, { 
        method: 'POST', headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ bci_income_id: bci_id, boxmagic_id: mockBoxmagicId, boxmagic_nombre: mockBoxmagicId, boxmagic_monto: 0, nivel_match: 3 }) 
    });
    alert("Match enlazado con éxito");
    fetchPool();
  };

  const rechazarMatch = async (id) => {
    if(!window.confirm("¿Segur@ que deseas enviar este pago a Fugas Detectadas?")) return;
    await fetch(`${API_BASE}/conciliacion/reject`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id}) });
    alert("Operación Descartada");
    fetchPool();
  };

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

  // --- LOGICAS OPERATIVAS (Sueldos, Egresos, Cuentas) ---
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
    if(totCamp > 0) await fetch(`${API_BASE}/egresos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mes, cat: 'Sueldo Coaches', status: 'Ingresado', abonado: 0, item: `TOTAL SUELDOS: CAMPANARIO`, monto: totCamp, sede: 'Campanario', origen: 'RRHH'})});
    if(totMar > 0) await fetch(`${API_BASE}/egresos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mes, cat: 'Sueldo Coaches', status: 'Ingresado', abonado: 0, item: `TOTAL SUELDOS: MARINA`, monto: totMar, sede: 'Marina', origen: 'RRHH'})});
    alert("Nómina sincronizada"); fetchData();
  };

  const [abonoInput, setAbonoInput] = useState({});
  const [manualEgre, setManualEgre] = useState({ item: '', monto: '', sede: 'Campanario', cat: 'Arriendos' });
  const [newCuenta, setNewCuenta] = useState({ nombre: '', tipo: 'Egreso' });

  const addManualEgre = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/egresos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...manualEgre, mes, monto: Number(manualEgre.monto), abonado: 0, status: 'Ingresado', origen: 'Manual'}) });
    setManualEgre({ ...manualEgre, item: '', monto: '' }); fetchData();
  };

  const deleteEgreso = async (id) => {
    if(!window.confirm("¿Eliminar registro?")) return;
    await fetch(`${API_BASE}/egresos/${id}`, { method: 'DELETE' }); fetchData();
  };

  const applyAbono = async (id, val) => {
    if(!val) return;
    const item = egresos.find(e => e.id === id);
    const nuevoAbono = (item.abonado || 0) + Number(val);
    await fetch(`${API_BASE}/egresos/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({abonado: nuevoAbono, status: nuevoAbono >= item.monto ? 'Aprobado' : 'Parcial'}) });
    setAbonoInput({...abonoInput, [id]: ''}); fetchData();
  };

  const registerCuenta = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/cuentas`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newCuenta) });
    setNewCuenta({ nombre: '', tipo: 'Egreso' }); fetchData();
  };

  const pagarFacturaLioren = async (factura) => {
    await fetch(`${API_BASE}/compras/${factura.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'Pagada' }) });
    await fetch(`${API_BASE}/egresos`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ mes, cat: 'Pago Proveedores', status: 'Aprobado', abonado: factura.montoTotal, item: `PAGO FACTURA #${factura.folio} - ${factura.proveedor}`, monto: factura.montoTotal, sede: 'Campanario', origen: 'Lioren' })
    });
    alert(`Factura ${factura.folio} pagada.`); fetchData();
  };

  // --- CALCULOS ---
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
          <button onClick={() => setView('reportes')} className={view === 'reportes' ? 'nav-item active' : 'nav-item'}><LayoutDashboard size={18}/> Reportes del Mes</button>
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
              <h2 className="view-title">Dashboard de Conciliación — {MES_LABEL[mes]}</h2>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem'}}>
                <div className="glass-card" style={{padding: '1.5rem', borderTop: '4px solid #14b8a6'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}><Landmark size={24} color="#14b8a6"/> <h3>BCI (REALIDAD)</h3></div>
                    <div style={{fontSize: '2rem', fontWeight: 900}}>{fmt(dataLvl.bci?.abonos || 0)}</div>
                </div>
                <div className="glass-card" style={{padding: '1.5rem', borderTop: '4px solid #8b5cf6'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}><Database size={24} color="#8b5cf6"/> <h3>ERP (SISTEMA)</h3></div>
                    <div style={{fontSize: '2rem', fontWeight: 900}}>{fmt(totEgresosDB)}</div>
                </div>
              </div>
            </div>
          )}

          {view === 'recuperacion' && <RecuperacionSocios />}
          
          {view === 'reportes' && <ReporteROI />}
          
          {view === 'conc_diaria' && (
            <div className="fade-in">
              <h2>Conciliación Diaria</h2>
              <table className="erp-table">
                  <thead><tr><th>FECHA</th><th>MONTO</th><th>DETALLE BCI</th><th>ACCIÓN</th></tr></thead>
                  <tbody>{conciliacionPool.map(c => (<tr key={c.id}><td>{new Date(c.fecha_banco).toLocaleDateString()}</td><td style={{color:'#10b981', fontWeight:900}}>{fmt(c.monto)}</td><td>{c.nombre_banco}</td><td><button onClick={() => approveMatch(c.id)} className="btn-submit" style={{background:'#10b981'}}>ENLAZAR</button></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {view === 'ap' && (
            <div className="fade-in">
              <h2>Control de Egresos</h2>
              <div className="glass-card" style={{padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #14b8a6'}}>
                <form onSubmit={addManualEgre} style={{display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto', gap: '0.8rem', alignItems: 'end'}}>
                    <input type="text" className="form-input" placeholder="Detalle" value={manualEgre.item} onChange={e => setManualEgre({...manualEgre, item: e.target.value})} required/>
                    <select className="form-select" value={manualEgre.cat} onChange={e => setManualEgre({...manualEgre, cat: e.target.value})}>{cuentas.filter(c => c.tipo !== 'Ingreso').map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}</select>
                    <input type="number" className="form-input" placeholder="Monto" value={manualEgre.monto} onChange={e => setManualEgre({...manualEgre, monto: e.target.value})} required/>
                    <select className="form-select" value={manualEgre.sede} onChange={e => setManualEgre({...manualEgre, sede: e.target.value})}><option value="Campanario">Campanario</option><option value="Marina">Marina</option></select>
                    <button type="submit" className="btn-submit" style={{background: '#14b8a6'}}><Plus size={16}/> Cargar</button>
                </form>
              </div>
              <table className="erp-table">
                <thead><tr><th>SEDE</th><th>CUENTA</th><th>DETALLE</th><th>MONTO</th><th>PENDIENTE</th></tr></thead>
                <tbody>{egresos.map(g => (<tr key={g.id}><td>{g.sede}</td><td>{g.cuenta}</td><td>{g.detalle}</td><td>{fmt(g.monto)}</td><td style={{color: (g.monto - g.abonado) > 0 ? '#f43f5e' : '#10b981'}}>{fmt(g.monto - g.abonado)}</td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* ... (Otras vistas simplificadas por espacio) ... */}
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
