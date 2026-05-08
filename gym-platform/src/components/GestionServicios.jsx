import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, Calendar, Plus } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

const GestionServicios = () => {
  const [sesiones, setSesiones] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [newSesion, setNewSesion] = useState({ 
    profesional_id: '', 
    socio_nombre: '', 
    monto_total: 20000 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [resSes, resPro] = await Promise.all([
        fetch(`${API_BASE}/api/servicios/sesiones`),
        fetch(`${API_BASE}/api/servicios/profesionales`)
      ]);
      // Bug fix: verificar que la respuesta sea JSON válido antes de parsear
      if (!resSes.ok || !resPro.ok) throw new Error('Error al cargar datos');
      const [dataSes, dataPro] = await Promise.all([resSes.json(), resPro.json()]);
      setSesiones(Array.isArray(dataSes) ? dataSes : []);
      setProfesionales(Array.isArray(dataPro) ? dataPro : []);
    } catch (err) {
      console.error("Error cargando datos del servicio:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!newSesion.profesional_id || !newSesion.socio_nombre) {
      alert('Por favor completa todos los campos.');
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`${API_BASE}/api/servicios/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSesion)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      await fetchData(); // Recargar lista
      setShowModal(false);
      setNewSesion({ profesional_id: '', socio_nombre: '', monto_total: 20000 });
      alert('✅ Sesión registrada exitosamente.');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

  const stats = {
    totalMes: sesiones.reduce((acc, s) => acc + (s.monto_total || 0), 0),
    utilidadBox: sesiones.reduce((acc, s) => acc + (s.monto_box || 0), 0),
    totalSesiones: sesiones.length
  };

  if (loading) return <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>Cargando datos Kine/Nutri...</div>;

  return (
    <div className="fade-in" style={{ padding: '20px', color: 'white' }}>
      
      {/* Header con Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[
          { label: 'Ingreso Total Sala', value: fmt(stats.totalMes), color: '#f59e0b', icon: <Activity size={28} /> },
          { label: 'Utilidad para el Box', value: fmt(stats.utilidadBox), color: '#10b981', icon: <DollarSign size={28} /> },
          { label: 'Sesiones Realizadas', value: stats.totalSesiones, color: '#3b82f6', icon: <Calendar size={28} /> },
        ].map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: card.color }}>{card.value}</div>
              </div>
              <div style={{ color: card.color, opacity: 0.7 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Acción */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Registro de Sesiones</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            Comisión del Box: <strong style={{ color: '#10b981' }}>$5.000</strong> por sesión de $20.000
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#f59e0b', color: 'black', fontWeight: 'bold', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Nueva Sesión
        </button>
      </div>

      {/* Tabla */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>PROFESIONAL</th>
              <th>ALUMNO / PACIENTE</th>
              <th>TOTAL SESIÓN</th>
              <th>COMISIÓN BOX</th>
              <th>ESTADO PAGO</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map(s => (
              <tr key={s.id}>
                <td>{new Date(s.fecha_sesion).toLocaleDateString('es-CL')}</td>
                <td style={{ fontWeight: '600' }}>{s.profesional_nombre}</td>
                <td>{s.socio_nombre}</td>
                <td>{fmt(s.monto_total)}</td>
                <td style={{ color: '#10b981', fontWeight: 'bold' }}>{fmt(s.monto_box)}</td>
                <td>
                  <span style={{ 
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                    background: s.estado_pago === 'Pagado' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: s.estado_pago === 'Pagado' ? '#10b981' : '#f59e0b',
                    border: `1px solid ${s.estado_pago === 'Pagado' ? '#10b981' : '#f59e0b'}`
                  }}>
                    {(s.estado_pago || 'Pendiente').toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {sesiones.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  No hay sesiones registradas aún. ¡Registra la primera sesión!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Funcional */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '30px', width: '100%', maxWidth: '420px', border: '1px solid #f59e0b' }}>
            <h3 style={{ marginTop: 0, color: '#f59e0b' }}>Registrar Nueva Sesión</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Profesional *</label>
                <select 
                  value={newSesion.profesional_id}
                  onChange={e => setNewSesion({...newSesion, profesional_id: e.target.value})}
                  style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #334155' }}
                >
                  <option value="">Seleccionar Profesional...</option>
                  {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.especialidad})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Nombre del Alumno / Paciente *</label>
                <input 
                  type="text"
                  value={newSesion.socio_nombre}
                  onChange={e => setNewSesion({...newSesion, socio_nombre: e.target.value})}
                  placeholder="Ej: Juan Pérez"
                  style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #334155', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Monto Total ($)</label>
                <input 
                  type="number" 
                  value={newSesion.monto_total}
                  onChange={e => setNewSesion({...newSesion, monto_total: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #334155', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', background: 'rgba(16,185,129,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                Comisión automática del Box: <strong style={{ color: '#10b981' }}>$5.000</strong> · 
                Al profesional: <strong style={{ color: '#f59e0b' }}>{fmt((newSesion.monto_total || 0) - 5000)}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button 
                  onClick={() => setShowModal(false)} 
                  style={{ flex: 1, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleGuardar}
                  disabled={guardando}
                  style={{ flex: 2, background: guardando ? '#334155' : '#f59e0b', color: 'black', fontWeight: 'bold', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  {guardando ? 'Guardando...' : '✅ Guardar Sesión'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionServicios;
