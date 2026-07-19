import { useMemo } from 'react';

export interface TimerInputs {
  mcuClockMHz: number; // e.g. 16
  timerMode: 'Normal' | 'CTC' | 'FastPWM' | 'PhaseCorrect';
  prescaler: number; // 1, 8, 64, 256, 1024
  topValue: number; // TOP value e.g. 255, 1023, 10000 etc.
  ocrValue: number; // Compare match value
  mcuType: 'ATmega328P' | 'STM32';
}

export interface PWMChartPoint {
  timeMs: number;
  counter: number;
  output: number; // 0 or 1
}

export interface TimerResults {
  pwmFrequencyHz: number;
  dutyCyclePercent: number;
  timePeriodMs: number;
  chartData: PWMChartPoint[];
  atmegaCode: string;
  stm32Code: string;
}

export function useTimerPWM(inputs: TimerInputs): TimerResults {
  return useMemo(() => {
    const { mcuClockMHz, timerMode, prescaler, topValue, ocrValue } = inputs;
    const f_cpu = mcuClockMHz * 1000000;
    const clkPrescaled = f_cpu / prescaler;

    let pwmFrequencyHz = 0;
    let dutyCyclePercent = 0;

    // Constrain OCR to TOP
    const OCR = Math.min(topValue, Math.max(0, ocrValue));
    const TOP = Math.max(1, topValue);

    // 1. Calculations based on Mode
    if (timerMode === 'Normal') {
      // Normal mode wraps around at 16-bit MAX (65535) or custom TOP
      pwmFrequencyHz = clkPrescaled / (TOP + 1);
      dutyCyclePercent = 0; // No PWM duty cycle by default in Normal Mode
    } else if (timerMode === 'CTC') {
      // Clear Timer on Compare Match
      // Output frequency: Pin toggles on match, so f = F_cpu / (2 * N * (1 + OCR))
      pwmFrequencyHz = f_cpu / (2 * prescaler * (1 + OCR));
      dutyCyclePercent = 50; // Always 50% square wave in CTC Toggle mode
    } else if (timerMode === 'FastPWM') {
      // Fast PWM: f = F_cpu / (N * (1 + TOP))
      pwmFrequencyHz = f_cpu / (prescaler * (1 + TOP));
      dutyCyclePercent = (OCR / TOP) * 100;
    } else if (timerMode === 'PhaseCorrect') {
      // Phase Correct PWM: f = F_cpu / (2 * N * TOP)
      pwmFrequencyHz = f_cpu / (2 * prescaler * TOP);
      dutyCyclePercent = (OCR / TOP) * 100;
    }

    // Standardize metrics
    pwmFrequencyHz = Math.round(pwmFrequencyHz * 100) / 100;
    dutyCyclePercent = Math.round(dutyCyclePercent * 10) / 10;
    const timePeriodMs = pwmFrequencyHz > 0 ? (1000 / pwmFrequencyHz) : 0;

    // 2. Generate 2D Waveform points over 3 cycles
    const chartData: PWMChartPoint[] = [];
    const pointsPerCycle = 40;
    const totalCycles = 3;
    const totalPoints = pointsPerCycle * totalCycles;

    // Compute time step based on total duration
    const totalTimeMs = timePeriodMs * totalCycles;
    const timeStepMs = totalTimeMs / totalPoints;

    let currentTcnt = 0;
    let isCountingUp = true;
    let outputState = 0;

    for (let i = 0; i <= totalPoints; i++) {
      const timeMs = i * timeStepMs;
      const cycleProgress = (i % pointsPerCycle) / pointsPerCycle; // 0 to 1

      if (timerMode === 'Normal') {
        // Ramp up sawtooth
        currentTcnt = Math.round(cycleProgress * TOP);
        outputState = 0; // Off
      } else if (timerMode === 'CTC') {
        // Toggles at half progress (which represents compare match in square wave output)
        currentTcnt = Math.round(cycleProgress * TOP);
        outputState = cycleProgress < 0.5 ? 1 : 0;
      } else if (timerMode === 'FastPWM') {
        // Ramp up sawtooth
        currentTcnt = Math.round(cycleProgress * TOP);
        // Non-inverted Fast PWM: High while TCNT < OCR, low otherwise
        outputState = currentTcnt <= OCR ? 1 : 0;
      } else if (timerMode === 'PhaseCorrect') {
        // Triangle wave
        if (cycleProgress <= 0.5) {
          // Counting up
          currentTcnt = Math.round((cycleProgress / 0.5) * TOP);
        } else {
          // Counting down
          currentTcnt = Math.round((1 - (cycleProgress - 0.5) / 0.5) * TOP);
        }
        // Non-inverted Phase Correct: High when counting up and TCNT <= OCR,
        // and high when counting down and TCNT <= OCR
        outputState = currentTcnt <= OCR ? 1 : 0;
      }

      chartData.push({
        timeMs: Math.round(timeMs * 1000) / 1000,
        counter: currentTcnt,
        output: outputState
      });
    }

    // 3. Generate register-level initialization C-code for ATmega328P Timer 1
    let atmegaCode = `/* EEE 4109: ATmega328P 16-Bit Timer 1 Configuration */
#include <avr/io.h>
#include <avr/interrupt.h>

void timer1_init(void) {
    // Set OC1A (Pin PB1 / Digital 9) as output
    DDRB |= (1 << DDB1);

    // Reset Control Registers
    TCCR1A = 0;
    TCCR1B = 0;

    // Set TOP and Compare registers
    ICR1 = ${TOP};       // Set TOP value
    OCR1A = ${OCR};      // Set compare match value (Duty Cycle)`;

    if (timerMode === 'Normal') {
      atmegaCode += `

    // Mode 0: Normal Mode (TOP = 0xFFFF)
    // No output hardware toggling, Timer overflows
    TCCR1A |= (0 << WGM11) | (0 << WGM10);
    TCCR1B |= (0 << WGM13) | (0 << WGM12);`;
    } else if (timerMode === 'CTC') {
      atmegaCode += `

    // Mode 4: CTC Mode with OCR1A as TOP
    // Toggle OC1A on compare match (COM1A0 = 1)
    TCCR1A |= (1 << COM1A0);
    TCCR1B |= (0 << WGM13) | (1 << WGM12); // CTC Mode 4`;
    } else if (timerMode === 'FastPWM') {
      atmegaCode += `

    // Mode 14: Fast PWM using ICR1 as TOP (prescaled freq)
    // Non-inverted mode: Clear OC1A on compare match, set on BOTTOM
    TCCR1A |= (1 << COM1A1) | (1 << WGM11);
    TCCR1B |= (1 << WGM13) | (1 << WGM12);`;
    } else if (timerMode === 'PhaseCorrect') {
      atmegaCode += `

    // Mode 10: Phase Correct PWM with ICR1 as TOP
    // Non-inverted mode: Clear OC1A on Compare Match when counting up, Set when counting down
    TCCR1A |= (1 << COM1A1) | (1 << WGM11);
    TCCR1B |= (1 << WGM13) | (0 << WGM12);`;
    }

    // Set Clock prescaler
    if (prescaler === 1) atmegaCode += `\n    TCCR1B |= (1 << CS10);   // Prescaler = 1`;
    else if (prescaler === 8) atmegaCode += `\n    TCCR1B |= (1 << CS11);   // Prescaler = 8`;
    else if (prescaler === 64) atmegaCode += `\n    TCCR1B |= (1 << CS11) | (1 << CS10); // Prescaler = 64`;
    else if (prescaler === 256) atmegaCode += `\n    TCCR1B |= (1 << CS12);  // Prescaler = 256`;
    else if (prescaler === 1024) atmegaCode += `\n    TCCR1B |= (1 << CS12) | (1 << CS10); // Prescaler = 1024`;

    atmegaCode += `
}

int main(void) {
    timer1_init();
    while (1) {
        // Main Loop
    }
}`;

    // 4. Generate HAL C-code for STM32 Timer configuration
    let stm32Code = `/* EEE 4109: STM32 HAL Timer 3 Configuration (TIM3 Channel 1) */
#include "stm32f4xx_hal.h"

TIM_HandleTypeDef htim3;

void MX_TIM3_Init(void) {
    TIM_ClockConfigTypeDef sClockSourceConfig = {0};
    TIM_MasterConfigTypeDef sMasterConfig = {0};
    TIM_OC_InitTypeDef sConfigOC = {0};

    htim3.Instance = TIM3;
    htim3.Init.Prescaler = ${prescaler - 1}; // Prescaler: ${prescaler}
    htim3.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim3.Init.Period = ${TOP}; // Period / ARR value
    htim3.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;`;

    if (timerMode === 'PhaseCorrect') {
      stm32Code += `\n    htim3.Init.CounterMode = TIM_COUNTERMODE_CENTERALIGNED1; // Phase Correct Triangle`;
    } else {
      stm32Code += `\n    htim3.Init.CounterMode = TIM_COUNTERMODE_UP;`;
    }

    stm32Code += `
    htim3.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;
    if (HAL_TIM_Base_Init(&htim3) != HAL_OK) {
        Error_Handler();
    }

    sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
    if (HAL_TIM_ConfigClockSource(&htim3, &sClockSourceConfig) != HAL_OK) {
        Error_Handler();
    }

    if (HAL_TIM_PWM_Init(&htim3) != HAL_OK) {
        Error_Handler();
    }

    sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
    sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
    if (HAL_TIMEx_MasterConfigSynchronization(&htim3, &sMasterConfig) != HAL_OK) {
        Error_Handler();
    }

    sConfigOC.OCMode = TIM_OCMODE_PWM1;
    sConfigOC.Pulse = ${OCR}; // Compare Match value / CCR1
    sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
    sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
    if (HAL_TIM_PWM_ConfigChannel(&htim3, &sConfigOC, TIM_CHANNEL_1) != HAL_OK) {
        Error_Handler();
    }

    // Configure GPIO alternate function mapping to PA6 (TIM3_CH1)
    __HAL_RCC_GPIOA_CLK_ENABLE();
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_6;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    GPIO_InitStruct.Alternate = GPIO_AF2_TIM3;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    // Start PWM signal output
    HAL_TIM_PWM_Start(&htim3, TIM_CHANNEL_1);
}`;

    return {
      pwmFrequencyHz,
      dutyCyclePercent,
      timePeriodMs: Math.round(timePeriodMs * 1000) / 1000,
      chartData,
      atmegaCode,
      stm32Code
    };
  }, [inputs.mcuClockMHz, inputs.timerMode, inputs.prescaler, inputs.topValue, inputs.ocrValue]);
}
