export const getPeriod = () => {
  const saved = localStorage.getItem('production-period')
  if (saved) return JSON.parse(saved)

  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  }
}

export const setPeriod = (data) => {
  localStorage.setItem('production-period', JSON.stringify(data))
}
