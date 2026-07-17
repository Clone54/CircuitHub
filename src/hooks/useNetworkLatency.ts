import { useState, useMemo } from 'react';

export interface LatencyInputs {
  payloadSize: number; // KB
  activeNodes: number; // 1 to 1000
  bandwidth: number;   // Mbps
}

export function useNetworkLatency(initialInputs: LatencyInputs) {
  const [inputs, setInputs] = useState<LatencyInputs>(initialInputs);

  const stats = useMemo(() => {
    const { payloadSize, activeNodes, bandwidth } = inputs;

    // --- Direct to Cloud Scenario ---
    // 1. WAN Propagation Delay: ~80ms (remote data center roundtrip)
    const wanPropDelay = 80; 
    
    // 2. WAN Transmission Delay: Time to push N * payloadSize over WAN bandwidth
    // Total bits = activeNodes * payloadSize * 1024 * 8
    // Bandwidth in bits/sec = bandwidth * 1,000,000
    // Time (s) = Total bits / Bandwidth
    // Time (ms) = Time (s) * 1000
    const totalBitsCloud = activeNodes * payloadSize * 1024 * 8;
    const bandwidthBits = bandwidth * 1000000;
    const wanTransDelayCloud = (totalBitsCloud / bandwidthBits) * 1000;

    // 3. Cloud Processing/Ingestion Delay: Bottleneck of processing N individual database requests
    const cloudProcessingDelay = activeNodes * 0.25; // 0.25ms per raw payload

    const totalCloudLatency = wanPropDelay + wanTransDelayCloud + cloudProcessingDelay;
    
    // WAN Bandwidth consumption: payloadSize * activeNodes per second (assuming 1Hz transmission rate)
    const cloudBandwidthRate = (payloadSize * activeNodes) / 1024; // MB/s


    // --- Fog Node Architecture Scenario ---
    // 1. LAN Propagation Delay: ~2ms (local wifi/ethernet)
    const lanPropDelay = 2;

    // 2. LAN Transmission Delay (Local Gig LAN - 1000 Mbps)
    const lanBandwidthBits = 1000 * 1000000;
    const lanTransDelay = (totalBitsCloud / lanBandwidthBits) * 1000;

    // 3. Fog Edge processing & aggregation delay:
    const fogProcessingDelay = 15 + activeNodes * 0.05; // 15ms base overhead + 0.05ms per node

    // 4. Fog to Cloud WAN transmission delay of consolidated payload (always fixed at 2 KB)
    const consolidatedPayloadSize = 2; // KB
    const totalConsolidatedBits = consolidatedPayloadSize * 1024 * 8;
    const wanTransDelayFog = (totalConsolidatedBits / bandwidthBits) * 1000;

    // 5. Cloud processes 1 aggregated summary instead of N records
    const cloudAggProcessingDelay = 1.0; // 1ms

    const totalFogLatency = lanPropDelay + lanTransDelay + fogProcessingDelay + wanPropDelay + wanTransDelayFog + cloudAggProcessingDelay;

    // WAN Bandwidth consumption for Fog: Only the summarized payload (2 KB) sent over WAN
    const fogBandwidthRate = consolidatedPayloadSize / 1024; // MB/s

    // Efficiency calculations
    const latencySavingsPct = ((totalCloudLatency - totalFogLatency) / totalCloudLatency) * 100;
    const bandwidthSavingsPct = ((cloudBandwidthRate - fogBandwidthRate) / cloudBandwidthRate) * 100;

    return {
      cloud: {
        latency: parseFloat(totalCloudLatency.toFixed(1)),
        propDelay: wanPropDelay,
        transDelay: parseFloat(wanTransDelayCloud.toFixed(1)),
        processingDelay: parseFloat(cloudProcessingDelay.toFixed(1)),
        bandwidthRate: parseFloat(cloudBandwidthRate.toFixed(3)), // MB/s
      },
      fog: {
        latency: parseFloat(totalFogLatency.toFixed(1)),
        edgeToFogDelay: parseFloat((lanPropDelay + lanTransDelay).toFixed(1)),
        processingDelay: parseFloat(fogProcessingDelay.toFixed(1)),
        fogToCloudDelay: parseFloat((wanPropDelay + wanTransDelayFog + cloudAggProcessingDelay).toFixed(1)),
        bandwidthRate: parseFloat(fogBandwidthRate.toFixed(4)), // MB/s
      },
      savings: {
        latency: parseFloat(Math.max(0, latencySavingsPct).toFixed(1)),
        bandwidth: parseFloat(Math.max(0, bandwidthSavingsPct).toFixed(1)),
      }
    };
  }, [inputs]);

  return {
    inputs,
    setInputs,
    stats,
  };
}
