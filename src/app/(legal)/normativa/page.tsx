import { redirect } from 'next/navigation';

// No hub page by design. The bare /normativa path also needs a static segment so
// the (app)/[username] profile catch-all does not resolve "normativa" as a user.
export default function NormativaIndex() {
  redirect('/normativa/terminos');
}
