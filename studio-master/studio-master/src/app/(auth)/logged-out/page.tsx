
import { redirect } from 'next/navigation';

export default function LoggedOutPage() {
  // This page is no longer used, redirect to the dashboard.
  redirect('/dashboard');
  return null;
}
