import { useState, useEffect, useRef } from 'react';

export interface TelemetryPoint {
  time: string;
  temp: number | null;
  humidity: number | null;
  mq2: number | null;
  distance: number | null;
}

export interface TelemetryConfig {
  dhtActive: boolean;
  mq2Active: boolean;
  ultrasonicActive: boolean;
  interval: number; // ms
  mq2Threshold: number; // ppm
}

export function useTelemetrySimulation(config: TelemetryConfig) {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const [current, setCurrent] = useState<{
    temp: number;
    humidity: number;
    mq2: number;
    distance: number;
  }>({
    temp: 24.5,
    humidity: 55.0,
    mq2: 120.0,
    distance: 80.0,
  });

  const [isAlarmActive, setIsAlarmActive] = useState(false);

  // Keep latest config in refs to avoid resetting interval on every config change, except for the interval itself
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    // Initialize with some seed data
    const initialData: TelemetryPoint[] = [];
    let temp = 24.5;
    let humidity = 55.0;
    let mq2 = 120.0;
    let distance = 80.0;

    const now = new Date();
    for (let i = 24; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * config.interval).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Random walk
      temp = Math.max(10, Math.min(50, temp + (Math.random() - 0.5) * 0.8));
      humidity = Math.max(20, Math.min(95, humidity + (Math.random() - 0.5) * 1.5));
      mq2 = Math.max(50, Math.min(600, mq2 + (Math.random() - 0.45) * 10));
      distance = Math.max(5, Math.min(400, distance + (Math.random() - 0.5) * 5));

      initialData.push({
        time: timeStr,
        temp: config.dhtActive ? parseFloat(temp.toFixed(1)) : null,
        humidity: config.dhtActive ? parseFloat(humidity.toFixed(1)) : null,
        mq2: config.mq2Active ? parseFloat(mq2.toFixed(0)) : null,
        distance: config.ultrasonicActive ? parseFloat(distance.toFixed(1)) : null,
      });
    }
    setData(initialData);
    setCurrent({
      temp: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      mq2: parseFloat(mq2.toFixed(0)),
      distance: parseFloat(distance.toFixed(1)),
    });
  }, [config.interval]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentConfig = configRef.current;
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setCurrent(prev => {
        // Generate new values with slight random walk
        // Temperature random walk with trend towards 26
        const dTemp = (Math.random() - 0.5) * 0.6 + (26 - prev.temp) * 0.05;
        const newTemp = Math.max(15, Math.min(45, prev.temp + dTemp));

        // Humidity random walk with trend towards 50
        const dHum = (Math.random() - 0.5) * 1.2 + (50 - prev.humidity) * 0.05;
        const newHum = Math.max(20, Math.min(90, prev.humidity + dHum));

        // MQ2 occasionally spikes or drifts
        // 5% chance of a localized smoke flare-up if active
        const hasSpike = Math.random() < 0.03;
        const dMq2 = hasSpike 
          ? (Math.random() * 80 + 40) 
          : (Math.random() - 0.5) * 8 + (120 - prev.mq2) * 0.02;
        const newMq2 = Math.max(30, Math.min(1000, prev.mq2 + dMq2));

        // Ultrasonic random walk
        const dDist = (Math.random() - 0.5) * 4 + (80 - prev.distance) * 0.01;
        const newDist = Math.max(2, Math.min(400, prev.distance + dDist));

        const updated = {
          temp: parseFloat(newTemp.toFixed(1)),
          humidity: parseFloat(newHum.toFixed(1)),
          mq2: parseFloat(newMq2.toFixed(0)),
          distance: parseFloat(newDist.toFixed(1)),
        };

        // Alarm status
        if (currentConfig.mq2Active && updated.mq2 > currentConfig.mq2Threshold) {
          setIsAlarmActive(true);
        } else if (!currentConfig.mq2Active || updated.mq2 <= currentConfig.mq2Threshold) {
          setIsAlarmActive(false);
        }

        setData(prevData => {
          const nextPoint: TelemetryPoint = {
            time: timeStr,
            temp: currentConfig.dhtActive ? updated.temp : null,
            humidity: currentConfig.dhtActive ? updated.humidity : null,
            mq2: currentConfig.mq2Active ? updated.mq2 : null,
            distance: currentConfig.ultrasonicActive ? updated.distance : null,
          };
          const nextData = [...prevData, nextPoint];
          if (nextData.length > 50) {
            nextData.shift();
          }
          return nextData;
        });

        return updated;
      });
    }, config.interval);

    return () => clearInterval(timer);
  }, [config.interval]);

  const triggerGasSpike = () => {
    setCurrent(prev => {
      const spikedMq2 = Math.min(1000, prev.mq2 + 150 + Math.random() * 100);
      if (config.mq2Active && spikedMq2 > config.mq2Threshold) {
        setIsAlarmActive(true);
      }
      return {
        ...prev,
        mq2: parseFloat(spikedMq2.toFixed(0)),
      };
    });
  };

  const clearAlarm = () => {
    setIsAlarmActive(false);
    setCurrent(prev => ({
      ...prev,
      mq2: 120.0,
    }));
  };

  return {
    data,
    current,
    isAlarmActive,
    triggerGasSpike,
    clearAlarm,
  };
}
