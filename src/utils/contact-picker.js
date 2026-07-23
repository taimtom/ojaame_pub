/** Contact Picker API helpers (mobile Chrome / supported browsers). */

function normalizeContactEntry(contact) {
  const rawName = Array.isArray(contact?.name) ? contact.name[0] : contact?.name;
  const rawTel = Array.isArray(contact?.tel) ? contact.tel[0] : contact?.tel;
  const name = rawName ? String(rawName).trim() : '';
  const phone = rawTel ? String(rawTel).trim() : '';
  return { name, phone };
}

export function isContactPickerSupported() {
  return (
    typeof navigator !== 'undefined'
    && navigator.contacts
    && typeof navigator.contacts.select === 'function'
  );
}

/**
 * Open the device contact picker.
 * @param {{ multiple?: boolean }} options
 * @returns {Promise<Array<{ name: string, phone: string }>>}
 */
export async function pickContactsFromDevice({ multiple = true } = {}) {
  if (!isContactPickerSupported()) {
    throw new Error('unsupported');
  }

  const contacts = await navigator.contacts.select(['name', 'tel'], { multiple });
  return (contacts || [])
    .map(normalizeContactEntry)
    .filter((entry) => entry.name || entry.phone);
}
