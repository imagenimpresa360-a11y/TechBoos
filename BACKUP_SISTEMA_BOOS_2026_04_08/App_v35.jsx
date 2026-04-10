
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building2, ShieldCheck, Users, Wallet, Activity, Clock, CheckCircle2, Trash2, Plus, LayoutDashboard, Receipt, UserPlus, HeartHandshake, Fingerprint, Crown, Hammer, Home, AlertCircle, CheckSquare, Download, Upload, Save, Coins } from 'lucide-react';
import './index.css';

const fmt = (n) => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—';
const MESES = ['enero', 'febrero', 'marzo', 'abril'];
const MES_LABEL = { enero: 'Enero', febrero: 'Febrero', marzo: 'Marzo', abril: 'Abril' };

const SALDOS_BCI = { enero: 6844400, febrero: 5707900, marzo: 7394080, abril: 1045890 };

const LISTA_MAESTRA_OFICIAL = [
  { nombre: "JOAQUIN ORTUBIA", rut: "17.106.300-0", cargo: "Coach / Admin", vHora: 10000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "NICOLAS MILLAN", rut: "17.278.171-3", cargo: "Coach", vHora: 9000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "RODRIGO AGUILERA", rut: "16.393.697-6", cargo: "Coach", vHora: 7000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "GABRIELA SANCHEZ", rut: "20.532.712-6", cargo: "Coach", vHora: 7000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "JAVIERA PAZ", rut: "17.957.360-1", cargo: "Coach", vHora: 7000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "CRISTIAN ZAPATA", rut: "15.373.251-5", cargo: "Coach", vHora: 7000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "DAPHNE URRIOLA", rut: "20.204.516-2", cargo: "Coach", vHora: 7000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "GERALDINE LASTRA", rut: "19.031.723-4", cargo: "Coach", vHora: 7000, cuenta: "Sueldos de Entrenadores" },
  { nombre: "ANGELICA BECERRA (ARRIENDO)", rut: "5.542.592-2", cargo: "Arriendo", vHora: 1530000, cuenta: "Arriendo" },
  { nombre: "BEATRIZ ROJAS", rut: "15.333.748-9", cargo: "Aseo Marina", vHora: 180000, cuenta: "Limpieza y Aseo y Art. Aseo." }
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [mes, setMes] = useState('enero');
  const [abonoInput, setAbonoInput] = useState({}); // Controla inputs de abono
  
  const [db, setDb] = useState(() => {
    const saved = localStorage.getItem('THE_BOOS_MASTER_DB');
    return saved ? JSON.parse(saved) : { nomina: { enero: [], febrero: [], marzo: [], abril: [] }, egresos: { enero: [], febrero: [], marzo: [], abril: [] } };
  });

  useEffect(() => {
    localStorage.setItem('THE_BOOS_MASTER_DB', JSON.stringify(db));
  }, [db]);

  // --- 📝 LOGICA NOMINA ---
  const registrarNomina = (e) => {
    e.preventDefault();
    const f = LISTA_MAESTRA_OFICIAL[selectedIdx];
    const actual = db.nomina[mes] || [];
    if(actual.some(p => p.nombre === f.nombre)) return;
    const nextDb = {...db};
    nextDb.nomina[mes] = [...actual, {...f, id: Date.now(), horas: {camp: 0, marina: 0}, status: 'Pendiente'}];
    setDb(nextDb);
  };

  const deleteNominaItem = (id) => {
    const nextDb = {...db};
    nextDb.nomina[mes] = nextDb.nomina[mes].filter(p => p.id !== id);
    setDb({...nextDb});
  };

  const payStaff = (p) => {
    const hC = p.horas?.camp || 0;
    const hM = p.horas?.marina || 0;
    const nextDb = {...db};
    
    const base = { cat: p.cuenta, status: 'Ingresado', abonado: 0 };
    if(hC > 0) nextDb.egresos[mes].push({ ...base, id: Date.now()+1, item: `PAGO: ${p.nombre} (CAMP)`, monto: hC * p.vHora, sede: 'Campanario' });
    if(hM > 0) nextDb.egresos[mes].push({ ...base, id: Date.now()+2, item: `PAGO: ${p.nombre} (MAR)`, monto: hM * p.vHora, sede: 'Marina' });
    if(hC===0 && hM===0 && p.vHora > 50000) {
        nextDb.egresos[mes].push({ ...base, id: Date.now()+3, item: `PAGO FIJO: ${p.nombre}`, monto: p.vHora, sede: p.cargo.includes('Marina') ? 'Marina' : 'Campanario' });
    }

    const idx = nextDb.nomina[mes].findIndex(x => x.id === p.id);
    nextDb.nomina[mes][idx].status = 'Pagado';
    setDb({...nextDb});
  };

  // --- 💸 LOGICA ABONOS Y CERTIFICACION ---
  const registrarAbono = (id, valor) => {
    const nextDb = {...db};
    const i = nextDb.egresos[mes].findIndex(g => g.id === id);
    if(i > -1) {
        const item = nextDb.egresos[mes][i];
        item.abonado = (item.abonado || 0) + Number(valor);
        if(item.abonado >= item.monto) item.status = 'Aprobado';
        else item.status = 'Parcial';
        setDb({...nextDb});
        setAbonoInput({...abonoInput, [id]: ''}); // Limpiar input
    }
  };

  const certificarTotal = (id, sede) => {
    const nextDb = {...db};
    const i = nextDb.egresos[mes].findIndex(g => g.id === id);
    if(i > -1) {
      nextDb.egresos[mes][i].status = 'Aprobado';
      nextDb.egresos[mes][i].abonado = nextDb.egresos[mes][i].monto;
      nextDb.egresos[mes][i].sede = sede;
      setDb({...nextDb});
    }
  };

  const currentEgresos = db.egresos[mes] || [];
  const totAbonadoMes = currentEgresos.reduce((s, g) => s + (g.abonado || 0), 0);
  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div className="erp-layout">
      <aside className="erp-sidebar">
        <div className="sidebar-logo"><Building2 color="#14b8a6" size={24}/><span>THE BOOS ERP</span></div>
        <nav className="sidebar-nav">
          <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'nav-item active' : 'nav-item'}><LayoutDashboard size={18}/> Dashboard</button>
          <button onClick={() => setView('ap')} className={view === 'ap' ? 'nav-item active' : 'nav-item'}><Receipt size={18}/> Egresos & Abonos</button>
          <button onClick={() => setView('rrhh')} className={view === 'rrhh' ? 'nav-item active' : 'nav-item'}><Users size={18}/> Nómina & Horas</button>
        </nav>
      </aside>

      <main className="erp-main">
        <header className="main-header">
            <div className="header-mes-nav">{MESES.map(m => (<button key={m} onClick={() => setMes(m)} className={mes === m ? 'm-link active' : 'm-link'}>{MES_LABEL[m].toUpperCase()}</button>))}</div>
            <div className="header-status" style={{color: '#14b8a6'}}>SISTEMA DE CONTROL DE SALDOS v35</div>
        </header>

        <section className="content-area">
          {view === 'dashboard' && (
            <div className="fade-in">
              <h2 className="view-title">Dashboard Proyectado — {MES_LABEL[mes]}</h2>
              <div className="metrics-grid">
                <div className="glass-card metric-card teal-border"><div className="metric-label">ABONOS BCI</div><div className="metric-value">{fmt(SALDOS_BCI[mes] || 0)}</div></div>
                <div className="glass-card metric-card red-border"><div className="metric-label">TOTAL ABONADO (EGRESOS)</div><div className="metric-value">{fmt(totAbonadoMes)}</div></div>
              </div>
            </div>
          )}

          {view === 'rrhh' && (
            <div className="fade-in">
              <h2 className="view-title">Control de Nómina: {MES_LABEL[mes]}</h2>
              <div className="glass-card" style={{padding: '2rem'}}>
                <form onSubmit={registrarNomina} className="form-grid" style={{marginBottom: '2rem'}}>
                  <select className="form-select" value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))}>
                    {LISTA_MAESTRA_OFICIAL.map((p, i) => <option key={i} value={i}>{p.nombre}</option>)}
                  </select>
                  <button type="submit" className="btn-submit"><UserPlus size={16}/> Añadir Coach</button>
                </form>

                <table className="erp-table">
                  <thead><tr><th>COACH</th><th>CAMP</th><th>MARINA</th><th>ESTADO</th><th>ACCION</th></tr></thead>
                  <tbody>
                    {(db.nomina[mes] || []).map(p => (
                      <tr key={p.id}>
                        <td style={{fontWeight: 800}}>{p.nombre}</td>
                        <td><input type="number" className="form-input" style={{width: '60px'}} value={p.horas?.camp || 0} onChange={e => {
                            const nextDb = {...db};
                            const i = nextDb.nomina[mes].findIndex(x => x.id === p.id);
                            nextDb.nomina[mes][i].horas.camp = Number(e.target.value);
                            setDb({...nextDb});
                        }} disabled={p.status==='Pagado'}/></td>
                        <td><input type="number" className="form-input" style={{width: '60px'}} value={p.horas?.marina || 0} onChange={e => {
                            const nextDb = {...db};
                            const i = nextDb.nomina[mes].findIndex(x => x.id === p.id);
                            nextDb.nomina[mes][i].horas.marina = Number(e.target.value);
                            setDb({...nextDb});
                        }} disabled={p.status==='Pagado'}/></td>
                        <td><span className={`status-pill ${p.status === 'Pagado' ? 'aprobado' : 'ingresado'}`}>{p.status.toUpperCase()}</span></td>
                        <td style={{display: 'flex', gap: '10px'}}>
                            {p.status === 'Pendiente' ? <button className="btn-submit" onClick={() => payStaff(p)}>INYECTAR AP</button> : <CheckSquare size={18} color="#14b8a6"/>}
                            <button onClick={() => deleteNominaItem(p.id)} style={{background: 'none', border: 'none', color: '#4b5563'}}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'ap' && (
            <div className="fade-in">
              <h2 className="view-title">Control de Egresos y Saldos Pendientes — {MES_LABEL[mes]}</h2>
              <div className="glass-card">
                <table className="erp-table">
                  <thead><tr><th>DETALLE</th><th>TOTAL</th><th>ABONADO</th><th>SALDO</th><th>REGISTRAR ABONO</th><th>ACCION</th></tr></thead>
                  <tbody>
                    {currentEgresos.map(g => (
                      <tr key={g.id}>
                        <td style={{fontSize: '0.8rem'}}>{g.item}</td>
                        <td style={{fontWeight: 900}}>{fmt(g.monto)}</td>
                        <td style={{color: '#14b8a6', fontWeight: 800}}>{fmt(g.abonado || 0)}</td>
                        <td style={{color: '#f43f5e', fontWeight: 900}}>{fmt(g.monto - (g.abonado || 0))}</td>
                        <td>
                            <div style={{display: 'flex', gap: '5px'}}>
                                <input type="number" placeholder="$" className="form-input" style={{width: '80px', height: '30px'}} 
                                       value={abonoInput[g.id] || ''} onChange={e => setAbonoInput({...abonoInput, [g.id]: e.target.value})}/>
                                <button className="btn-submit" style={{padding: '5px', background: '#10b981'}} onClick={() => registrarAbono(g.id, abonoInput[g.id])}><Coins size={14}/></button>
                            </div>
                        </td>
                        <td>
                          {g.status !== 'Aprobado' ? (
                            <div className="btn-group">
                              <button className="btn-camp" onClick={() => certificarTotal(g.id, 'Campanario')}>CAMP</button>
                              <button className="btn-marina" onClick={() => certificarTotal(g.id, 'Marina')}>MARINA</button>
                            </div>
                          ) : <div style={{color: '#10b981', fontWeight: 800, fontSize: '0.7rem'}}>SALDADO ✓</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
