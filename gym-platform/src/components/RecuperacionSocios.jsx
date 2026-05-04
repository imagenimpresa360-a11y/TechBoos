import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Detectar entorno para la API
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : ''; // Rutas relativas en producción

const SEGMENTO_CONFIG = {
  Amarillo: { color: '#f59e0b', bg: '#fef3c7', label: '35-59 días', icon: '🟡' },
  Rojo:     { color: '#ef4444', bg: '#fee2e2', label: '60-179 días', icon: '🔴' },
  Critico:  { color: '#6b21a8', bg: '#f3e8ff', label: '180+ (Oct 25)', icon: '⚫' },
  Antiguo:  { color: '#475569', bg: '#f1f5f9', label: 'Antes Oct 25', icon: '❄️' },
  Verde:    { color: '#22c55e', bg: '#dcfce7', label: '0-35 días',   icon: '🟢' },
};

const formatMonto = (m) => m ? `$${Number(m).toLocaleString('es-CL')}` : '$0';
const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL') : '—';

function TarjetaSocio({ socio, onContactar, onActualizar }) {
  const [expandido, setExpandido] = useState(false);
  const [nota, setNota] = useState(socio.notas || '');
  const [ig, setIg] = useState(socio.instagram || '');
  const [guardando, setGuardando] = useState(false);
  
  const seg = SEGMENTO_CONFIG[socio.segmento_riesgo] || SEGMENTO_CONFIG.Verde;
  // DEFENSA SENIOR: Fallback si el nombre es nulo para evitar crash
  const nombreSeguro = socio.nombre || socio.email || 'Alumno sin nombre';
  const primerNombre = nombreSeguro.split(' ')[0];

  const guardarNotas = async () => {
    setGuardando(true);
    try {
      await fetch(`${API_BASE}/api/socios/${socio.id}/notas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: nota, instagram: ig }),
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
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: `${seg.color}15`,
          border: `2px solid ${seg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: seg.color, flexShrink: 0,
        }}>
          {nombreSeguro[0]?.toUpperCase()}
        </div>

        {/* Info */}
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

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10 }}>
          {socio.telefono && (
            <a href={`https://wa.me/${socio.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
               onClick={() => onContactar(socio, 'WhatsApp')}
               style={{ background: '#22c55e', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              📱 WhatsApp
            </a>
          )}
          <button onClick={() => setExpandido(!expandido)} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
            {expandido ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expandido && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e293b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Notas de Gestión</div>
            <textarea value={nota} onChange={e => setNota(e.target.value)} rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', padding: 8, fontSize: 12 }} />
            <button onClick={guardarNotas} style={{ marginTop: 8, background: '#6366f1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
          <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Acciones Rápidas</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                 {['Contactado', 'Interesado', 'Reingresó', 'Declinó'].map(res => (
                   <button key={res} onClick={() => onActualizar(socio, res)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                      {res}
                   </button>
                 ))}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecuperacionSocios() {
  const [socios, setSocios] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sede, setSede] = useState('');
  const [segmento, setSegmento] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: 200 });
      if (sede) p.set('sede', sede);
      if (segmento) p.set('segmento', segmento);
      
      const [resS, resK] = await Promise.all([
        fetch(`${API_BASE}/api/socios/inactivos?${p}`),
        fetch(`${API_BASE}/api/socios/stats`)
      ]);
      
      const dataS = await resS.json();
      const dataK = await resK.json();
      
      setSocios(dataS.socios || []);
      setStats(dataK);
    } catch (e) { 
      console.error('Error fetching data:', e);
      setMensaje({ t: 'Error cargando datos del servidor', type: 'error' });
    }
    setLoading(false);
  }, [sede, segmento]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sociosFiltrados = useMemo(() => {
    return socios.filter(s => 
      !busqueda || 
      (s.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [socios, busqueda]);

  const handleContactar = async (socio, tipo) => {
     await fetch(`${API_BASE}/api/campanas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socio_id: socio.id, tipo_contacto: tipo, promo_ofrecida: 'Promo 4x19k', agente_nombre: 'ERP' }),
      });
      setMensaje({ t: `Contacto registrado para ${socio.nombre || 'alumno'}` });
      setTimeout(() => setMensaje(null), 3000);
  };

  const handleActualizar = async (socio, resultado) => {
    try {
      // 1. Crear registro de campaña
      const postRes = await fetch(`${API_BASE}/api/campanas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          socio_id: socio.id, 
          tipo_contacto: resultado, 
          promo_ofrecida: 'Promo 4x19k', 
          agente_nombre: 'ERP' 
        }),
      });
      const campana = await postRes.json();
      
      // 2. Si hay ID de campaña, actualizar resultado
      if (campana?.id) {
        await fetch(`${API_BASE}/api/campanas/${campana.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            estado_gestion: resultado,
            resultado: resultado === 'Reingresó' ? 'Reingresó' : null 
          }),
        });
      }
      
      setMensaje({ t: `✅ ${socio.nombre?.split(' ')[0] || 'Alumno'} marcado como: ${resultado}` });
      setTimeout(() => { setMensaje(null); fetchAll(); }, 2500);
    } catch (e) {
      console.error('Error actualizando estado:', e);
      setMensaje({ t: 'Error al guardar. Intenta nuevamente.', type: 'error' });
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      {mensaje && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: mensaje.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 20px', borderRadius: 8, zIndex: 1000, fontWeight: 700 }}>
          {mensaje.t}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Recuperación de Alumnos Inactivos</h2>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Gestiona reingresos y promociones reactivas.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Buscar alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ flex: 1, background: '#1a1f2e', border: '1px solid #334155', borderRadius: 8, padding: '10px 15px', color: 'white' }} />
        <select value={sede} onChange={e => setSede(e.target.value)} style={{ background: '#1a1f2e', border: '1px solid #334155', color: 'white', padding: '10px', borderRadius: 8 }}>
          <option value="">Todas las Sedes</option>
          <option value="Campanario">Campanario</option>
          <option value="Marina">Marina</option>
        </select>
        <select value={segmento} onChange={e => setSegmento(e.target.value)} style={{ background: '#1a1f2e', border: '1px solid #334155', color: 'white', padding: '10px', borderRadius: 8 }}>
          <option value="">Todos los Riesgos</option>
          <option value="Amarillo">Amarillo</option>
          <option value="Rojo">Rojo</option>
          <option value="Critico">Crítico (6-12m)</option>
          <option value="Antiguo">Antiguo (+1 año)</option>
        </select>
        <button onClick={fetchAll} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Actualizar</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, opacity: 0.5 }}>Cargando datos...</div>
      ) : sociosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, background: '#1a1f2e', borderRadius: 12, opacity: 0.5 }}>No se encontraron alumnos con estos criterios.</div>
      ) : (
        sociosFiltrados.map(s => <TarjetaSocio key={s.id} socio={s} onContactar={handleContactar} onActualizar={handleActualizar} />)
      )}
    </div>
  );
}
