import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

export default function PaginaPago() {
  const { id } = useParams();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/pago/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Link de pago no válido o expirado');
        return res.json();
      })
      .then(data => setSocio(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePayment = async () => {
    // BUG FIX: usar 'id' directo de la URL, no socio.id (que no existe en la respuesta del API)
    if (!id) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId: id,
          amount: 19900,
          description: 'Pack Boos Rescue Campanario - 4 Clases',
          sede: 'Campanario'
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No se recibió URL de pago del servidor');
      }
    } catch (err) {
      console.error('Error en handlePayment:', err);
      alert('Error al conectar con la pasarela: ' + err.message);
    } finally {
      setProcessing(false);
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

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Header / Logo */}
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <div style={{ fontSize: '28px', fontWeight: '900', color: '#f59e0b', letterSpacing: '3px' }}>THE BOOS BOX</div>
        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>SEDE CAMPANARIO · RECUPERACIÓN</div>
      </div>

      {/* Tarjeta de Oferta */}
      <div style={{ background: 'linear-gradient(145deg, #111827, #000000)', border: '1px solid #1f2937', borderRadius: '32px', padding: '40px 30px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>¡Hola {socio?.nombre.split(' ')[0]}! 👋</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Es el momento ideal para retomar tu entrenamiento.</p>
        </div>
        
        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '20px', padding: '25px', marginBottom: '35px' }}>
          <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>PACK REINCORPORACIÓN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '42px', fontWeight: '900' }}>$19.900</div>
            <div style={{ fontSize: '16px', color: '#4b5563', textDecoration: 'line-through' }}>$27.000</div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
            {['4 Clases de Crossfit/Funcional', 'Uso exclusivo en Sede Campanario', 'Activación automática inmediata'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#d1d5db' }}>
                <span style={{ color: '#10b981' }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={processing}
          style={{ 
            width: '100%', 
            background: processing ? '#1f2937' : '#f59e0b', 
            color: 'black', 
            border: 'none', 
            padding: '20px', 
            borderRadius: '16px', 
            fontSize: '18px', 
            fontWeight: '900', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            boxShadow: processing ? 'none' : '0 10px 20px -5px rgba(245, 158, 11, 0.5)',
            transform: processing ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {processing ? 'CONECTANDO...' : 'PAGAR Y ACTIVAR AHORA'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '25px', opacity: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '11px' }}>
             🔒 Pago Seguro 100% cifrado · VirtualPos
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>
          The Boos Box SpA — Todos los derechos reservados.<br/>
          Infraestructura Múltiple Protegida 2026.
        </p>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        button:active { transform: scale(0.95) !important; }
      `}</style>

    </div>
  );
}
