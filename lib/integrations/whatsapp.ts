// Notifikasi WhatsApp via Fonnte (https://fonnte.com). BUTUH token device WhatsApp
// yang terhubung di dashboard Fonnte — isi FONNTE_TOKEN di .env.local.

function requireToken() {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    throw new Error("FONNTE_TOKEN belum diisi di .env.local. Daftar & hubungkan device di https://fonnte.com.");
  }
  return token;
}

export async function sendWhatsApp(target: string, message: string) {
  const token = requireToken();
  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ target, message }),
  });
  if (!res.ok) throw new Error(`Fonnte gagal mengirim pesan: ${res.status}`);
  return res.json();
}

export function bookingConfirmationMessage(patientName: string, branchName: string, dateStr: string, queueNo?: string) {
  return `Halo ${patientName}, booking Anda di ${branchName} terjadwal pada ${dateStr}.${
    queueNo ? ` Nomor antrian: ${queueNo}.` : ""
  } Terima kasih telah menggunakan KlinikKita.`;
}
