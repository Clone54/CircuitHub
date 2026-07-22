import { useState, useEffect, useRef } from 'react';
import { MatlabDataset } from '../types';

export function useSweepAnimation(
  datasets: MatlabDataset[],
  isAnimated: boolean,
  animationSpeedMs: number = 20
) {
  const [displayedDatasets, setDisplayedDatasets] = useState<MatlabDataset[]>([]);
  
  useEffect(() => {
    if (!isAnimated || datasets.length === 0) {
      setDisplayedDatasets(datasets);
      return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();
    let currentIndex = 0;
    
    const maxDataLength = Math.max(...datasets.map(ds => ds.data.length));

    // Reset initial state
    setDisplayedDatasets(datasets.map(ds => ({ ...ds, data: [] })));

    const animate = (time: number) => {
      // Determine how many points to add based on elapsed time to keep animation speed consistent
      const elapsed = time - lastTime;
      const pointsToAdd = Math.max(1, Math.floor(elapsed / animationSpeedMs));

      if (elapsed >= animationSpeedMs) {
        currentIndex += pointsToAdd;
        
        setDisplayedDatasets(datasets.map(ds => ({
          ...ds,
          data: ds.data.slice(0, currentIndex)
        })));
        
        lastTime = time;
      }

      if (currentIndex < maxDataLength) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [datasets, isAnimated, animationSpeedMs]);

  return displayedDatasets;
}
