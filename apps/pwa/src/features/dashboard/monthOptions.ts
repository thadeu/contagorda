export interface YearGroup {
  year: string
  months: string[]
}

/**
 * Builds the picker's range from the months that hold data.
 *
 * A fixed window either hides months that exist or offers empty ones that lead
 * nowhere, so the list runs from the oldest month with data to the newest.
 *
 * In calendar order, oldest first: the past is above and the future below, the
 * way a calendar reads. The picker opens scrolled to the current month, so what
 * is behind you is a scroll up and what is ahead is a scroll down.
 * Every month in between is included even when empty — a gap in the sequence
 * would read as a bug, and an empty month is a legitimate thing to look at.
 *
 * The current month is always present, so a brand-new account still has
 * somewhere to be.
 */
export function buildMonthOptions(withData: string[], current: string): YearGroup[] {
  const known = [...withData, current].sort()
  const first = known[0]
  const last = known[known.length - 1]

  const months: string[] = []
  let cursor = first

  while (cursor <= last) {
    months.push(cursor)
    cursor = nextMonth(cursor)
  }

  return groupByYear(months)
}

function nextMonth(month: string): string {
  const [year, index] = month.split('-').map(Number)

  return index === 12
    ? `${year + 1}-01`
    : `${year}-${String(index + 1).padStart(2, '0')}`
}

function groupByYear(months: string[]): YearGroup[] {
  const groups: YearGroup[] = []

  for (const month of months) {
    const year = month.slice(0, 4)
    const last = groups[groups.length - 1]

    if (last?.year === year) {
      last.months.push(month)
    } else {
      groups.push({ year, months: [month] })
    }
  }

  return groups
}
