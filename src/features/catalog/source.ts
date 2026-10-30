export interface ExamSource {
  year: number;
  position: number;
}

export function examSource(source: string): ExamSource | null {
  const match = /prijemni (\d{4}), zadatak (\d+)/i.exec(source);
  return match ? { year: Number(match[1]), position: Number(match[2]) } : null;
}
