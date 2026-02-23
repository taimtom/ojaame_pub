// ----------------------------------------------------------------------
export function paramCase(str) {
  // Check if the string is already in param-case format
  const isAlreadyParamCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str);
  if (isAlreadyParamCase) {
    return str;
  }

  return str
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace whitespace with dashes
    .replace(/[^a-z0-9-]/g, '')  // Remove invalid characters
    .replace(/-+/g, '-')         // Collapse multiple dashes
    .replace(/^-|-$/g, '');       // Trim any starting or ending dash
}

// ----------------------------------------------------------------------
export function snakeCase(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// ----------------------------------------------------------------------
export function sentenceCase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
