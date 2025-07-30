
import { redirect } from 'next/navigation';

export default function HomePage() {
  // This redirect happens on the server, which is much faster
  // than loading a component just to redirect on the client.
  redirect('/dashboard');

  return null;
}
