
"use client";

import { redirect } from 'next/navigation';

export default function LoginPage() {
  // This page is no longer needed in an auth-free app.
  // Redirect immediately to the main dashboard.
  redirect('/dashboard');
  return null;
}
