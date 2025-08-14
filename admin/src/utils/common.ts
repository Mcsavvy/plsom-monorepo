export function getStandardPhoneNumber(phoneNumber: string) {
  if (!phoneNumber) return null;
  if (phoneNumber.startsWith('+')) return phoneNumber;
  if (phoneNumber.startsWith('0')) return `+234${phoneNumber.slice(1)}`;
  return `+234${phoneNumber}`;
}
