/**
 * Standard Units of Measurement for Services, Courses, and Items
 */

export const STANDARD_UNITS = [
  'Unit',
  'Course',
  'Semester',
  'Term',
  'Program',
  'Session',
  'Class',
  'Student',
  'Seat',
  'Month',
  'Year',
  'Day',
  'Hour',
  'Project',
  'Qty',
  'Package',
  'Domain',
  'Server',
  'License',
];

export const isStandardUnit = (unit) => {
  if (!unit) return false;
  return STANDARD_UNITS.includes(unit);
};
