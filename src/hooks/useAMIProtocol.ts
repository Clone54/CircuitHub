import { useState, useEffect, useRef } from 'react';

export type AMIProtocol = 'modbus' | 'dnp3' | 'iec61850';
export type AMINetworkLayer = 'han' | 'nan' | 'wan';
export type TransmissionState = 'idle' | 'appliance_to_meter' | 'meter_to_concentrator' | 'concentrator_to_server' | 'complete';

export interface AMIPayload {
  protocol: string;
  header: Record<string, string | number>;
  payload: Record<string, any>;
}

export function useAMIProtocol() {
  const [protocol, setProtocol] = useState<AMIProtocol>('modbus');
  const [networkLayer, setNetworkLayer] = useState<AMINetworkLayer>('nan');
  const [transmissionState, setTransmissionState] = useState<TransmissionState>('idle');
  const [packetDetails, setPacketDetails] = useState<string>('System idle. Ready to poll smart grid devices.');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [errorRate, setErrorRate] = useState<number>(0);

  // Interval timer ref for managing sequential step animation
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic parameters based on Network Layer
  useEffect(() => {
    switch (networkLayer) {
      case 'han':
        setLatencyMs(15);
        setErrorRate(0.8);
        break;
      case 'nan':
        setLatencyMs(120);
        setErrorRate(2.4);
        break;
      case 'wan':
        setLatencyMs(45);
        setErrorRate(0.1);
        break;
    }
  }, [networkLayer]);

  // Generate dynamic payload based on selected protocol
  const getPayload = (): AMIPayload => {
    const timestamp = new Date().toISOString();
    
    switch (protocol) {
      case 'modbus':
        return {
          protocol: 'Modbus RTU over TCP',
          header: {
            'Transaction ID': '4821',
            'Protocol ID': '0000 (Modbus)',
            'Length': '19 bytes',
            'Unit ID / Slave Address': '12'
          },
          payload: {
            'FC03 Holding Registers': {
              '40001 (Phase A Voltage)': '230.45 V',
              '40002 (Phase B Voltage)': '229.80 V',
              '40003 (Phase C Voltage)': '231.12 V',
              '40004 (Active Power kW)': '4.82 kW',
              '40005 (Reactive Power kVAR)': '1.15 kVAR',
              '40006 (Grid Frequency x100)': '5002 (50.02 Hz)',
              '40007 (Current THD %)': '2.14 %',
              '40008 (Breaker Status)': '1 (CLOSED)'
            }
          }
        };

      case 'dnp3':
        return {
          protocol: 'DNP3 (IEEE 1815-2012)',
          header: {
            'Source Address': '1024 (Smart Meter Outstation)',
            'Destination Address': '1 (Utility Control SCADA)',
            'Control Byte': '0xC4 (DIR, PRM, FC=1: Read)',
            'Sequence Number': '15'
          },
          payload: {
            'Group 30 Var 2 (32-bit Analog Inputs)': [
              { 'Index 0 (Phase A Voltage)': '230450 mV', 'Flag': '0x01 (ONLINE)', 'Timestamp': timestamp },
              { 'Index 1 (Active Power)': '4820 W', 'Flag': '0x01 (ONLINE)', 'Timestamp': timestamp },
              { 'Index 2 (Reactive Power)': '1150 VAR', 'Flag': '0x01 (ONLINE)', 'Timestamp': timestamp }
            ],
            'Group 20 Var 1 (32-bit Running Counter)': [
              { 'Index 0 (Total kWh Cumulative)': '12458.32 kWh', 'Flag': '0x01 (ONLINE)' }
            ],
            'Group 1 Var 2 (Binary Input with Status)': [
              { 'Index 0 (Tamper Switch)': '0 (NORMAL)', 'Flag': '0x01 (ONLINE)' },
              { 'Index 1 (Breaker Control)': '1 (CLOSED)', 'Flag': '0x01 (ONLINE)' }
            ]
          }
        };

      case 'iec61850':
        return {
          protocol: 'IEC 61850 Logical Nodes (MMS Mapping)',
          header: {
            'MMS PDU Type': 'confirmed-ResponsePDU',
            'Invoke ID': '105293',
            'Logical Device': 'SmartMeter_TEM01',
            'Logical Node Class': 'MMXU (Measurement)'
          },
          payload: {
            'MMXU1.PhV.phsA (Phase A Voltage)': {
              'cVal.mag.f': 230.45,
              'phsA.units': 'V',
              'q (Quality)': { 'validity': 'good', 'detailQualifier': '00000000' },
              't (Timestamp)': timestamp
            },
            'MMXU1.TotW (Total Active Power)': {
              'mag.f': 4.82,
              'units': 'kW',
              'q': 'good'
            },
            'MMXU1.TotVAr (Total Reactive Power)': {
              'mag.f': 1.15,
              'units': 'kVAR',
              'q': 'good'
            },
            'XCBR1.Pos.stVal (Circuit Breaker Position)': {
              'stVal': 'off (0) / closed (1)',
              'value': 'closed',
              'q': 'good',
              't': timestamp
            }
          }
        };
    }
  };

  const triggerTransmission = () => {
    // Clear any active timers
    if (timerRef.current) clearInterval(timerRef.current);

    setTransmissionState('appliance_to_meter');
    setPacketDetails(`[HAN - ${networkLayer === 'han' ? 'Zigbee' : 'Bluetooth'}] Local Home Appliance transmitting power consumption payload. Packet Size: 128 Bytes. Latency: ${latencyMs}ms.`);

    let currentStep: TransmissionState = 'appliance_to_meter';

    timerRef.current = setInterval(() => {
      if (currentStep === 'appliance_to_meter') {
        currentStep = 'meter_to_concentrator';
        setTransmissionState('meter_to_concentrator');
        setPacketDetails(`[NAN - ${networkLayer === 'nan' ? 'WiMAX/PLC Mesh' : 'Cellular Mesh'}] Smart Meter packing measurements into ${protocol.toUpperCase()} format. Routing packet through neighborhood data concentrator.`);
      } else if (currentStep === 'meter_to_concentrator') {
        currentStep = 'concentrator_to_server';
        setTransmissionState('concentrator_to_server');
        setPacketDetails(`[WAN - ${networkLayer === 'wan' ? 'Fiber/Ethernet' : 'Secure LTE'}] Data Concentrator multiplexing neighborhood AMI packets. Dispatching TCP stream to Central Utility MDMS (Meter Data Management System) Server.`);
      } else if (currentStep === 'concentrator_to_server') {
        currentStep = 'complete';
        setTransmissionState('complete');
        setPacketDetails(`[MDMS Server] Packet parsed successfully. ${protocol.toUpperCase()} payload written to SQL Server. MDMS DB response: 200 OK. Total estimated network RTT: ${(latencyMs * 3.2).toFixed(0)}ms.`);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, 1500);
  };

  const resetSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTransmissionState('idle');
    setPacketDetails('System idle. Ready to poll smart grid devices.');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    protocol,
    setProtocol,
    networkLayer,
    setNetworkLayer,
    transmissionState,
    triggerTransmission,
    resetSimulation,
    packetDetails,
    latencyMs,
    errorRate,
    payload: getPayload()
  };
}
