import Link from "next/link";

export function MarketFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="space-y-3 md:col-span-1">
          <p className="text-lg font-semibold text-white">MCasa</p>
          <p className="text-sm text-slate-400">
            Marketplace de anúncios das empresas parceiras do ERP MCasa.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Vitrine</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/#categorias" className="hover:text-white">
                Categorias
              </Link>
            </li>
            <li>
              <Link href="/#destaques" className="hover:text-white">
                Destaques
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Conta</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-white">
                Entrar
              </Link>
            </li>
            <li>
              <Link href="/cadastro" className="hover:text-white">
                Criar conta
              </Link>
            </li>
            <li>
              <Link href="/perfil" className="hover:text-white">
                Meu perfil
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Empresa</p>
          <ul className="space-y-2 text-sm">
            <li className="text-slate-500">ERP em MCasa-frontEnd</li>
            <li className="text-slate-500">API em MCasa-backend</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MCasa Marketplace
      </div>
    </footer>
  );
}
