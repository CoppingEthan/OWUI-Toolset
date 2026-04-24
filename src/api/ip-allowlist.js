/**
 * ALLOWED_OWUI_INSTANCES matcher. Supports: '*' (any), exact,
 * wildcards ('10.0.0.*', '192.168.*'), and CIDR ('10.0.0.0/8').
 *
 * Note: when the server runs behind a reverse proxy, set
 * `app.set('trust proxy', ...)` before relying on req.ip.
 */

function parseAllowedInstances() {
  const raw = process.env.ALLOWED_OWUI_INSTANCES || '*';
  return raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

function ipToNumber(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isIpInCidr(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = bits ? parseInt(bits, 10) : 32;
  if (isNaN(mask) || mask < 0 || mask > 32) return false;
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  if (ipNum === null || rangeNum === null) return false;
  const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  return (ipNum & maskBits) === (rangeNum & maskBits);
}

function isIpMatchingWildcard(ip, pattern) {
  const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  return regex.test(ip);
}

export function isInstanceAllowed(instanceOrIp) {
  const allowedPatterns = parseAllowedInstances();
  if (allowedPatterns.includes('*') || allowedPatterns.length === 0) return true;

  const ip = instanceOrIp.split(':')[0];
  const instancePort = instanceOrIp.split(':')[1];

  for (const pattern of allowedPatterns) {
    const [patternIp, patternPort] = pattern.split(':');

    if (pattern === instanceOrIp || patternIp === ip) {
      if (patternPort && instancePort && patternPort !== instancePort) continue;
      return true;
    }
    if (patternIp.includes('/') && isIpInCidr(ip, patternIp)) return true;
    if (patternIp.includes('*') && isIpMatchingWildcard(ip, patternIp)) return true;
  }
  return false;
}
