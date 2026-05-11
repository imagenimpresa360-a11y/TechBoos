import React, { useState } from 'react';
import { Download, CheckCircle2, AlertTriangle, Users, Loader2 } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

export default function CargaAsistencia() {
    const [archivo, setArchivo] = useState(null);
    const [subiendo, setSubiendo] = useState(false);
    const [resultado, setResultado] = useState(null);

    const handleUpload = async () => {
        if (!archivo) return;
        setSubiendo(true);
        try {
            const formData = new FormData();
            formData.append('file', archivo);

            const res = await fetch(`${API_BASE}/ingesta/asistencia`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setResultado(data);
                alert(`✅ Procesadas ${data.processed} clases. Se detectaron ${data.hooksFound} alumnos para enganche.`);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            alert('❌ Error: ' + err.message);
        } finally {
            setSubiendo(false);
            setArchivo(null);
        }
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Users size={32} color="#f59e0b" />
                <h2 style={{ margin: 0 }}>Control de Asistencia & Enganches</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Zona de Carga */}
                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                    <h3 style={{ marginTop: 0 }}>Cargar Reporte BoxMagic</h3>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Sube el Excel de asistencia diaria para detectar automáticamente quiénes están listos para la renovación.</p>
                    
                    <label style={{ 
                        display: 'block', 
                        border: '2px dashed #334155', 
                        borderRadius: '16px', 
                        padding: '40px', 
                        cursor: 'pointer',
                        margin: '24px 0',
                        background: archivo ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                        transition: 'all 0.3s'
                    }}>
                        <input 
                            type="file" 
                            accept=".xlsx,.xls,.csv" 
                            style={{ display: 'none' }} 
                            onChange={(e) => setArchivo(e.target.files[0])}
                        />
                        {archivo ? (
                            <div>
                                <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
                                <p style={{ color: '#f1f5f9', fontWeight: '600' }}>{archivo.name}</p>
                            </div>
                        ) : (
                            <div>
                                <Download size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
                                <p style={{ color: '#94a3b8' }}>Arrastra el archivo aquí o haz clic</p>
                            </div>
                        )}
                    </label>

                    <button 
                        onClick={handleUpload}
                        disabled={!archivo || subiendo}
                        style={{ 
                            width: '100%', 
                            background: archivo ? '#f59e0b' : '#1e293b', 
                            color: archivo ? '#000' : '#475569',
                            border: 'none', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            fontWeight: '900',
                            cursor: archivo ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {subiendo ? <><Loader2 className="animate-spin" /> PROCESANDO...</> : 'ANALIZAR ASISTENCIA'}
                    </button>
                </div>

                {/* Info / Tips */}
                <div className="glass-card" style={{ padding: '32px' }}>
                    <h3 style={{ marginTop: 0, color: '#f59e0b' }}>¿Cómo funciona el Enganche?</h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', height: 'fit-content' }}>1</div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>El sistema identifica a los alumnos del <strong>Pack de Reingreso</strong> en el Excel.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', height: 'fit-content' }}>2</div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>Si el alumno registra su <strong>3ra clase</strong>, el sistema dispara una alerta a Telegram.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', height: 'fit-content' }}>3</div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>Tú recibes el aviso y puedes enviarle la promo del <strong>Nutricionista</strong> justo a tiempo.</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                        <AlertTriangle color="#f59e0b" size={20} />
                        <p style={{ margin: 0, fontSize: '12px', color: '#f59e0b' }}>
                            <strong>TIP:</strong> Sube la asistencia al menos 2 veces por semana para no perder la ventana de oportunidad de renovación.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
