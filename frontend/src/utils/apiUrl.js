export function resolveApiUrl(value) {
  return value?.trim().replace(/\/+$/, '') || '/api';
}

export function getStaticBaseUrl(apiUrl) {
  return resolveApiUrl(apiUrl).replace(/\/api$/, '');
}
