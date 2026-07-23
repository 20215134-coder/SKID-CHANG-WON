// Supabase가 interval 컬럼을 "HH:MM:SS" 또는 "D days HH:MM:SS" 형태의 텍스트로 반환하는 것을 사람이 읽기 쉬운 형태로 변환한다.
export function formatWorkDuration(totalWorkTime: string): string {
  const dayMatch = totalWorkTime.match(/^(\d+)\s+days?\s+(.+)$/);
  const days = dayMatch ? Number(dayMatch[1]) : 0;
  const timePart = dayMatch ? dayMatch[2] : totalWorkTime;

  const [hoursStr, minutesStr] = timePart.split(":");
  const hours = Number(hoursStr ?? 0) + days * 24;
  const minutes = Number(minutesStr ?? 0);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}분`);
  return parts.join(" ");
}
