import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "KlinikHub";

export function generateTotpSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildTotp(email: string, secret: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
}

export async function buildQrCodeDataUrl(email: string, secret: string) {
  const totp = buildTotp(email, secret);
  return QRCode.toDataURL(totp.toString());
}

export function verifyTotpToken(email: string, secret: string, token: string) {
  const totp = buildTotp(email, secret);
  // window: 1 = toleransi ±30 detik untuk selisih jam device
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
