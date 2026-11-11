// wa.me wants the number in international form without "+" or spaces. Customers type Irish
// numbers as 087 123 4567, so a leading 0 becomes the 353 country code.
export function whatsappHref(phone: string): string {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) {
    // already international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = `353${digits.slice(1)}`;
  }
  return `https://wa.me/${digits}`;
}
