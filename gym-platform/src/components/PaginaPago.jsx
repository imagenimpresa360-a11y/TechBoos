import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

export default function PaginaPago() {
  const { id } = useParams();
  const [socio, setSocio] = useState(null);
  const [metodo, setMetodo] = useState(null); // 'transfer' o 'card'
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/pago/${id}`)
      .then(res => res.json())
      .then(data => setSocio(data))
      .catch(err => console.error(err));
  }, [id]);

  const informarPago = async (m) => {
    await fetch(`${API_BASE}/api/pago/${id}/comprobante`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metodo: m, monto: m === 'transfer' ? 19000 : 19800 })
    });
    setEnviado(true);
  };

  if (!socio) return <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando desafío...</div>;

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ background: '#ff0000', padding: '30px', marginBottom: '30px', borderRadius: '0 0 20px 20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>THE BOOS BOX</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>PACK REACTIVACIÓN CROSSFIT</p>
        </div>

        {!enviado ? (
          <>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>¡Hola {socio.nombre.split(' ')[0]}! 🏋️‍♂️</h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '30px' }}>Selecciona tu método de pago para activar tus 4 clases.</p>

            {/* Opciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Transferencia */}
              <button 
                onClick={() => setMetodo('transfer')}
                style={{ 
                  background: metodo === 'transfer' ? '#111' : '#000', 
                  border: `2px solid ${metodo === 'transfer' ? '#ff0000' : '#333'}`,
                  padding: '20px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ color: '#ff0000', fontWeight: '800', fontSize: '18px' }}>$19.000</div>
                <div style={{ color: '#fff', fontWeight: '600' }}>Transferencia Bancaria</div>
                <div style={{ color: '#666', fontSize: '12px' }}>Sin comisiones adicionales</div>
              </button>

              {metodo === 'transfer' && (
                <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', textAlign: 'left', animation: 'fadeIn 0.3s' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#94a3b8' }}>Datos para transferir:</p>
                  <strong style={{ display: 'block', fontSize: '15px' }}>THE BOOS BOX SPA</strong>
                  <span style={{ display: 'block', color: '#ccc' }}>RUT: 77.265.501-0</span>
                  <span style={{ display: 'block', color: '#ccc' }}>Banco BCI · Cuenta Corriente</span>
                  <span style={{ display: 'block', color: '#ccc' }}>N° 46669086</span>
                  <span style={{ display: 'block', color: '#ccc' }}>Contactoboosbox@gmail.com</span>
                  
                  <button 
                    onClick={() => informarPago('transfer')}
                    style={{ width: '100%', marginTop: '20px', background: '#ff0000', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Ya transferí, informar pago ✅
                  </button>
                </div>
              )}

              {/* Tarjeta */}
              <button 
                onClick={() => setMetodo('card')}
                style={{ 
                  background: metodo === 'card' ? '#111' : '#000', 
                  border: `2px solid ${metodo === 'card' ? '#ff0000' : '#333'}`,
                  padding: '20px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ color: '#ff0000', fontWeight: '800', fontSize: '18px' }}>$19.800</div>
                <div style={{ color: '#fff', fontWeight: '600' }}>Tarjeta Crédito / Débito</div>
                <div style={{ color: '#666', fontSize: '12px' }}>Incluye comisión de servicio</div>
              </button>

              {metodo === 'card' && (
                <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', animation: 'fadeIn 0.3s' }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '15px' }}>Serás redirigido a nuestra pasarela segura.</p>
                  <button 
                    onClick={() => informarPago('card')}
                    style={{ width: '100%', background: '#ff0000', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Pagar con Flow/Webpay 💳
                  </button>
                </div>
              )}

            </div>
          </>
        ) : (
          <div style={{ padding: '40px 20px', animation: 'fadeIn 0.5s' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏁</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>¡REGISTRO RECIBIDO!</h2>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              Hemos notificado al equipo de **The Boos Box**. <br/>
              En breve validaremos tu pago y activaremos tus clases. <br/>
              **¡Nos vemos en el Box!**
            </p>
          </div>
        )}

        <div style={{ marginTop: '50px', color: '#444', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          TechBoos ERP · Secure Payment System
        </div>
      </div>
    </div>
  );
}
