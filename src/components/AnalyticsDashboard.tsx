import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { TriggerAlert, HoneyToken } from '../types/token';
import { 
  TrendingUp, 
  Flame, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Download, 
  Sparkles, 
  Info,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface AnalyticsDashboardProps {
  alerts: TriggerAlert[];
  tokens: HoneyToken[];
  onSimulateIntrusion?: () => void;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

interface TrendDataPoint {
  date: Date;
  dateLabel: string;
  count: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  types: Record<string, number>;
}

interface HeatmapCell {
  dayIndex: number; // 0 = Lunes, 6 = Domingo
  dayName: string;
  hour: number; // 0..23
  count: number;
  alerts: TriggerAlert[];
}

const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  alerts,
  tokens,
  onSimulateIntrusion
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedTokenType, setSelectedTokenType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // SVG references for D3 charts
  const lineChartRef = useRef<SVGSVGElement | null>(null);
  const heatmapRef = useRef<SVGSVGElement | null>(null);

  // Tooltip states for floating HTML tooltips
  const [lineTooltip, setLineTooltip] = useState<{
    x: number;
    y: number;
    data: TrendDataPoint | null;
    visible: boolean;
  }>({ x: 0, y: 0, data: null, visible: false });

  const [heatTooltip, setHeatTooltip] = useState<{
    x: number;
    y: number;
    cell: HeatmapCell | null;
    visible: boolean;
  }>({ x: 0, y: 0, cell: null, visible: false });

  // 1. Filtrar alertas según filtros seleccionados
  const filteredAlerts = useMemo(() => {
    const now = Date.now();
    let minTimestamp = 0;

    if (timeRange === '24h') minTimestamp = now - 24 * 3600 * 1000;
    else if (timeRange === '7d') minTimestamp = now - 7 * 24 * 3600 * 1000;
    else if (timeRange === '30d') minTimestamp = now - 30 * 24 * 3600 * 1000;

    return alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp).getTime();
      if (minTimestamp > 0 && alertTime < minTimestamp) return false;
      if (selectedTokenType !== 'all' && alert.tokenType !== selectedTokenType) return false;
      if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
      return true;
    });
  }, [alerts, timeRange, selectedTokenType, selectedSeverity]);

  // 2. Agrupación temporal para el Gráfico de Líneas
  const trendData = useMemo<TrendDataPoint[]>(() => {
    if (filteredAlerts.length === 0) {
      // Generar rango vacío según timeRange
      const points: TrendDataPoint[] = [];
      const steps = timeRange === '24h' ? 24 : 7;
      const now = new Date();
      for (let i = steps - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - (timeRange === '24h' ? i * 3600000 : i * 86400000));
        points.push({
          date: d,
          dateLabel: timeRange === '24h' ? `${d.getHours()}:00` : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          count: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          types: {}
        });
      }
      return points;
    }

    if (timeRange === '24h') {
      // Agrupación por cada hora de las últimas 24 horas
      const hourlyMap = new Map<number, TrendDataPoint>();
      const now = new Date();
      now.setMinutes(0, 0, 0);

      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 3600000);
        const hourKey = d.getTime();
        hourlyMap.set(hourKey, {
          date: d,
          dateLabel: `${String(d.getHours()).padStart(2, '0')}:00`,
          count: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          types: {}
        });
      }

      filteredAlerts.forEach(alert => {
        const d = new Date(alert.timestamp);
        d.setMinutes(0, 0, 0);
        const hourKey = d.getTime();
        const pt = hourlyMap.get(hourKey);
        if (pt) {
          pt.count++;
          if (alert.severity === 'critical') pt.criticalCount++;
          else if (alert.severity === 'high') pt.highCount++;
          else pt.mediumCount++;
          pt.types[alert.tokenType] = (pt.types[alert.tokenType] || 0) + 1;
        }
      });

      return Array.from(hourlyMap.values());
    } else {
      // Agrupación por días
      const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 60;
      const dailyMap = new Map<string, TrendDataPoint>();
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateKey = d.toISOString().split('T')[0];
        dailyMap.set(dateKey, {
          date: d,
          dateLabel: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          count: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          types: {}
        });
      }

      filteredAlerts.forEach(alert => {
        const dateKey = alert.timestamp.split('T')[0];
        const pt = dailyMap.get(dateKey);
        if (pt) {
          pt.count++;
          if (alert.severity === 'critical') pt.criticalCount++;
          else if (alert.severity === 'high') pt.highCount++;
          else pt.mediumCount++;
          pt.types[alert.tokenType] = (pt.types[alert.tokenType] || 0) + 1;
        }
      });

      return Array.from(dailyMap.values());
    }
  }, [filteredAlerts, timeRange]);

  // 3. Matriz para el Heatmap: 7 Días de la Semana x 24 Horas
  const heatmapData = useMemo<HeatmapCell[]>(() => {
    // Matriz de 7 filas (Lunes=0..Domingo=6) x 24 columnas (00h..23h)
    const grid: HeatmapCell[] = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        grid.push({
          dayIndex: day,
          dayName: DAYS_ES[day],
          hour: hour,
          count: 0,
          alerts: []
        });
      }
    }

    filteredAlerts.forEach(alert => {
      const d = new Date(alert.timestamp);
      // getDay() devuelve 0 para domingo, 1 para lunes... convertimos a 0=Lunes, 6=Domingo
      const jsDay = d.getDay();
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
      const hour = d.getHours();

      const cellIndex = dayIndex * 24 + hour;
      if (grid[cellIndex]) {
        grid[cellIndex].count++;
        grid[cellIndex].alerts.push(alert);
      }
    });

    return grid;
  }, [filteredAlerts]);

  // Métricas analíticas agregadas
  const analyticsSummary = useMemo(() => {
    const total = filteredAlerts.length;
    const critical = filteredAlerts.filter(a => a.severity === 'critical').length;
    
    // Calcular hora pico
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const vectorCounts: Record<string, number> = {};

    filteredAlerts.forEach(a => {
      const d = new Date(a.timestamp);
      const h = d.getHours();
      const jsDay = d.getDay();
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
      hourCounts[h]++;
      dayCounts[dayIndex]++;
      vectorCounts[a.tokenType] = (vectorCounts[a.tokenType] || 0) + 1;
    });

    let maxHour = 0;
    let maxHourCount = 0;
    hourCounts.forEach((c, h) => {
      if (c > maxHourCount) {
        maxHourCount = c;
        maxHour = h;
      }
    });

    let maxDayIndex = 0;
    let maxDayCount = 0;
    dayCounts.forEach((c, d) => {
      if (c > maxDayCount) {
        maxDayCount = c;
        maxDayIndex = d;
      }
    });

    let topVector = 'Ninguno';
    let topVectorCount = 0;
    Object.entries(vectorCounts).forEach(([vec, count]) => {
      if (count > topVectorCount) {
        topVectorCount = count;
        topVector = vec;
      }
    });

    return {
      total,
      critical,
      criticalPercentage: total > 0 ? Math.round((critical / total) * 100) : 0,
      peakHourWindow: `${String(maxHour).padStart(2, '0')}:00 - ${String((maxHour + 1) % 24).padStart(2, '0')}:00`,
      peakHourCount: maxHourCount,
      peakDay: DAYS_ES[maxDayIndex],
      peakDayCount: maxDayCount,
      topVector,
      topVectorCount
    };
  }, [filteredAlerts]);

  // --------------------------------------------------------------------------
  // D3: Render del Gráfico de Líneas de Tendencia
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!lineChartRef.current || trendData.length === 0) return;

    const svg = d3.select(lineChartRef.current);
    svg.selectAll('*').remove(); // Limpieza previa

    const margin = { top: 25, right: 30, bottom: 40, left: 45 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escalas
    const xExtent = d3.extent(trendData, d => d.date) as [Date, Date];
    const xScale = d3.scaleTime().domain(xExtent).range([0, width]);

    const maxCount = d3.max(trendData, d => d.count) || 1;
    const yMax = Math.max(maxCount + 1, 3);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);

    // Definición de degradado para el área bajo la curva
    const defs = svg.append('defs');
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'line-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f43f5e')
      .attr('stop-opacity', 0.45);

    areaGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f43f5e')
      .attr('stop-opacity', 0.0);

    // Líneas de cuadrícula horizontales
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3');

    g.selectAll('.grid .domain').remove();

    // Generador de Área
    const area = d3.area<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Dibujar Área
    g.append('path')
      .datum(trendData)
      .attr('fill', 'url(#line-area-gradient)')
      .attr('d', area);

    // Generador de Línea
    const line = d3.line<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Dibujar Línea de Contorno principal
    g.append('path')
      .datum(trendData)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Línea de promedio si hay datos
    const avgCount = d3.mean(trendData, d => d.count) || 0;
    if (avgCount > 0) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(avgCount))
        .attr('y2', yScale(avgCount))
        .attr('stroke', '#eab308')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.7);

      g.append('text')
        .attr('x', width - 8)
        .attr('y', yScale(avgCount) - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#fde047')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(`Media: ${avgCount.toFixed(1)}/int`);
    }

    // Puntos interactivos en cada vértice
    const dotsGroup = g.append('g').attr('class', 'dots');
    dotsGroup
      .selectAll('circle')
      .data(trendData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', d => d.count > 0 ? 4.5 : 2.5)
      .attr('fill', d => d.count > 0 ? (d.criticalCount > 0 ? '#f43f5e' : '#fb7185') : '#334155')
      .attr('stroke', '#020617')
      .attr('stroke-width', 1.8)
      .attr('class', 'cursor-pointer transition-all')
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 7).attr('stroke', '#ffffff');
        const [posX, posY] = d3.pointer(event, svg.node());
        setLineTooltip({
          x: posX,
          y: posY,
          data: d,
          visible: true
        });
      })
      .on('mouseleave', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', d.count > 0 ? 4.5 : 2.5).attr('stroke', '#020617');
        setLineTooltip(prev => ({ ...prev, visible: false }));
      });

    // Eje X
    const xAxis = d3.axisBottom(xScale)
      .ticks(timeRange === '24h' ? 8 : 7)
      .tickFormat(d => {
        const dateObj = d as Date;
        return timeRange === '24h' 
          ? d3.timeFormat('%H:%M')(dateObj)
          : d3.timeFormat('%d %b')(dateObj);
      });

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace');

    g.select('.domain').attr('stroke', '#334155');

    // Eje Y
    const yAxis = d3.axisLeft(yScale)
      .ticks(Math.min(yMax, 6))
      .tickFormat(d3.format('d'));

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace');

    // Etiqueta del Eje Y
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -32)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .text('Alertas / Intento');

  }, [trendData, timeRange]);

  // --------------------------------------------------------------------------
  // D3: Render del Mapa de Calor (Heatmap) por Horas del Día (24x7)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!heatmapRef.current || heatmapData.length === 0) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const cellWidth = width / 24;
    const cellHeight = height / 7;

    // Calcular máximo para la escala de color
    const maxVal = d3.max(heatmapData, d => d.count) || 1;

    // Escala de color secuencial (desde oscuro casi negro hasta rojo/rosa vibrante)
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateRgbBasis(['#0b1222', '#1e1b4b', '#831843', '#be123c', '#f43f5e', '#fb7185']))
      .domain([0, Math.max(maxVal, 3)]);

    // Celdas del heatmap
    const cells = g.selectAll('.heat-cell')
      .data(heatmapData)
      .enter()
      .append('g')
      .attr('class', 'heat-cell');

    cells
      .append('rect')
      .attr('x', d => d.hour * cellWidth + 1.5)
      .attr('y', d => d.dayIndex * cellHeight + 1.5)
      .attr('width', cellWidth - 3)
      .attr('height', cellHeight - 3)
      .attr('rx', 3)
      .attr('fill', d => d.count === 0 ? '#090e1a' : colorScale(d.count))
      .attr('stroke', d => d.count > 0 ? (d.count >= 3 ? '#fb7185' : '#e11d48') : '#1e293b')
      .attr('stroke-width', d => d.count > 0 ? 1 : 0.6)
      .attr('class', 'cursor-pointer transition-all')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        const [posX, posY] = d3.pointer(event, svg.node());
        setHeatTooltip({
          x: posX,
          y: posY,
          cell: d,
          visible: true
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('stroke', (d: any) => d.count > 0 ? (d.count >= 3 ? '#fb7185' : '#e11d48') : '#1e293b')
          .attr('stroke-width', (d: any) => d.count > 0 ? 1 : 0.6);

        setHeatTooltip(prev => ({ ...prev, visible: false }));
      });

    // Etiquetas de Horas (Eje X superior o inferior)
    const hourLabels = [0, 3, 6, 9, 12, 15, 18, 21, 23];
    g.selectAll('.hour-label')
      .data(hourLabels)
      .enter()
      .append('text')
      .attr('class', 'hour-label')
      .attr('x', d => (d + 0.5) * cellWidth)
      .attr('y', height + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(d => `${String(d).padStart(2, '0')}h`);

    // Etiquetas de Días (Eje Y izquierdo)
    g.selectAll('.day-label')
      .data(DAYS_SHORT_ES)
      .enter()
      .append('text')
      .attr('class', 'day-label')
      .attr('x', -10)
      .attr('y', (_, i) => (i + 0.5) * cellHeight + 3.5)
      .attr('text-anchor', 'end')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'sans-serif')
      .text(d => d);

    // Barra de Leyenda de Intensidad (inferior derecha)
    const legendWidth = 140;
    const legendHeight = 8;
    const legendX = width - legendWidth;
    const legendY = -18;
    const defs = svg.append('defs');
    const legendGrad = defs.append('linearGradient')
      .attr('id', 'heat-legend-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    legendGrad.append('stop').attr('offset', '0%').attr('stop-color', '#090e1a');
    legendGrad.append('stop').attr('offset', '40%').attr('stop-color', '#831843');
    legendGrad.append('stop').attr('offset', '70%').attr('stop-color', '#f43f5e');
    legendGrad.append('stop').attr('offset', '100%').attr('stop-color', '#fb7185');

    const legendGroup = g.append('g').attr('transform', `translate(${legendX}, ${legendY})`);
    
    legendGroup.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 3)
      .attr('fill', 'url(#heat-legend-grad)')
      .attr('stroke', '#334155')
      .attr('stroke-width', 0.5);

    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', -4)
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text('0 alertas');

    legendGroup.append('text')
      .attr('x', legendWidth)
      .attr('y', -4)
      .attr('text-anchor', 'end')
      .attr('fill', '#f43f5e')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text(`+${Math.max(maxVal, 3)} alertas`);

  }, [heatmapData]);

  // Exportar datos a CSV
  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) return;

    const headers = ['ID', 'Token', 'Tipo', 'Fecha_Hora', 'IP_Origen', 'Pais', 'Ciudad', 'App_Detectada', 'Severidad', 'Aviso_Email'];
    const rows = filteredAlerts.map(a => [
      `"${a.id}"`,
      `"${a.tokenName}"`,
      `"${a.tokenType}"`,
      `"${a.timestamp}"`,
      `"${a.ip}"`,
      `"${a.location?.country || 'Desconocido'}"`,
      `"${a.location?.city || 'Desconocido'}"`,
      `"${a.detectedApp}"`,
      `"${a.severity}"`,
      `"${a.alertEmail}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `honeytoken_intrusiones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Filter Controls Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Análisis y Tendencias de Intrusión (D3.js Engine)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualización temporal de balizas disparadas y distribución horaria de accesos no autorizados a cebos digitales.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time range selector */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                timeRange === '24h'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Token Type Filter */}
          <div className="relative">
            <select
              value={selectedTokenType}
              onChange={(e) => setSelectedTokenType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">Todos los formatos</option>
              <option value="docx">Word (.docx)</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="pdf">Adobe PDF (.pdf)</option>
              <option value="url">URL Canary</option>
              <option value="aws_keys">Credenciales AWS</option>
              <option value="windows_folder">desktop.ini</option>
              <option value="sql_dump">Base de Datos SQL</option>
              <option value="qr_code">Código QR</option>
            </select>
          </div>

          {/* Quick Simulation trigger */}
          {onSimulateIntrusion && (
            <button
              onClick={onSimulateIntrusion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Dispara una simulación inmediata que actualizará los gráficos D3 en tiempo real"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Simular Ataque</span>
            </button>
          )}

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Exportar dataset analizado a archivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Insight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Alertas en Período</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {analyticsSummary.total}
            </span>
            <span className="text-xs text-rose-400 font-medium">
              {analyticsSummary.critical} críticas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            0% falsos positivos (100% fidelidad)
          </p>
        </div>

        {/* Peak Intrusion Hour */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Hora Pico de Ataque</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {analyticsSummary.peakHourWindow}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mayor concentración de aperturas de cebos
          </p>
        </div>

        {/* Most Targeted Vector */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Vector Más Cazado</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white uppercase font-mono">
              {analyticsSummary.topVector}
            </span>
            <span className="text-xs text-orange-400 font-mono">
              ({analyticsSummary.topVectorCount} hits)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Documentos más apetecibles para el intruso
          </p>
        </div>

        {/* Day with Highest Activity */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Día Crítico Semanal</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-300">
              {analyticsSummary.peakDay}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mayor tasa de exfiltración e inspección
          </p>
        </div>
      </div>

      {/* CHART 1: LINE CHART OF INTRUSIONS OVER TIME */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Línea de Tendencia Temporal de Intrusiones (Curva Continua D3)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fluctuación de eventos maliciosos detectados a lo largo del tiempo con degradado volumétrico.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500" />
              <span>Volumen de Intentos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-yellow-400" />
              <span>Promedio de Incidentes</span>
            </div>
          </div>
        </div>

        {/* Responsive Line Chart SVG Container */}
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[680px]">
            <svg
              ref={lineChartRef}
              viewBox="0 0 800 300"
              className="w-full h-auto overflow-visible select-none"
            />
          </div>

          {/* D3 Floating Tooltip for Line Chart */}
          {lineTooltip.visible && lineTooltip.data && (
            <div
              className="absolute pointer-events-none z-30 bg-slate-900/95 border border-rose-500/60 shadow-xl rounded-lg p-2.5 text-xs font-mono text-white backdrop-blur-md transition-all -translate-x-1/2 -translate-y-full"
              style={{
                left: `${lineTooltip.x}px`,
                top: `${lineTooltip.y - 12}px`
              }}
            >
              <div className="font-bold text-rose-300 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-4">
                <span>{lineTooltip.data.dateLabel}</span>
                <span className="px-1.5 py-0.5 bg-rose-600/30 text-rose-200 rounded text-[10px]">
                  {lineTooltip.data.count} alertas
                </span>
              </div>
              <div className="space-y-0.5 text-[11px] text-slate-300">
                <div>Críticas: <span className="text-rose-400 font-bold">{lineTooltip.data.criticalCount}</span></div>
                <div>Altas: <span className="text-amber-400 font-bold">{lineTooltip.data.highCount}</span></div>
                <div>Medias: <span className="text-blue-400 font-bold">{lineTooltip.data.mediumCount}</span></div>
              </div>
              {Object.keys(lineTooltip.data.types).length > 0 && (
                <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                  {Object.entries(lineTooltip.data.types).map(([type, count]) => (
                    <span key={type} className="inline-block mr-2 text-slate-300">
                      {type}: <b>{count}</b>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CHART 2: 24x7 HOURLY HEATMAP MATRIX */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Mapa de Calor por Horas del Día (Matriz 24h × 7 Días)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifica patrones temporales de ataque, ventanas de vulnerabilidad (cambios de turno, nocturnidad) y actividad de bots.
            </p>
          </div>
        </div>

        {/* Responsive Heatmap SVG Container */}
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[700px]">
            <svg
              ref={heatmapRef}
              viewBox="0 0 800 250"
              className="w-full h-auto overflow-visible select-none"
            />
          </div>

          {/* D3 Floating Tooltip for Heatmap */}
          {heatTooltip.visible && heatTooltip.cell && (
            <div
              className="absolute pointer-events-none z-30 bg-slate-900/95 border border-cyan-500/60 shadow-xl rounded-lg p-2.5 text-xs font-mono text-white backdrop-blur-md transition-all -translate-x-1/2 -translate-y-full"
              style={{
                left: `${heatTooltip.x}px`,
                top: `${heatTooltip.y - 12}px`
              }}
            >
              <div className="font-bold text-cyan-300 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-4">
                <span>{heatTooltip.cell.dayName}</span>
                <span>{String(heatTooltip.cell.hour).padStart(2, '0')}:00 - {String((heatTooltip.cell.hour + 1) % 24).padStart(2, '0')}:00 h</span>
              </div>
              <div className="text-[11px] text-slate-200">
                Intrusiones detectadas: <span className="text-rose-400 font-bold">{heatTooltip.cell.count}</span>
              </div>
              {heatTooltip.cell.alerts.length > 0 && (
                <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 max-w-[200px] truncate">
                  Último cebo: <span className="text-slate-200">{heatTooltip.cell.alerts[0].tokenName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Heatmap Behavioral Insight Note */}
        <div className="mt-4 p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Análisis de Comportamiento Táctico (Threat Hunting):</span>
            {' '}Las intrusiones fuera de horario laboral (22:00 a 06:00 UTC) suelen correlacionarse con 
            <span className="text-rose-300 font-medium"> atacantes externos o bots de exfiltración masiva</span>, mientras que las alertas 
            entre las 13:00 y las 16:00 suelen delatar 
            <span className="text-amber-300 font-medium"> movimientos laterales de insiders</span> aprovechando la desconexión del personal legítimo.
          </div>
        </div>
      </div>

      {/* Geolocation & Origin Vector Breakdown Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Detected Autonomous Systems & Locations */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3">
            Top Ubicaciones de los Intrusos
          </h4>
          <div className="space-y-2">
            {Object.entries(
              filteredAlerts.reduce<Record<string, { count: number; country: string }>>((acc, a) => {
                const key = a.location?.city ? `${a.location.city}, ${a.location.country}` : 'Red Interna / VPN';
                if (!acc[key]) acc[key] = { count: 0, country: a.location?.country || '' };
                acc[key].count++;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 4)
              .map(([loc, info], idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-300 font-medium">{loc}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-mono font-bold">{info.count} intentos</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({Math.round((info.count / Math.max(filteredAlerts.length, 1)) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            {filteredAlerts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">Sin datos en este rango</p>
            )}
          </div>
        </div>

        {/* User-Agent & Environment Typology */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3">
            Aplicaciones y Herramientas del Intruso
          </h4>
          <div className="space-y-2">
            {Object.entries(
              filteredAlerts.reduce<Record<string, number>>((acc, a) => {
                const app = a.detectedApp || 'Cliente Web Desconocido';
                acc[app] = (acc[app] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([app, count], idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-300 font-mono truncate max-w-[240px]">{app}</span>
                  <span className="text-cyan-400 font-mono font-bold">{count} veces</span>
                </div>
              ))}
            {filteredAlerts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">Sin datos en este rango</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
