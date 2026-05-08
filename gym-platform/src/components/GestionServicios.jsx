import React, { useState, useEffect } from 'react';
import { Activity, User, DollarSign, Calendar, Plus, CheckCircle, Clock } from 'lucide-react';

const GestionServicios = () => {
  const [sesiones, setSesiones] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSesion, setNewSesion] = useState({ profesional_id: '', socio_nombre: '', monto_total: 20000 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resSes, resPro] = await Promise.all([
        fetch('/api/servicios/sesiones'),
        fetch('/api/servicios/profesionales')
      ]);
      const [dataSes, dataPro] = await Promise.all([resSes.json(), resPro.json()]);
      setSesiones(dataSes);
      setProfesionales(dataPro);
    } catch (err) {
      console.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `$${Number(n).toLocaleString('es-CL')}`;

  const stats = {
    totalMes: sesiones.reduce((acc, s) => acc + s.monto_total, 0),
    utilidadBox: sesiones.reduce((acc, s) => acc + s.monto_box, 0),
    pendientes: sesiones.filter(s => s.estado_pago === 'Pendiente').length
  };

  return (
    <div className="fade-in" style={{ padding: '20px', color: 'white' }}>
      
      {/* Header con Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Ingreso Total Sala</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{fmt(stats.totalMes)}</div>
            </div>
            <Activity color="#f59e0b" size={32} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Utilidad para el Box</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{fmt(stats.utilidadBox)}</div>
            </div>
            <DollarSign color="#10b981" size={32} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Sesiones Realizadas</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{sesiones.length}</div>
            </div>
            <Calendar color="#3b82f6" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Registro de Sesiones</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-submit" 
          style={{ background: '#f59e0b', color: 'black', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Nueva Sesión
        </button>
      </div>

      {/* Tabla de Sesiones */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>PROFESIONAL</th>
              <th>ALUMNO</th>
              <th>TOTAL</th>
              <th>COMISIÓN BOX</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map(s => (
              <tr key={s.id}>
                <td>{new Date(s.fecha_sesion).toLocaleDateString()}</td>
                <td style={{ fontWeight: '600' }}>{s.profesional_nombre}</td>
                <td>{s.socio_nombre}</td>
                <td>{fmt(s.monto_total)}</td>
                <td style={{ color: '#10b981', fontWeight: 'bold' }}>{fmt(s.monto_box)}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    background: s.estado_pago === 'Pagado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: s.estado_pago === 'Pagado' ? '#10b981' : '#f59e0b',
                    border: `1px solid ${s.estado_pago === 'Pagado' ? '#10b981' : '#f59e0b'}`
                  }}>
                    {s.estado_pago.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {sesiones.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No hay sesiones registradas este mes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Simulado (Estructura) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '30px', width: '100%', maxWidth: '400px', border: '1px solid #f59e0b' }}>
            <h3 style={{ marginTop: 0 }}>Registrar Sesión</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <select className="form-select">
                <option>Seleccionar Profesional...</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.especialidad})</option>)}
              </select>
              <input type="text" className="form-input" placeholder="Nombre del Alumno" />
              <input type="number" className="form-input" placeholder="Monto Total" defaultValue="20000" />
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                * El sistema calculará automáticamente la comisión de $5.000 para el Box.
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setShowModal(false)} className="btn-submit" style={{ background: '#334155' }}>Cancelar</button>
                <button onClick={() => setShowModal(false)} className="btn-submit" style={{ background: '#f59e0b', color: 'black' }}>Guardar Registro</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GestionServicios;
