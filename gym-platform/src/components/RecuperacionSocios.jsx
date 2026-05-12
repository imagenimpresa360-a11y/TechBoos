import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Detectar entorno para la API
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : ''; // Rutas relativas en producción

const SEGMENTO_CONFIG = {
  Amarillo: { color: '#f59e0b', bg: '#fef3c7', label: '35-59 días', icon: '🟡' },
  Rojo:     { color: '#ef4444', bg: '#fee2e2', label: '60-179 días', icon: '🔴' },
  Critico:  { color: '#6b21a8', bg: '#f3e8ff', label: 'Riesgo Crítico (+180d)', icon: '⚫' },
  Alumnosfuga: { color: '#f43f5e', bg: '#fff1f2', label: 'Alumnos Fuga (2024)', icon: '🏚️' },
  Antiguo:  { color: '#475569', bg: '#f1f5f9', label: 'Socio Histórico', icon: '❄️' },
  Verde:    { color: '#22c55e', bg: '#dcfce7', label: '0-35 días',   icon: '🟢' },
};

const formatMonto = (m) => m ? `$${Number(m).toLocaleString('es-CL')}` : '$0';
const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL') : '—';

function TarjetaSocio({ socio, onContactar, onActualizar, onEncolar }) {
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
          
          {/* AREA SOLICITADA POR USUARIO: HISTORIAL DE PLANES */}
          {socio.planes_historicos && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {socio.planes_historicos.split(',').map((p, idx) => (
                    <span key={idx} style={{ 
                        fontSize: '9px', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        color: '#a5b4fc', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        textTransform: 'uppercase',
                        fontWeight: '600'
                    }}>
                        🏷️ {p.trim()}
                    </span>
                ))}
            </div>
          )}

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
          <a href={`https://wa.me/${socio.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(`¡Hola ${primerNombre}! 🥊 Te extrañamos en The Boos Box. Tenemos una promo de REINGRESO exclusiva para ti: Pack 4 Clases por solo $27.000 (Sede Campanario). Puedes activarlo aquí: https://techboos-production-edd2.up.railway.app/pago/${socio.id}`)}`} 
             target="_blank" rel="noreferrer" 
             onClick={() => onContactar(socio, 'WhatsApp')}
             style={{ background: '#22c55e', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📲 WhatsApp Promo
          </a>
        )}
        {socio.email && (
          <>
            <button 
               onClick={() => onEncolar(socio)}
               style={{ background: '#1e293b', color: '#94a3b8', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🌙 Encolar Despacho
            </button>

            <button 
               onClick={async () => {
                  if(!window.confirm(`¿Enviar email de promoción INSTANTÁNEO a ${socio.email}?`)) return;
                  try {
                    const res = await fetch(`${API_BASE}/api/campanas/email`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ socio_id: socio.id })
                    });
                    const data = await res.json();
                    if(res.ok) {
                      alert(`✅ ${data.mensaje || 'Email enviado exitosamente'}`);
                    } else {
                      alert(`❌ Error: ${data.error}`);
                    }
                  } catch(e) { alert("❌ Error de conexión"); }
               }}
               style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📧 Enviar Ahora
            </button>
          </>
        )}
        <button 
          onClick={() => {
            const link = `https://techboos-production-edd2.up.railway.app/pago/${socio.id}`;
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
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Notas de Seguimiento</div>
              <textarea value={nota} onChange={e => setNota(e.target.value)} rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', padding: 8, fontSize: 12 }} />
              <button onClick={guardarNotas} style={{ marginTop: 8, background: '#6366f1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                {guardando ? 'Guardando...' : 'Guardar Notas'}
              </button>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Historial de Gestión</div>
              <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#0f172a', borderRadius: 8, padding: '12px', border: '1px solid #1e293b' }}>
                {(socio.historial || []).length > 0 ? socio.historial.map((h, i) => (
                  <div key={i} style={{ marginBottom: '10px', borderBottom: i === socio.historial.length - 1 ? 'none' : '1px solid #1e293b', paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '11px' }}>
                        {h.tipo_contacto?.includes('Email') ? '📧' : '📱'} {h.tipo_contacto}
                      </span>
                      <span style={{ color: '#475569', fontSize: '10px' }}>{new Date(h.fecha_contacto).toLocaleDateString('es-CL')}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                      {h.resultado || h.promo_ofrecida || 'Sin detalle'}
                    </div>
                  </div>
                )) : (
                  <div style={{ color: '#334155', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
                    Sin gestiones previas.
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '10px' }}>
                {['Interesado', 'Reingresó', 'Declinó'].map(res => (
                  <button key={res} onClick={() => onActualizar(socio, res)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                      {res}
                  </button>
                ))}
              </div>
            </div>
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
  const [cola, setCola] = useState([]);
  const [mostrarCola, setMostrarCola] = useState(false);

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

  const fetchCola = useCallback(async () => {
    console.log('[DEBUG] Consultando cola de despacho...');
    try {
      const res = await fetch(`${API_BASE}/api/campanas/cola`);
      if (!res.ok) throw new Error('Error en servidor');
      const data = await res.json();
      console.log('[DEBUG] Cola recibida:', data);
      setCola(data || []);
    } catch (e) { 
      console.error('Error fetching cola:', e);
      setCola([]);
    }
  }, []);

  useEffect(() => { 
    fetchAll(); 
    fetchCola();
  }, [fetchAll, fetchCola]);

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
      if (tipo === 'WhatsApp') fetchCola(); // Refresh if we enqueued
  };

  const handleEncolar = async (socio) => {
    try {
        const res = await fetch(`${API_BASE}/api/campanas/encolar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ socio_id: socio.id })
        });
        if(res.ok) {
          mostrarNotificacion(`🌙 ${socio.nombre.split(' ')[0]} encolado.`);
          fetchCola();
        }
      } catch(e) { alert("❌ Error de conexión"); }
  };

  const handleQuitarDeCola = async (id) => {
    if(!window.confirm("¿Sacar a este alumno del despacho nocturno?")) return;
    try {
        const res = await fetch(`${API_BASE}/api/campanas/cola/${id}`, { method: 'DELETE' });
        if(res.ok) {
            mostrarNotificacion("✅ Alumno removido de la cola");
            fetchCola();
        }
    } catch(e) { console.error(e); }
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
          <option value="Alumnosfuga">Alumnos Fuga (2024)</option>
        </select>
        <button 
            onClick={() => setMostrarCola(true)}
            style={{ 
                background: cola.length > 0 ? '#6366f1' : '#1e293b', 
                color: 'white', 
                padding: '10px 20px', 
                borderRadius: 8, 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            📋 Ver Cola ({cola.length})
        </button>
      </div>

      {/* Modal de Cola de Despacho */}
      {mostrarCola && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1a1f2e', border: '1px solid #6366f1', borderRadius: 16, width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: 'white' }}>📋 Cola de Despacho Nocturno</h3>
                    <button onClick={() => setMostrarCola(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                    {cola.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center' }}>No hay correos encolados.</p>
                    ) : cola.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #334155' }}>
                            <div>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{c.nombre}</div>
                                <div style={{ color: '#64748b', fontSize: '12px' }}>{c.email}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ color: '#475569', fontSize: '11px' }}>
                                    {new Date(c.fecha_encolado).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <button 
                                    onClick={() => handleQuitarDeCola(c.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                    title="Quitar de la cola"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: '12px', color: '#f59e0b', fontStyle: 'italic', marginBottom: '20px' }}>
                    * Estos correos se enviarán automáticamente hoy a las 22:00 hrs.
                </p>

                <button 
                    onClick={() => setMostrarCola(false)}
                    style={{ width: '100%', background: '#6366f1', color: 'white', padding: '12px', borderRadius: 8, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Entendido
                </button>
            </div>
        </div>
      )}

      {loading ? <div>Cargando...</div> : sociosFiltrados.map(s => <TarjetaSocio key={s.id} socio={s} onContactar={handleContactar} onActualizar={handleActualizar} onEncolar={handleEncolar} />)}
    </div>
  );
}
