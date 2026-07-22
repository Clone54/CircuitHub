import { useState } from 'react';

export interface DataPoint {
  x: number;
  y: number;
}

export interface Dataset {
  id: string;
  name: string;
  color: string;
  plotType: 'continuous' | 'discrete';
  data: DataPoint[];
}

export interface MatlabChartData {
  status: 'success' | 'error';
  errorMessage: string;
  xAxisLabel: string;
  yAxisLabel: string;
  datasets: Dataset[];
}

export function useMatlabExecutor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<MatlabChartData | null>(null);

  const executeMatlab = async (code: string) => {
    setLoading(true);
    setError(null);
    setChartData(null);

    try {
      const response = await fetch('/api/matlab-execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to communicate with execution server.');
      }

      const data: MatlabChartData = await response.json();

      if (data.status === 'error') {
        setError(data.errorMessage || 'Unknown execution error occurred.');
      } else {
        // Validate arrays
        if (!Array.isArray(data.datasets)) {
          data.datasets = [];
        }
        setChartData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute MATLAB code.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    chartData,
    executeMatlab,
  };
}
