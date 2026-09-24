export function deviceLabel(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) {
    return 'iPhone'
  }
  if (/iPad/i.test(userAgent)) {
    return 'iPad'
  }
  if (/Android/i.test(userAgent)) {
    return 'Android'
  }
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'Mac'
  }
  if (/Windows/i.test(userAgent)) {
    return 'Windows'
  }
  if (/Linux/i.test(userAgent)) {
    return 'Linux'
  }
  return 'Устройство'
}
