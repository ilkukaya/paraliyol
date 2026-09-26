import Link from "next/link";
import RouteSearchForm from "@/components/RouteSearchForm";
import { getLocations } from "@/lib/engine";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-display text-7xl font-extrabold text-sign-600">404</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold">Bu yol çıkmaz sokak</h1>
      <p className="muted mt-3 text-lg">Aradığınız sayfa bulunamadı. Rotanızı buradan hesaplayabilir ya da <Link href="/" className="font-semibold underline">ana sayfaya</Link> dönebilirsiniz.</p>
      <div className="mt-8">
        <RouteSearchForm locations={getLocations()} />
      </div>
    </div>
  );
}
