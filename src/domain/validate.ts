import type { CourseData } from './types';

/**
 * Light runtime check for course JSON. Content will eventually come from an
 * API, so we fail loudly on malformed data instead of rendering a broken path.
 */
export function validateCourse(data: CourseData): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const claim = (id: string, where: string) => {
    if (ids.has(id)) errors.push(`Duplicate id "${id}" (${where})`);
    ids.add(id);
  };
  if (!data.units?.length) errors.push('Course has no units');
  data.units?.forEach((u) => {
    claim(u.id, 'unit');
    if (!u.lessons.length) errors.push(`${u.id}: no lessons`);
    u.lessons.forEach((l) => {
      claim(l.id, u.id);
      if (!u.comingSoon && !l.videoUrl) errors.push(`${l.id}: missing videoUrl`);
    });
    claim(u.quiz.id, u.id);
    if (!u.comingSoon) {
      if (u.quiz.questions.length < 1) errors.push(`${u.quiz.id}: no questions`);
      u.quiz.questions.forEach((q) => {
        if (q.answerIndex < 0 || q.answerIndex >= q.options.length) {
          errors.push(`${u.quiz.id}/${q.id}: answerIndex out of range`);
        }
      });
    }
  });
  return errors;
}
