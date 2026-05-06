import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Detectar entorno para la API
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : ''; // Rutas relativas en producción

const SEGMENTO_CONFIG = {
  Amarillo: { color: '#f59e0b', bg: '#fef3c7', label: '35-59 días', icon: '🟡' },
  Rojo:     { color: '#ef4444', bg: '#fee2e2', label: '60-179 días', icon: '🔴' },
  Critico:  { color: '#6b21a8', bg: '#f3e8ff', label: 'Riesgo Crítico (+180d)', icon: '⚫' },
  Antiguo:  { color: '#475569', bg: '#f1f5f9', label: 'Socio Histórico', icon: '❄️' },
  Verde:    { color: '#22c55e', bg: '#dcfce7', label: '0-35 días',   icon: '🟢' },
};

const formatMonto = (m) => m ? `$${Number(m).toLocaleString('es-CL')}` : '$0';
const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL') : '—';

function TarjetaSocio({ socio, onContactar, onActualizar }) {
  const [expandido, setExpandido] = useState(false);
  const [nota, setNota] = useState(socio.notas || '');
  const [guardando, setGuardando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const seg = SEGMENTO_CONFIG[socio.segmento_riesgo] || SEGMENTO_CONFIG.Verde;
  const nombreSeguro = socio.nombre || socio.email || 'Alumno sin nombre';
  const primerNombre = nombreSeguro.split(' ')[0];

  const guardarNotas = async () => {
    setGuardando(true);
    try {
      await fetch(`${API_BASE}/api/socios/${socio.id}/notas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: nota }),
      });
      onActualizar(socio, 'Notas Actualizadas');
    } catch (e) { console.error('Error guardando notas:', e); }
    setGuardando(false);
  };

  return (
    <div style={{
      background: '#1a1f2e', border: `1px solid ${seg.color}33`,
      borderLeft: `4px solid ${seg.color}`, borderRadius: 12,
      padding: '16px 20px', marginBottom: 12, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: `${seg.color}15`,
          border: `2px solid ${seg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: seg.color, flexShrink: 0,
        }}>
          {nombreSeguro[0]?.toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>{nombreSeguro}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: seg.bg, color: seg.color, fontWeight: 700 }}>
              {seg.icon} {seg.label}
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
            {socio.email} · {socio.sede_habitual || 'Sede no asignada'}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            Ult. Pago: <strong>{formatFecha(socio.fecha_ultimo_pago)}</strong> · 
            Monto: <strong style={{ color: '#fbbf24' }}>{formatMonto(socio.monto_promedio)}</strong> · 
            <span style={{ color: seg.color, fontWeight: 700 }}> {socio.dias_inactivo} días inactivo</span>
          </div>
        </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {socio.telefono && (
          <a href={`https://wa.me/${socio.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
             onClick={() => onContactar(socio, 'WhatsApp')}
             style={{ background: '#22c55e', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
            WhatsApp
          </a>
        )}
        {socio.email && (
          <a href={`mailto:${socio.email}?subject=Te extrañamos en The Boos Box!&body=Hola ${primerNombre}, hace tiempo que no nos vemos...`} 
             onClick={() => onContactar(socio, 'Email')}
             style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
            Mail
          </a>
        )}
        <button 
          onClick={() => {
            const link = `${window.location.origin}/pago/${socio.id}`;
            navigator.clipboard.writeText(link);
            alert("¡Link de Pago copiado!");
          }}
          style={{ background: '#ff0000', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          Copiar Link Pago
        </button>
        <button onClick={() => setExpandido(!expandido)} style={{ marginLeft: 'auto', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            {expandido ? '▲ Gestión' : '▼ Notas'}
        </button>
        {socio.ultima_gestion_evidencia && (
          <button 
            onClick={() => setMostrarModal(true)}
            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
          >
            👁️ Ver Comprobante
          </button>
        )}
      </div>

      {/* Modal de Comprobante */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }} onClick={() => setMostrarModal(false)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <img src={socio.ultima_gestion_evidencia} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', border: '4px solid #fff' }} />
            <button onClick={() => setMostrarModal(false)} style={{ position: 'absolute', top: -20, right: -20, background: '#ff0000', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
               <button onClick={() => { onActualizar(socio, 'Reingresó'); setMostrarModal(false); }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>✅ Validar y Activar Plan</button>
            </div>
          </div>
        </div>
      )}

      {expandido && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e293b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <textarea value={nota} onChange={e => setNota(e.target.value)} rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', padding: 8, fontSize: 12 }} />
            <button onClick={guardarNotas} style={{ marginTop: 8, background: '#6366f1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
              {guardando ? 'Guardando...' : 'Guardar Notas'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
             {['Contactado', 'Interesado', 'Reingresó', 'Declinó'].map(res => (
               <button key={res} onClick={() => onActualizar(socio, res)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                  {res}
               </button>
             ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function RecuperacionSocios() {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sede, setSede] = useState('');
  const [segmento, setSegmento] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = (msg, tipo = 'success') => {
    setNotificacion({ msg, tipo });
    setTimeout(() => setNotificacion(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (sede) p.set('sede', sede);
      if (segmento) p.set('segmento', segmento);
      const res = await fetch(`${API_BASE}/api/socios/inactivos?${p}`);
      const data = await res.json();
      setSocios(data.socios || []);
    } catch (e) { console.error('Error fetching data:', e); }
    setLoading(false);
  }, [sede, segmento]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sociosFiltrados = useMemo(() => {
    return socios.filter(s => 
      !busqueda || (s.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [socios, busqueda]);

  const handleContactar = async (socio, tipo) => {
     await fetch(`${API_BASE}/api/campanas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socio_id: socio.id, tipo_contacto: tipo, promo_ofrecida: 'Promo 4x19k' }),
      });
  };

  const handleActualizar = async (socio, resultado) => {
    try {
      const res = await fetch(`${API_BASE}/api/campanas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          socio_id: socio.id, 
          tipo_contacto: 'Manual ERP', 
          resultado: resultado,
          estado_gestion: resultado === 'Reingresó' ? 'Cerrado' : 'Contactado',
          promo_ofrecida: 'Reingreso sin promo' 
        }),
      });
      
      if (res.ok) {
        mostrarNotificacion(`✅ ${socio.nombre?.split(' ')[0] || 'Socio'} marcado como: ${resultado}`);
        fetchAll(); // Recargar lista para reflejar cambios
      } else {
        mostrarNotificacion('❌ Error al guardar el estado', 'error');
      }
    } catch (e) { 
      console.error(e);
      mostrarNotificacion('❌ Error de conexión con el servidor', 'error');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Toast de Notificación */}
      {notificacion && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: notificacion.tipo === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 24px', borderRadius: 8,
          fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notificacion.msg}
        </div>
      )}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <input placeholder="Buscar alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ flex: 1, background: '#1a1f2e', color: 'white', padding: 10, borderRadius: 8, border: '1px solid #334155' }} />
        <select value={sede} onChange={e => setSede(e.target.value)} style={{ background: '#1a1f2e', color: 'white', padding: 10, borderRadius: 8, border: '1px solid #334155' }}>
          <option value="">Todas las Sedes</option>
          <option value="Campanario">Campanario</option>
          <option value="Marina">Marina</option>
        </select>
        <select value={segmento} onChange={e => setSegmento(e.target.value)} style={{ background: '#1a1f2e', color: 'white', padding: 10, borderRadius: 8, border: '1px solid #334155' }}>
          <option value="">Todos los Riesgos</option>
          <option value="Amarillo">Amarillo</option>
          <option value="Rojo">Rojo</option>
          <option value="Critico">Crítico</option>
        </select>
      </div>

      {loading ? <div>Cargando...</div> : sociosFiltrados.map(s => <TarjetaSocio key={s.id} socio={s} onContactar={handleContactar} onActualizar={handleActualizar} />)}
    </div>
  );
}
