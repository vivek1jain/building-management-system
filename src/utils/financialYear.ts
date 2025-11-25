import { Building } from '../types'

type BuildingFinancialSettings = NonNullable<Building['financialSettings']>

export interface FinancialPeriod {
  id: string
  label: string
  startDate: Date
  endDate: Date
  dueDate: Date
  year: number
  periodNumber: number
  periodType: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'H1' | 'H2' | 'Annual'
}

export interface FinancialYearInfo {
  currentYear: number
  currentPeriod: FinancialPeriod | null
  nextPeriods: FinancialPeriod[]
  previousPeriod: FinancialPeriod | null
  financialYearStart: Date
  financialYearEnd: Date
}

/**
 * Calculate financial year information based on building settings
 */
export const getFinancialYearInfo = (
  settings: BuildingFinancialSettings,
  currentDate: Date = new Date()
): FinancialYearInfo => {
  const { startMonth, startDay, currentYear, serviceChargeFrequency } = settings

  // Determine which financial year the current date falls into
  // Start by assuming it's in the current calendar year
  let testYearStart = new Date(currentDate.getFullYear(), startMonth - 1, startDay)
  let testYearEnd = new Date(currentDate.getFullYear() + 1, startMonth - 1, startDay - 1)
  
  // If the test date is before the financial year start, use the previous year
  if (currentDate < testYearStart) {
    testYearStart.setFullYear(testYearStart.getFullYear() - 1)
    testYearEnd.setFullYear(testYearEnd.getFullYear() - 1)
  }
  
  const financialYearStart = testYearStart
  const financialYearEnd = testYearEnd

  const periods = generatePeriodsForYear(settings, financialYearStart)
  
  // Find current period
  const currentPeriod = periods.find(period => 
    currentDate >= period.startDate && currentDate <= period.endDate
  ) || null

  // Find previous period (most recent completed period)
  const previousPeriod = periods
    .filter(period => period.endDate < currentDate)
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0] || null

  // Get next 3 periods that are available for demand generation
  // (current period and next 2, or next 3 if current period already has demands)
  let nextPeriods: FinancialPeriod[] = []
  const currentPeriodIndex = currentPeriod ? periods.indexOf(currentPeriod) : -1
  
  if (currentPeriodIndex >= 0) {
    // Include current period and next 2
    nextPeriods = periods.slice(currentPeriodIndex, currentPeriodIndex + 3)
  } else {
    // If we're between periods, get the next upcoming periods
    const upcomingPeriods = periods.filter(period => period.startDate > currentDate)
    nextPeriods = upcomingPeriods.slice(0, 3)
  }

  // If we don't have enough periods in current year, add from next year
  if (nextPeriods.length < 3) {
    const nextYearStart = new Date(financialYearStart)
    nextYearStart.setFullYear(nextYearStart.getFullYear() + 1)
    const nextYearPeriods = generatePeriodsForYear(settings, nextYearStart)
    const remainingNeeded = 3 - nextPeriods.length
    nextPeriods = [...nextPeriods, ...nextYearPeriods.slice(0, remainingNeeded)]
  }

  return {
    currentYear: financialYearStart.getFullYear(),
    currentPeriod,
    nextPeriods,
    previousPeriod,
    financialYearStart,
    financialYearEnd
  }
}

/**
 * Generate periods for a financial year based on frequency
 */
export const generatePeriodsForYear = (
  settings: BuildingFinancialSettings,
  yearStart: Date
): FinancialPeriod[] => {
  const { serviceChargeFrequency, paymentGracePeriod = 30 } = settings
  const periods: FinancialPeriod[] = []
  const year = yearStart.getFullYear()

  switch (serviceChargeFrequency) {
    case 'quarterly':
      for (let quarter = 1; quarter <= 4; quarter++) {
        const startDate = new Date(yearStart)
        startDate.setMonth(yearStart.getMonth() + (quarter - 1) * 3)
        
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 3)
        endDate.setDate(endDate.getDate() - 1)
        
        const dueDate = new Date(endDate)
        dueDate.setDate(dueDate.getDate() + paymentGracePeriod)

        periods.push({
          id: `${year}-Q${quarter}`,
          label: `Q${quarter} ${year}`,
          startDate,
          endDate,
          dueDate,
          year,
          periodNumber: quarter,
          periodType: `Q${quarter}` as any
        })
      }
      break

    case 'annually':
      const startDate = new Date(yearStart)
      const endDate = new Date(yearStart)
      endDate.setFullYear(endDate.getFullYear() + 1)
      endDate.setDate(endDate.getDate() - 1)
      
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + paymentGracePeriod)

      periods.push({
        id: `${year}-Annual`,
        label: `Annual ${year}`,
        startDate,
        endDate,
        dueDate,
        year,
        periodNumber: 1,
        periodType: 'Annual'
      })
      break

    case 'monthly':
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(yearStart)
        startDate.setMonth(yearStart.getMonth() + month)
        
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0) // Last day of the month
        
        const dueDate = new Date(endDate)
        dueDate.setDate(dueDate.getDate() + paymentGracePeriod)

        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]

        periods.push({
          id: `${year}-${month + 1}`,
          label: `${monthNames[month]} ${year}`,
          startDate,
          endDate,
          dueDate,
          year,
          periodNumber: month + 1,
          periodType: `Q${Math.ceil((month + 1) / 3)}` as any // For compatibility
        })
      }
      break
  }

  return periods
}

/**
 * Format period for display
 */
export const formatPeriod = (period: FinancialPeriod): string => {
  return period.label
}

/**
 * Check if a period is overdue for payment
 */
export const isPeriodOverdue = (period: FinancialPeriod, currentDate: Date = new Date()): boolean => {
  return currentDate > period.dueDate
}

/**
 * Get the most recent period that demands should have been raised for
 */
export const getLastDemandPeriod = (
  settings: BuildingFinancialSettings,
  currentDate: Date = new Date()
): FinancialPeriod | null => {
  const info = getFinancialYearInfo(settings, currentDate)
  return info.previousPeriod
}

/**
 * Calculate payment due date for a period
 */
export const calculatePaymentDueDate = (
  periodEndDate: Date,
  gracePeriodDays: number = 30
): Date => {
  const dueDate = new Date(periodEndDate)
  dueDate.setDate(dueDate.getDate() + gracePeriodDays)
  return dueDate
}
