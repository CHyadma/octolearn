import raw from './course.json';
import type { CourseData } from '../domain/types';
import { validateCourse } from '../domain/validate';

export const courseData = raw as CourseData;

if (__DEV__) {
  const errors = validateCourse(courseData);
  if (errors.length) console.warn('[course.json]', errors);
}
