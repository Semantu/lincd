export const LINCD_DATA_ROOT = 'https://data.lincd.org/';

export const sanitizeUriFragment = (value: string) => {
  if (!value) return value;
  return value
    .replace(/\u200B/g, '')
    .replace(/[^\w]+/g, '-')
    .toLowerCase();
};

export const getNodeShapeUri = (packageName: string, shapeName: string) => {
  return `${LINCD_DATA_ROOT}module/${sanitizeUriFragment(
    packageName,
  )}/shape/${sanitizeUriFragment(shapeName)}`;
};
