import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

export default function PaginaPago() {
  const { id } = useParams();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/pago/${id}`)
      .then(res => res.json())
      .then(data => setSocio(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId: socio.id,
          amount: 19000,
          description: 'Pack Boos Rescue - 4 Clases'
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirigir a VirtualPos
      }
    } catch (err) {
      alert("Error al conectar con la pasarela de pago. Intenta nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #f59e0b', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
        <p style={{ fontSize: '14px', letterSpacing: '1px' }}>PREPARANDO TU ARENA...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Header / Logo */}
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <div style={{ fontSize: '28px', fontWeight: '900', color: '#f59e0b', letterSpacing: '3px' }}>THE BOOS BOX</div>
        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '5px', fontWeight: 'bold' }}>SISTEMA DE RECUPERACIÓN OFICIAL</div>
      </div>

      {/* Tarjeta de Oferta */}
      <div style={{ background: 'linear-gradient(145deg, #111827, #000000)', border: '1px solid #1f2937', borderRadius: '32px', padding: '40px 30px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>¡Hola {socio?.nombre.split(' ')[0]}!</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Es momento de retomar el entrenamiento.</p>
        </div>
        
        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '20px', padding: '25px', marginBottom: '35px' }}>
          <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pack Rescue Especial</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '42px', fontWeight: '900' }}>$19.000</div>
            <div style={{ fontSize: '16px', color: '#4b5563', textDecoration: 'line-through' }}>$39.900</div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
            {['4 Clases de Crossfit/Funcional', 'Acceso a todas nuestras sedes', 'Seguro de accidentes activado'].map((item, i) => (
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
          {processing ? 'INICIANDO TRANSACCIÓN...' : 'PAGAR Y ACTIVAR AHORA'}
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
