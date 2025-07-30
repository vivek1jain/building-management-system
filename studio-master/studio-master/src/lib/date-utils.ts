

import type { FinancialQuarterOption } from '@/types';
import { 
  startOfDay, 
  getYear, 
  addYears, 
  differenceInMonths, 
  addMonths, 
  subDays, 
  isBefore, 
  format,
  getMonth as dateFnsGetMonth,
  getDate as dateFnsGetDate,
  subMonths,
  parseISO
} from 'date-fns';

export const getFinancialYearForDate = (
    targetDate: Date,
    fyStartDateSetting: Date | null
  ): { fyLabel: string, fyStartDate: Date } => {
    
    const effStartMonth = fyStartDateSetting ? dateFnsGetMonth(fyStartDateSetting) : 0; // Default to Jan
    const effStartDay = fyStartDateSetting ? dateFnsGetDate(fyStartDateSetting) : 1; // Default to 1st

    let fyStartDateForYear = new Date(getYear(targetDate), effStartMonth, effStartDay);
    if (isBefore(targetDate, fyStartDateForYear)) {
      fyStartDateForYear = addYears(fyStartDateForYear, -1);
    }
    
    const startYear = getYear(fyStartDateForYear);
    const fyEndDate = subDays(addYears(fyStartDateForYear, 1), 1);
    const endYear = getYear(fyEndDate);
    
    const fyLabel = startYear === endYear 
      ? `FY ${String(startYear)}` 
      : `FY ${String(startYear).slice(-2)}/${String(endYear).slice(-2)}`;

    return { fyLabel, fyStartDate: fyStartDateForYear };
};


// Function to generate financial quarter options based on FY start and current date
export const generateFinancialQuarterOptions = (
  fyStartDateSetting: Date | null,
  currentSystemDate: Date,
  futurePeriods: number,
  pastPeriods: number,
  formatType: 'quarter' | 'year' = 'quarter',
): FinancialQuarterOption[] => {
  const options: FinancialQuarterOption[] = [];
  const today = startOfDay(currentSystemDate);

  if (formatType === 'year') {
    // Logic for generating annual options (e.g., FY 24/25)
     for (let i = -pastPeriods; i < futurePeriods; i++) {
        const targetYearDate = addYears(today, i);
        const { fyLabel, fyStartDate } = getFinancialYearForDate(targetYearDate, fyStartDateSetting);
        
        options.push({
            value: format(fyStartDate, 'yyyy-MM-dd'),
            label: fyLabel,
            financialQuarterDisplayString: fyLabel,
            isPast: isBefore(addYears(fyStartDate, 1), today),
        });
    }

  } else {
    // Logic for generating quarterly options
    const { fyStartDate: currentFYStartDate } = getFinancialYearForDate(today, fyStartDateSetting);

    const monthsIntoFY = differenceInMonths(today, currentFYStartDate);
    const currentQuarterIndex = Math.floor(monthsIntoFY / 3);
    
    const totalQuartersToGenerate = futurePeriods + pastPeriods;
    const startQuarterIndexOffset = currentQuarterIndex - pastPeriods;
    
    for (let i = 0; i < totalQuartersToGenerate; i++) {
        const quarterIndexFromStart = startQuarterIndexOffset + i;
        const quarterStartDate = addMonths(currentFYStartDate, quarterIndexFromStart * 3);
        const { fyLabel, fyStartDate: quarterFYStartDate } = getFinancialYearForDate(quarterStartDate, fyStartDateSetting);
        
        const monthsFromFYStart = (
          (dateFnsGetMonth(quarterStartDate) - dateFnsGetMonth(quarterFYStartDate) + 12) % 12
        );
        const quarterNum = Math.floor(monthsFromFYStart / 3) + 1;
        
        const quarterEndDate = subDays(addMonths(quarterStartDate, 3), 1);
        const optionLabel = `Q${quarterNum} ${fyLabel} (${format(quarterStartDate, "MMM d")} - ${format(quarterEndDate, "MMM d, yyyy")})`;

        options.push({
            value: format(quarterStartDate, 'yyyy-MM-dd'),
            label: optionLabel,
            financialQuarterDisplayString: `Q${quarterNum} ${fyLabel}`,
            isPast: isBefore(addMonths(quarterStartDate, 3), today),
        });
    }
  }
  
  const uniqueOptions = Array.from(new Map(options.map(opt => [opt.value, opt])).values());
  
  return uniqueOptions.sort((a,b) => new Date(a.value).getTime() - new Date(b.value).getTime());
};
