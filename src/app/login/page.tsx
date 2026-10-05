import { Suspense } from "react";

import { LoginForm } from "@/components/market/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
