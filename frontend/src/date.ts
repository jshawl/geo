const shift = (dateStr: string, by: number) => {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(
    parseInt(year),
    parseInt(month ?? 1) - 1,
    parseInt(day ?? 1) || 1
  );
  if (!month) {
    date.setFullYear(date.getFullYear() + by);
    return String(date.getFullYear());
  }
  if (!day) {
    date.setMonth(date.getMonth() + by);
    return date.toISOString().slice(0, 7);
  }
  date.setDate(date.getDate() + by);
  return date.toISOString().slice(0, 10);
};

export const prev = (dateStr: string) => shift(dateStr, -1);

export const next = (dateStr: string) => shift(dateStr, 1);
