import {Pipe, PipeTransform} from '@angular/core'

const units = [
  {unit: 'd', value: 86_400_000},
  {unit: 'h', value: 3_600_000},
  {unit: 'm', value: 60_000},
  {unit: 's', value: 1_000},
  {unit: 'ms', value: 1},
]

@Pipe({
  name: 'elapsed',
  standalone: true,
})
export class ElapsedPipe implements PipeTransform {
  transform(elapsedTimeMs: number): string {
    if (elapsedTimeMs === 0) return '0ms'

    let remainingTime = elapsedTimeMs
    const resultParts: string[] = []

    for (const {unit, value} of units) {
      if (unit === 'ms') {
        if (remainingTime > 0 || resultParts.length === 0) {
          // If we have less than 1ms total, show high precision
          if (resultParts.length === 0 && remainingTime < 1) {
            const formatted = remainingTime.toFixed(3)
            const trimmed = formatted.replace(/\.?0+$/, '')
            if (trimmed !== '0') {
              resultParts.push(`${trimmed}${unit}`)
            } else {
              resultParts.push(`0${unit}`)
            }
          } else {
            // Otherwise round to whole ms
            const amount = Math.round(remainingTime)
            if (amount > 0 || resultParts.length === 0) {
              resultParts.push(`${amount}${unit}`)
            }
          }
        }
        break
      }

      if (remainingTime >= value) {
        const amount = Math.floor(remainingTime / value)
        remainingTime -= amount * value
        resultParts.push(`${amount}${unit}`)
      }
    }

    const result = resultParts.join(' ')
    return result || '0ms'
  }
}
