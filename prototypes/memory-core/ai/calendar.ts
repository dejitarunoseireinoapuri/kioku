export function calendar(at: string, zone: string) {
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: zone }).format(
    new Date(at),
  );
  const local = new Date(`${day}T12:00:00Z`);
  const relativeDay = (delta: number) => {
    const date = new Date(local);
    date.setUTCDate(date.getUTCDate() + delta);
    return date.toISOString().slice(0, 10);
  };
  const monday = -((local.getUTCDay() + 6) % 7);
  return {
    recordedAt: at,
    zone,
    localDay: day,
    yesterday: relativeDay(-1),
    tomorrow: relativeDay(1),
    week: Array.from({ length: 7 }, (_, i) => ({
      name: [
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
        "domingo",
      ][i],
      day: relativeDay(monday + i),
    })),
    previousWeek: {
      from: relativeDay(monday - 7),
      to: relativeDay(monday - 1),
    },
  };
}
