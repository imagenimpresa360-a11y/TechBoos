import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

export default function PaginaPago() {
  const { id } = useParams();
  const [socio, setSocio] = useState(null);
  const [metodo, setMetodo] = useState(null); // 'transfer' o 'card'
  const [enviado, setEnviado] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/pago/${id}`)
      .then(res => res.json())
      .then(data => setSocio(data))
      .catch(err => console.error(err));
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setComprobante(file);
      const reader = new FileReader();
      reader.onloadend = () => setComprobantePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const informarPago = async (m) => {
    setSubiendo(true);
    try {
      await fetch(`${API_BASE}/api/pago/${id}/comprobante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metodo: m, 
          monto: m === 'transfer' ? 19000 : 19800,
          comprobante: comprobantePreview // Enviamos Base64
        })
      });
      setEnviado(true);
    } catch (e) {
      alert("Error al enviar comprobante. Intenta nuevamente.");
    }
    setSubiendo(false);
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
                  
                  <div style={{ marginTop: '20px', border: '1px dashed #444', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#94a3b8' }}>Sube tu comprobante o toma una foto:</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      capture="environment" 
                      onChange={handleFileChange}
                      style={{ display: 'none' }} 
                      id="upload-file" 
                    />
                    <label htmlFor="upload-file" style={{ background: '#1e293b', color: '#fff', padding: '8px 15px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'inline-block' }}>
                      {comprobante ? '📎 Archivo seleccionado' : '📸 Tomar Foto / Subir'}
                    </label>
                    {comprobantePreview && (
                      <div style={{ marginTop: '10px' }}>
                        <img src={comprobantePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100px', borderRadius: '4px' }} />
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => informarPago('transfer')}
                    disabled={!comprobante || subiendo}
                    style={{ 
                      width: '100%', marginTop: '15px', background: '#ff0000', color: '#fff', 
                      border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', 
                      cursor: (comprobante && !subiendo) ? 'pointer' : 'not-allowed',
                      opacity: (comprobante && !subiendo) ? 1 : 0.5 
                    }}
                  >
                    {subiendo ? 'Enviando...' : 'Informar Pago ✅'}
                  </button>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px', textAlign: 'center' }}>
                    ⚠️ Validación manual: 2 a 4 horas hábiles.
                  </p>
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
          <div style={{ padding: '30px 20px', animation: 'fadeIn 0.5s', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
              <span style={{ fontSize: '40px' }}>✓</span>
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>¡REGISTRO EXITOSO!</h2>
            <div style={{ background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Ticket de Operación</span>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff0000', letterSpacing: '2px' }}>TBB-{id.substring(0, 5).toUpperCase()}</div>
            </div>

            <div style={{ textAlign: 'left', background: '#0a0a0a', padding: '20px', borderRadius: '12px', border: '1px solid #1a1a1a' }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '700', marginBottom: '15px' }}>Próximos Pasos:</p>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{ color: '#10b981', fontSize: '14px' }}>●</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  <strong style={{ color: '#fff' }}>Validación:</strong> Nuestro equipo revisará el comprobante (Plazo: 2-4 hrs hábiles).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{ color: '#666', fontSize: '14px' }}>●</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  <strong style={{ color: '#fff' }}>Activación:</strong> Recibirás un aviso en tu App BoxMagic una vez habilitado.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: '#666', fontSize: '14px' }}>●</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  <strong style={{ color: '#fff' }}>¡A Entrenar!:</strong> Ya podrás reservar tus clases normalmente.
                </div>
              </div>
            </div>

            <p style={{ color: '#444', fontSize: '12px', marginTop: '25px', fontStyle: 'italic' }}>
              "Gracias por confiar en el proceso. Nos vemos en el Box."
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
