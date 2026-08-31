"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";
import { fileToBase64 } from "@/lib/fileToBase64";

const ROLES = ["OWNER", "ADMIN_PUSAT", "ADMIN_CABANG", "DOKTER", "PERAWAT", "APOTEKER", "KASIR"];

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  photoBase64?: string;
};

type FormState = {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  photoBase64: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "ADMIN_CABANG",
  phone: "",
  photoBase64: "",
  isActive: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + on search change
    load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(u: UserRow) {
    setForm({
      _id: u._id,
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      phone: u.phone || "",
      photoBase64: u.photoBase64 || "",
      isActive: u.isActive,
    });
    setError("");
    setShowForm(true);
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2MB");
      return;
    }
    const base64 = await fileToBase64(file);
    setForm((f) => ({ ...f, photoBase64: base64 }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const isEdit = Boolean(form._id);
      const url = isEdit ? `/api/admin/users/${form._id}` : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        phone: form.phone,
        photoBase64: form.photoBase64,
        isActive: form.isActive,
      };
      if (!isEdit) {
        payload.email = form.email;
        payload.password = form.password;
      } else if (form.password) {
        payload.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan data");
        return;
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus pengguna ini?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Manajemen User</h1>
          <p className="text-dark/60">Kelola akun staf dan hak akses.</p>
        </div>
        <Button onClick={openCreate}>+ Tambah User</Button>
      </div>

      <Card>
        <Input placeholder="Cari nama atau email..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mb-4" />

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Telepon</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-dark/40">
                    Memuat...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-dark/40">
                    Belum ada pengguna
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {u.photoBase64 ? (
                        <Image src={u.photoBase64} alt={u.name} width={32} height={32} unoptimized className="rounded-full object-cover w-8 h-8" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-lime text-dark flex items-center justify-center text-xs font-semibold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-dark">{u.name}</p>
                        <p className="text-dark/50 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone="lime">{u.role}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-dark/70">{u.phone || "-"}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={u.isActive ? "green" : "gray"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right space-x-2">
                    <button onClick={() => openEdit(u)} className="text-green font-medium hover:underline cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => onDelete(u._id)} className="text-red-500 font-medium hover:underline cursor-pointer">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h2 className="text-xl font-semibold text-dark mb-4">{form._id ? "Edit User" : "Tambah User"}</h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                {form.photoBase64 ? (
                  <Image src={form.photoBase64} alt="preview" width={56} height={56} unoptimized className="rounded-full object-cover w-14 h-14" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-bg border border-dark/10" />
                )}
                <div>
                  <Label>Foto Profil (maks 2MB)</Label>
                  <input type="file" accept="image/*" onChange={onPhotoChange} className="text-sm" />
                </div>
              </div>

              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              {!form._id && (
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              )}

              <div>
                <Label htmlFor="password">{form._id ? "Password Baru (opsional)" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  required={!form._id}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Telepon</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              {form._id && (
                <label className="flex items-center gap-2 text-sm text-dark/70">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Akun aktif
                </label>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
