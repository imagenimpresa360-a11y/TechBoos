import React, { useState, useEffect, useCallback } from 'react';

const API = window.location.hostname === 'localhost' 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
    : ''; // En producción, usa rutas relativas

const SEGMENTO_CONFIG = {
  Amarillo: { color: '#f59e0b', bg: '#fef3c7', label: '1-2 meses', icon: '🟡' },
  Rojo:     { color: '#ef4444', bg: '#fee2e2', label: '3-5 meses', icon: '🔴' },
  Critico:  { color: '#6b21a8', bg: '#f3e8ff', label: '+6 meses',  icon: '⚫' },
  Verde:    { color: '#22c55e', bg: '#dcfce7', label: 'Al día',    icon: '🟢' },
};

const ESTADO_GESTION = ['Pendiente', 'Contactado', 'Interesado', 'Cerrado', 'Declinó'];

const formatMonto = (m) => m ? `$${Number(m).toLocaleString('es-CL')}` : '$0';
const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL') : '—';

// ── Tarjeta de Socio Inactivo ──────────────────────────────
function TarjetaSocio({ socio, onContactar, onActualizar }) {
  const [expandido, setExpandido] = useState(false);
  const [nota, setNota] = useState(socio.notas || '');
  const [ig, setIg] = useState(socio.instagram || '');
  const [guardando, setGuardando] = useState(false);
  const seg = SEGMENTO_CONFIG[socio.segmento_riesgo] || SEGMENTO_CONFIG.Verde;
  const nombre1 = socio.nombre.split(' ')[0];

  const guardarNotas = async () => {
    setGuardando(true);
    try {
      await fetch(`${API}/api/socios/${socio.id}/notas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: nota, instagram: ig }),
      });
      onActualizar();
    } catch (e) { console.error(e); }
    setGuardando(false);
  };

  return (
    <div style={{
      background: '#1a1f2e',
      border: `1px solid ${seg.color}44`,
      borderLeft: `4px solid ${seg.color}`,
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 12,
      transition: 'all 0.2s',
    }}>
      {/* Fila principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

        {/* Avatar inicial */}
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: `${seg.color}22`,
          border: `2px solid ${seg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: seg.color, flexShrink: 0,
        }}>
          {nombre1[0]?.toUpperCase()}
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>
              {socio.nombre}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: seg.bg, color: seg.color, fontWeight: 600,
            }}>
              {seg.icon} {seg.label}
            </span>
            {socio.ultima_gestion_estado && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#1e293b', color: '#94a3b8',
              }}>
                {socio.ultima_gestion_estado}
              </span>
            )}
          </div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
            {socio.email} · {socio.sede_habitual || 'Sede ?'}
            {socio.coach_referente && ` · Coach: ${socio.coach_referente}`}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            Último plan: <strong style={{ color: '#cbd5e1' }}>{socio.plan_ultimo}</strong>
            · Ticket: <strong style={{ color: '#fbbf24' }}>{formatMonto(socio.monto_promedio)}</strong>
            · <strong style={{ color: seg.color }}>{socio.dias_inactivo} días sin pagar</strong>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {/* WhatsApp */}
          {socio.whatsapp_link || socio.telefono ? (
            <a
              href={socio.whatsapp_link || `https://wa.me/${(socio.telefono||'').replace(/\D/g,'')}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => onContactar(socio, 'WhatsApp')}
              style={{
                background: '#25D366', color: '#fff',
                padding: '8px 16px', borderRadius: 8,
                fontWeight: 600, fontSize: 13, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              📱 WhatsApp
            </a>
          ) : (
            <span style={{ color: '#475569', fontSize: 12 }}>Sin teléfono</span>
          )}

          {/* Email */}
          {socio.email && (
            <a
              href={`mailto:${socio.email}?subject=Te+extrañamos+en+The+Boos+Box+🥊&body=Hola+${nombre1}%2C%0A%0ATenemos+tu+Pack+de+Reactivación%3A+4+clases+x+%2419.000.%0A%0A¿Te+anoto+para+esta+semana%3F`}
              onClick={() => onContactar(socio, 'Email')}
              style={{
                background: '#3b82f6', color: '#fff',
                padding: '8px 14px', borderRadius: 8,
                fontWeight: 600, fontSize: 13, textDecoration: 'none',
              }}
            >
              ✉️ Email
            </a>
          )}

          {/* Expandir */}
          <button
            onClick={() => setExpandido(!expandido)}
            style={{
              background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}
          >
            {expandido ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Panel expandido */}
      {expandido && (
        <div style={{ marginTop: 16, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Historial */}
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Historial
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                <div>🗓 Primer pago: {formatFecha(socio.fecha_primer_pago)}</div>
                <div>🗓 Último pago: {formatFecha(socio.fecha_ultimo_pago)}</div>
                <div>💰 Total histórico: {formatMonto(socio.total_pagado)}</div>
                {socio.ultima_gestion_fecha && (
                  <div>📞 Último contacto: {formatFecha(socio.ultima_gestion_fecha)}</div>
                )}
              </div>
            </div>

            {/* Editar Instagram + Notas */}
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Datos Adicionales
              </div>
              <input
                placeholder="@instagram_handle"
                value={ig}
                onChange={e => setIg(e.target.value)}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid #334155',
                  borderRadius: 6, padding: '6px 10px', color: '#f1f5f9',
                  fontSize: 12, marginBottom: 8, boxSizing: 'border-box',
                }}
              />
              <textarea
                placeholder="Notas de gestión..."
                value={nota}
                onChange={e => setNota(e.target.value)}
                rows={2}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid #334155',
                  borderRadius: 6, padding: '6px 10px', color: '#f1f5f9',
                  fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={guardarNotas}
                disabled={guardando}
                style={{
                  background: guardando ? '#374151' : '#6366f1',
                  color: '#fff', border: 'none', borderRadius: 6,
                  padding: '6px 14px', fontSize: 12, cursor: 'pointer', marginTop: 4,
                }}
              >
                {guardando ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>

          {/* Actualizar resultado */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Contactado', 'Interesado', 'Reingresó', 'Declinó'].map(estado => (
              <button
                key={estado}
                onClick={() => onActualizar(socio, estado)}
                style={{
                  background: estado === 'Reingresó' ? '#16a34a' : '#1e293b',
                  color: estado === 'Reingresó' ? '#fff' : '#94a3b8',
                  border: `1px solid ${estado === 'Reingresó' ? '#16a34a' : '#334155'}`,
                  padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                }}
              >
                {estado === 'Contactado' ? '📞' : estado === 'Interesado' ? '🤔' : estado === 'Reingresó' ? '🎉' : '❌'} {estado}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Panel KPI superior ─────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null;
  const { socios: s, campana_mes: c } = stats;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
      {[
        { label: 'Inactivos', value: s.inactivos, color: '#ef4444', icon: '😴' },
        { label: '🟡 Amarillo', value: s.seg_amarillo, color: '#f59e0b', icon: '' },
        { label: '🔴 Rojo', value: s.seg_rojo, color: '#ef4444', icon: '' },
        { label: '⚫ Crítico', value: s.seg_critico, color: '#a855f7', icon: '' },
        { label: 'Recuperados', value: s.recuperados, color: '#22c55e', icon: '✅' },
        { label: 'Contactados', value: c.contactos, color: '#3b82f6', icon: '📞' },
        { label: 'Conversión', value: `${c.tasa_conversion}%`, color: '#22c55e', icon: '📈' },
        { label: 'Recuperado $', value: `$${(c.monto_recuperado||0).toLocaleString('es-CL')}`, color: '#fbbf24', icon: '💰' },
      ].map(kpi => (
        <div key={kpi.label} style={{
          background: '#1a1f2e', border: '1px solid #1e293b', borderRadius: 10,
          padding: '12px 16px', textAlign: 'center',
        }}>
          <div style={{ color: kpi.color, fontSize: 22, fontWeight: 700 }}>{kpi.value}</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{kpi.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Vista Principal ────────────────────────────────────────
export default function RecuperacionSocios() {
  const [socios, setSocios] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroSeg, setFiltroSeg] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filtroSede) params.set('sede', filtroSede);
      if (filtroSeg)  params.set('segmento', filtroSeg);

      const [sociosRes, statsRes] = await Promise.all([
        fetch(`${API}/api/socios/inactivos?${params}`),
        fetch(`${API}/api/socios/stats`),
      ]);
      const sociosData = await sociosRes.json();
      const statsData  = await statsRes.json();
      setSocios(sociosData.socios || []);
      setStats(statsData);
    } catch (e) {
      console.error(e);
      showToast('Error cargando datos', 'error');
    }
    setLoading(false);
  }, [filtroSede, filtroSeg]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleContactar = async (socio, tipo) => {
    try {
      await fetch(`${API}/api/campanas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socio_id: socio.id,
          tipo_contacto: tipo,
          promo_ofrecida: '4 clases x $19.000 Pack Reactivación',
          agente_nombre: 'Ejecutivo',
        }),
      });
      showToast(`✅ ${socio.nombre.split(' ')[0]} marcado como contactado`);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleActualizar = async (socio, resultado) => {
    // Buscar la última campaña del socio y actualizarla
    try {
      // Primero registrar la gestión si no existe
      const campRes = await fetch(`${API}/api/campanas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socio_id: socio.id, tipo_contacto: 'Gestión', agente_nombre: 'Ejecutivo' }),
      });
      const camp = await campRes.json();
      
      // Luego actualizarla con el resultado
      await fetch(`${API}/api/campanas/${camp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado_gestion: resultado,
          resultado: resultado === 'Reingresó' ? 'Reingresó' : null,
        }),
      });
      
      if (resultado === 'Reingresó') {
        showToast(`🎉 ¡${socio.nombre.split(' ')[0]} recuperado! Registrado en el sistema.`);
      } else {
        showToast(`📝 Estado de ${socio.nombre.split(' ')[0]} actualizado: ${resultado}`);
      }
      fetchData();
    } catch (e) { console.error(e); }
  };

  // Filtro por búsqueda local
  const sociosFiltrados = socios.filter(s =>
    !busqueda || 
    s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#16a34a',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px #0004',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>
          🥊 Departamento de Recuperación de Socios
        </h2>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Alumnos inactivos ordenados por prioridad · Datos actualizados de BoxMagic
        </p>
      </div>

      {/* KPIs */}
      <StatsBar stats={stats} />

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Buscar alumno..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            flex: 1, minWidth: 200, background: '#1a1f2e', border: '1px solid #334155',
            borderRadius: 8, padding: '8px 14px', color: '#f1f5f9', fontSize: 13,
          }}
        />
        <select
          value={filtroSede}
          onChange={e => setFiltroSede(e.target.value)}
          style={{
            background: '#1a1f2e', border: '1px solid #334155', borderRadius: 8,
            padding: '8px 14px', color: '#f1f5f9', fontSize: 13,
          }}
        >
          <option value="">Todas las sedes</option>
          <option value="Campanario">Campanario</option>
          <option value="Marina">Marina</option>
        </select>
        <select
          value={filtroSeg}
          onChange={e => setFiltroSeg(e.target.value)}
          style={{
            background: '#1a1f2e', border: '1px solid #334155', borderRadius: 8,
            padding: '8px 14px', color: '#f1f5f9', fontSize: 13,
          }}
        >
          <option value="">Todos los segmentos</option>
          <option value="Amarillo">🟡 Amarillo (1-2 meses)</option>
          <option value="Rojo">🔴 Rojo (3-5 meses)</option>
          <option value="Critico">⚫ Crítico (+6 meses)</option>
        </select>
        <button
          onClick={fetchData}
          style={{
            background: '#6366f1', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Contador */}
      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 14 }}>
        Mostrando <strong style={{ color: '#94a3b8' }}>{sociosFiltrados.length}</strong> alumnos inactivos
        {filtroSeg && ` en segmento ${filtroSeg}`}
        {filtroSede && ` · Sede ${filtroSede}`}
      </div>

      {/* Lista de socios */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>
          ⏳ Cargando bandeja de recuperación...
        </div>
      ) : sociosFiltrados.length === 0 ? (
        <div style={{
          textAlign: 'center', color: '#64748b', padding: 60,
          background: '#1a1f2e', borderRadius: 12,
        }}>
          ✅ No hay alumnos inactivos con estos filtros.
        </div>
      ) : (
        sociosFiltrados.map(socio => (
          <TarjetaSocio
            key={socio.id}
            socio={socio}
            onContactar={handleContactar}
            onActualizar={handleActualizar}
          />
        ))
      )}
    </div>
  );
}
