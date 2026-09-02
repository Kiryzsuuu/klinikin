"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type Branch = { _id: string; name: string };
type StaffOpt = { _id: string; name: string; role: string };
type ShiftRow = {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  userId?: { name: string; role: string };
  branchId?: { name: string };
};

const emptyForm = { userId: "", branchId: "", dayOfWeek: 1, startTime: "08:00", endTime: "16:00" };

export default function HrPage() {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [staff, setStaff] = useState<StaffOpt[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/shifts");
      const json = await res.json();
      if (json.success) setShifts(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/users?limit=100").then((r) => r.json())
       
      .then((j) => j.success && setStaff(j.data));
    fetch("/api/branches").then((r) => r.json())
      .then((j) => j.success && setBranches(j.data));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/hr/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dayOfWeek: Number(form.dayOfWeek) }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan jadwal");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus jadwal ini?")) return;
    const res = await fetch(`/api/hr/shifts/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">SDM · Jadwal Praktik</h1>
          <p className="text-dark/60">Atur jadwal shift staf lintas cabang.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Tambah Jadwal</Button>
      </div>

      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Staf</th>
                <th className="py-2 pr-4">Cabang</th>
                <th className="py-2 pr-4">Hari</th>
                <th className="py-2 pr-4">Jam</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="py-6 text-center text-dark/40">Memuat...</td></tr>}
              {!loading && shifts.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-dark/40">Belum ada jadwal</td></tr>
              )}
              {shifts.map((s) => (
                <tr key={s._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4 font-medium text-dark">{s.userId?.name} <span className="text-dark/40 text-xs">({s.userId?.role})</span></td>
                  <td className="py-3 pr-4 text-dark/70">{s.branchId?.name}</td>
                  <td className="py-3 pr-4 text-dark/70">{DAYS[s.dayOfWeek]}</td>
                  <td className="py-3 pr-4 text-dark/70">{s.startTime} - {s.endTime}</td>
                  <td className="py-3 pr-4 text-right">
                    <button onClick={() => onDelete(s._id)} className="text-red-500 font-medium hover:underline cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Jadwal</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Staf</Label>
                <Select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Pilih staf</option>
                  {staff.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                </Select>
              </div>
              <div>
                <Label>Cabang</Label>
                <Select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Hari</Label>
                <Select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jam Mulai</Label>
                  <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <Label>Jam Selesai</Label>
                  <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "Menyimpan..." : "Simpan"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
