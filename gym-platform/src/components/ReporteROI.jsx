import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Award } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

export default function ReporteROI() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/socios/stats`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading || !stats) return <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Cargando inteligencia financiera...</div>;

  const dataRescate = [
    { name: 'Inactivos', value: stats.socios.inactivos, color: '#f43f5e' },
    { name: 'Recuperados', value: stats.socios.recuperados, color: '#10b981' },
    { name: 'Activos', value: stats.socios.activos, color: '#3b82f6' }
  ];

  const dataRiesgo = [
    { name: 'Amarillo', value: stats.socios.seg_amarillo, color: '#f59e0b' },
    { name: 'Rojo', value: stats.socios.seg_rojo, color: '#ef4444' },
    { name: 'Crítico', value: stats.socios.seg_critico, color: '#6b21a8' }
  ];

  const formatCLP = (v) => `$${Number(v).toLocaleString('es-CL')}`;

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <h2 style={{ color: '#fff', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <TrendingUp color="#10b981" /> Reporte de ROI y Recuperación (BOOS RESCUE)
      </h2>

      {/* KPIs Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>MONTO RECUPERADO (MES)</span>
            <DollarSign size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '10px' }}>{formatCLP(stats.campana_mes.monto_recuperado)}</div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '5px' }}>↑ Impacto directo en caja</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>CONVERSIONES</span>
            <Award size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '10px' }}>{stats.campana_mes.conversiones} alumnos</div>
          <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '5px' }}>{stats.campana_mes.tasa_conversion}% efectividad</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>POTENCIAL PENDIENTE</span>
            <Target size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '10px' }}>{formatCLP(stats.socios.potencial_recuperacion)}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Proyectado (tasa 20%)</div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '20px', color: '#94a3b8' }}>ESTADO GENERAL DE LA CARTERA</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRescate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value">
                  {dataRescate.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '20px', color: '#94a3b8' }}>DISTRIBUCIÓN DE RIESGO (INACTIVOS)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataRiesgo}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataRiesgo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '11px', marginTop: '10px' }}>
            {dataRiesgo.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></div>
                <span style={{ color: '#94a3b8' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
