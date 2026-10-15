export const SESSION_EXPIRED_EVENT = 'mathvui:session-expired';

export function normalizeGrade(value) {
  if (!['string', 'number'].includes(typeof value)) return null;
  const grade = Number(value);
  return Number.isInteger(grade) && grade >= 1 && grade <= 5 ? grade : null;
}

export function clearSession(storage) {
  for (const key of ['token', 'user', 'selectedGrade']) storage.removeItem(key);
}

export function readSession(storage) {
  try {
    const token = storage.getItem('token');
    const user = JSON.parse(storage.getItem('user'));
    if (!token || !user || typeof user !== 'object' || Array.isArray(user) || !user.id) {
      clearSession(storage);
      return { user: null, grade: null };
    }
    return {
      user,
      grade: normalizeGrade(user.profile?.grade) ?? normalizeGrade(storage.getItem('selectedGrade')),
    };
  } catch {
    clearSession(storage);
    return { user: null, grade: null };
  }
}

export function saveSession(storage, token, user) {
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  const grade = normalizeGrade(user.profile?.grade);
  if (grade) storage.setItem('selectedGrade', String(grade));
  else storage.removeItem('selectedGrade');
  return grade;
}
