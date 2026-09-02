"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles: Record<string, string> = {
    primary: "bg-green text-white hover:brightness-95 shadow-md shadow-green/30",
    secondary: "bg-lime text-white hover:brightness-95 shadow-md shadow-lime/30",
    ghost: "bg-transparent text-dark border border-dark/20 hover:bg-dark/5",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button
      className={`px-5 py-2.5 rounded font-semibold tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2.5 rounded-sm border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-4 py-2.5 rounded-sm border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block text-sm font-medium mb-1.5 text-dark/80 ${className}`} {...props} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`bg-white rounded-sm shadow-[0px_0_25px_rgba(0,0,0,0.06)] border border-dark/5 p-6 ${className}`}>{children}</div>
  );
}

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "lime" | "gray" | "red" }) {
  const tones: Record<string, string> = {
    green: "bg-green/15 text-green",
    lime: "bg-lime/25 text-dark",
    gray: "bg-dark/10 text-dark/70",
    red: "bg-red-100 text-red-600",
  };
  return <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
