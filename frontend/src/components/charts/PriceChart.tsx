'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface PriceChartProps {
  data?: { time: number; value: number }[];
  currentPrice?: number;
  className?: string;
}

function ensureUniqueTimes(
  points: { time: number; value: number }[]
): { time: number; value: number }[] {
  const seen = new Set<number>();
  return points.map((point) => {
    let t = point.time;
    while (seen.has(t)) {
      t += 1;
    }
    seen.add(t);
    return { time: t, value: point.value };
  });
}

export function PriceChart({ data, currentPrice, className }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: 'transparent' },
        textColor: '#999',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const lineSeries = chart.addLineSeries({
      color: '#3B82F6',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => (price * 100).toFixed(1) + '%',
      },
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;

    if (data && data.length > 0) {
      const uniqueData = ensureUniqueTimes(data);
      const chartData: LineData<Time>[] = uniqueData.map((point) => ({
        time: point.time as Time,
        value: point.value,
      }));
      seriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();
    } else if (currentPrice !== undefined) {
      const now = Math.floor(Date.now() / 1000);
      const placeholderData: LineData<Time>[] = [
        { time: (now - 3600) as Time, value: currentPrice },
        { time: now as Time, value: currentPrice },
      ];
      seriesRef.current.setData(placeholderData);
      chartRef.current?.timeScale().fitContent();
    } else {
      seriesRef.current.setData([]);
    }
  }, [data, currentPrice]);

  return (
    <div className={cn('relative w-full rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-950', className)}>
      <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
        Probability Chart (Yes)
      </h3>
      <div ref={chartContainerRef} className="h-[300px] w-full" />
      {(!data || data.length === 0) && currentPrice === undefined && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80">
          <span className="text-gray-400">Chart data coming soon</span>
        </div>
      )}
    </div>
  );
}