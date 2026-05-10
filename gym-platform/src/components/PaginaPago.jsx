import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
const BOXMAGIC_LINK = 'https://boxmagic.cl/market/plan/Vd0jPNrLrx';
const BANCO = { banco: 'Banco BCI', tipo: 'Cuenta Corriente', numero: '46669086', rut: '77.265.501-0', nombre: 'THE BOOS BOX SPA' };

export default function PaginaPago() {
  const { id } = useParams();
  const [socio, setSocio]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modo, setModo]         = useState(null); // 'tarjeta' | 'transferencia'
  const [archivo, setArchivo]       = useState(null);
  const [enviando, setEnviando]     = useState(false);
  const [exito, setExito]           = useState(false);
  const [emailConfirm, setEmailConfirm] = useState('');
  const [telefono, setTelefono]     = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/pago/${id}`)
      .then(res => { if (!res.ok) throw new Error('Link de pago no válido o expirado'); return res.json(); })
      .then(data => setSocio(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnviarComprobante = async () => {
    if (!archivo)       return alert('Por favor adjunta el comprobante de transferencia.');
    if (!emailConfirm)  return alert('Por favor ingresa tu email para poder localizarte en el sistema.');
    if (!telefono)      return alert('Por favor ingresa tu teléfono para avisarte cuando tu plan esté activo.');
    setEnviando(true);
    try {
      const form = new FormData();
      form.append('comprobante',   archivo);
      form.append('socioId',       id);
      form.append('nombre',        socio?.nombre);
      form.append('email',         socio?.email);
      form.append('emailConfirm',  emailConfirm);
      form.append('telefono',      telefono);
      const res = await fetch(`${API_BASE}/api/pagos/comprobante`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Error al subir el comprobante');
      setExito(true);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: 'white' }}>
      <p style={{ fontSize: '14px', letterSpacing: '2px' }}>CARGANDO EXPERIENCIA...</p>
    </div>
  );

  if (error || !socio) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: 'white', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '40px' }}>🥊</div>
      <h2 style={{ color: '#ef4444', margin: 0 }}>Link no válido</h2>
      <p style={{ color: '#64748b', textAlign: 'center' }}>{error || 'Este link de pago no existe o ya fue procesado.'}</p>
    </div>
  );

  if (exito) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: 'white', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: '60px' }}>🥊✅</div>
      <h2 style={{ color: '#10b981', margin: 0 }}>¡Comprobante Enviado!</h2>
      <p style={{ color: '#9ca3af', maxWidth: '340px' }}>Recibimos tu comprobante. Lo estamos validando y en breve activaremos tu plan. Te llegará un mail de confirmación.</p>
      <p style={{ fontSize: '12px', color: '#475569' }}>The Boos Box SpA · Sede Campanario</p>
    </div>
  );

  const primerNombre = socio?.nombre?.split(' ')[0] || 'Crack';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px' }}>

      {/* Estilos de animación */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        .btn-hover:hover { opacity: 0.92; transform: scale(1.02) !important; }
        .btn-hover:active { transform: scale(0.97) !important; }
        .modo-btn { transition: all 0.25s ease; }
        .modo-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.5); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', margin: '36px 0 24px' }}>
        <div style={{ fontSize: '26px', fontWeight: '900', color: '#f59e0b', letterSpacing: '3px' }}>THE BOOS BOX</div>
        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px' }}>Sede Campanario · Pack Reincorporación</div>
      </div>

      {/* Card principal */}
      <div style={{ background: 'linear-gradient(145deg, #111827, #0d1117)', border: '1px solid #1f2937', borderRadius: '28px', padding: '32px 24px', width: '100%', maxWidth: '420px', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8)' }}>

        {/* Saludo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px' }}>¡Hola {primerNombre}! 👋</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>Es el momento ideal para retomar tu entrenamiento.</p>
        </div>

        {/* Box de oferta */}
        <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '18px', padding: '22px', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>PACK REINCORPORACIÓN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
            <div style={{ fontSize: '44px', fontWeight: '900', lineHeight: 1 }}>$19.900</div>
            <div style={{ fontSize: '15px', color: '#4b5563', textDecoration: 'line-through' }}>$27.000</div>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {['4 Clases de Crossfit / Funcional', 'Uso exclusivo en Sede Campanario', 'Activación inmediata del plan'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#d1d5db' }}>
                <span style={{ color: '#10b981', fontSize: '16px', flexShrink: 0 }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>

        {/* Selector de método de pago */}
        {!modo && (
          <div className="fade-in">
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Cómo prefieres pagar?</p>
            <div style={{ display: 'grid', gap: '12px' }}>

              {/* Botón Tarjeta */}
              <button className="modo-btn btn-hover"
                onClick={() => window.open(BOXMAGIC_LINK, '_blank')}
                style={{ width: '100%', background: '#f59e0b', color: '#000', border: 'none', padding: '18px 20px', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                💳 Pagar con Tarjeta / Webpay
              </button>
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#374151', margin: '-4px 0 4px' }}>Serás redirigido a BoxMagic · Pago 100% seguro</p>

              {/* Divisor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
                <span style={{ fontSize: '12px', color: '#334155' }}>o</span>
                <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
              </div>

              {/* Botón Transferencia */}
              <button className="modo-btn btn-hover"
                onClick={() => setModo('transferencia')}
                style={{ width: '100%', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '16px 20px', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                🏦 Pagar por Transferencia
              </button>
            </div>
          </div>
        )}

        {/* Panel de Transferencia */}
        {modo === 'transferencia' && (
          <div className="fade-in">
            <button onClick={() => setModo(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', padding: 0 }}>
              ← Volver
            </button>

            {/* Datos bancarios */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>Datos para la Transferencia</p>
              {Object.entries({ Banco: BANCO.banco, Tipo: BANCO.tipo, Número: BANCO.numero, RUT: BANCO.rut, Nombre: BANCO.nombre }).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#475569' }}>{k}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: '600' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Monto exacto</span>
                <span style={{ color: '#f59e0b', fontWeight: '900', fontSize: '18px' }}>$19.900</span>
              </div>
            </div>

            {/* Datos de contacto del alumno */}
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', marginTop: '4px' }}>Ingresa tus datos para ubicarte y avisarte cuando tu plan esté activo:</p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Tu Email</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={emailConfirm}
                  onChange={e => setEmailConfirm(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px 14px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Tu Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="+56 9 XXXX XXXX"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px 14px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Subir comprobante */}
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Adjunta el comprobante de transferencia:</p>

            <label style={{ display: 'block', border: '2px dashed #334155', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px', transition: 'all 0.2s', background: archivo ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
              <input type="file" accept="image/*,.pdf" onChange={e => setArchivo(e.target.files[0])} style={{ display: 'none' }} />
              {archivo ? (
                <><div style={{ fontSize: '24px' }}>✅</div><p style={{ color: '#10b981', fontSize: '13px', margin: '6px 0 0' }}>{archivo.name}</p></>
              ) : (
                <><div style={{ fontSize: '28px' }}>📎</div><p style={{ color: '#64748b', fontSize: '13px', margin: '6px 0 0' }}>Toca aquí para adjuntar el comprobante</p><p style={{ color: '#374151', fontSize: '11px', margin: '4px 0 0' }}>JPG, PNG o PDF</p></>
              )}
            </label>

            <button className="btn-hover"
              onClick={handleEnviarComprobante}
              disabled={enviando || !archivo || !emailConfirm || !telefono}
              style={{ width: '100%', background: (enviando || !archivo || !emailConfirm || !telefono) ? '#1e293b' : '#10b981', color: (enviando || !archivo || !emailConfirm || !telefono) ? '#475569' : '#000', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: (enviando || !archivo || !emailConfirm || !telefono) ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
              {enviando ? 'ENVIANDO...' : 'ENVIAR COMPROBANTE'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#374151', marginTop: '12px' }}>
              Validaremos tu pago y te avisaremos al WhatsApp cuando tu plan esté activo. 🥊
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '32px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '1px' }}>
          The Boos Box SpA · Todos los derechos reservados. 2026.
        </p>
      </div>
    </div>
  );
}
