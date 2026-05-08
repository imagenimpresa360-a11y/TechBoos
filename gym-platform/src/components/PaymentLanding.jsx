import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PaymentLanding = () => {
  const { id } = useParams();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Simulación de carga de datos del socio (En producción viene de la API)
    const fetchSocio = async () => {
      try {
        const res = await fetch(`/api/socios/${id}`);
        const data = await res.json();
        setSocio(data);
      } catch (err) {
        console.error("Error cargando socio");
      } finally {
        setLoading(false);
      }
    };
    fetchSocio();
  }, [id]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId: id,
          amount: 19000,
          description: 'Pack Boos Rescue - 4 Clases'
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirigir a VirtualPos
      }
    } catch (err) {
      alert("Error al procesar el pago. Inténtalo más tarde.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>Cargando experiencia...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Header / Logo */}
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', letterSpacing: '2px' }}>THE BOOS BOX</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>DEPARTAMENTO DE RECUPERACIÓN</div>
      </div>

      {/* Tarjeta de Oferta */}
      <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid #334155', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '10px', textAlign: 'center' }}>¡Bienvenido de vuelta!</h2>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '30px' }}>{socio?.nombre || 'Guerrero'}, la arena te está esperando.</p>
        
        <div style={{ background: '#1a1f2e', borderRadius: '16px', padding: '20px', marginBottom: '30px' }}>
          <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '5px' }}>OFERTA EXCLUSIVA: PACK RESCUE</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>$19.000</div>
          <div style={{ fontSize: '14px', color: '#64748b', textDecoration: 'line-through' }}>Precio normal: $39.900</div>
          <hr style={{ borderColor: '#334155', margin: '15px 0' }} />
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', color: '#cbd5e1', fontSize: '15px' }}>
            <li style={{ marginBottom: '8px' }}>✅ 4 Clases de entrenamiento</li>
            <li style={{ marginBottom: '8px' }}>✅ Acceso a Sede Campanario/Marina</li>
            <li style={{ marginBottom: '8px' }}>✅ Seguro de accidentes incluido</li>
            <li>✅ Válido por 30 días</li>
          </ul>
        </div>

        <button 
          onClick={handlePayment}
          disabled={processing}
          style={{ width: '100%', background: processing ? '#475569' : '#f59e0b', color: 'black', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}
        >
          {processing ? 'PROCESANDO...' : 'RECLAMAR MI PACK'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          🔒 Pago Seguro vía VirtualPos / Transbank
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 'auto', fontSize: '11px', color: '#475569', textAlign: 'center', padding: '20px' }}>
        Al continuar, aceptas los términos y condiciones de The Boos Box SpA.<br/>
        Infraestructura Múltiple Protegida.
      </p>

    </div>
  );
};

export default PaymentLanding;
