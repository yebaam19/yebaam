import { getCityBusinessDisclosures } from '../../server/city-disclosures.server'

export async function CityBusinessDisclosures({ businessId }: { businessId: string }) {
  const info = await getCityBusinessDisclosures(businessId)
  if (!info) return null
  return <section className="mx-auto my-6 max-w-7xl rounded-xl border border-neutral-200 p-5 text-sm">
    <h2 className="mb-3 font-semibold">Información del proveedor</h2>
    <dl className="grid gap-2 sm:grid-cols-2">
      <div><dt className="text-neutral-500">Razón social</dt><dd>{info.legal_name}</dd></div>
      <div><dt className="text-neutral-500">NIT / identificación fiscal</dt><dd>{info.tax_id}</dd></div>
      <div><dt className="text-neutral-500">Dirección comercial</dt><dd>{info.address}</dd></div>
      <div><dt className="text-neutral-500">Canal de atención</dt><dd>{info.phone}</dd></div>
    </dl>
    <p className="mt-3">Los precios publicados incluyen los impuestos aplicables. El proveedor es responsable de las garantías, el retracto y la reversión de pagos que correspondan.</p>
  </section>
}
