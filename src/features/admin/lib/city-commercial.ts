import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const base = {
  id: z.string().uuid(), cityId: z.string().uuid(), name: text(120).min(2),
  description: text(4000), address: text(500), phone: text(40), category: text(120).min(1),
}
export const cityBusinessInput = z.object({
  ...base, slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,119}$/),
  legalName: text(150), taxId: text(80), pricesIncludeTax: z.boolean(), active: z.boolean(),
}).refine((v) => !v.active || Boolean(v.legalName && v.taxId && v.address && v.phone && v.pricesIncludeTax), {
  message: 'Para publicar completa razón social, identificación fiscal, dirección, teléfono y precios con impuestos.',
})
export const cityServiceInput = z.object({
  ...base, username: text(80), visibility: z.enum(['PRIVATE', 'PUBLIC', 'LIMITED']),
})
export type CityBusinessInput = z.infer<typeof cityBusinessInput>
export type CityServiceInput = z.infer<typeof cityServiceInput>
export interface CityCommercialRow {
  id: string; slug: string; name: string; description: string | null; address: string | null
  phone: string | null; category: string; city_id: string
  legal_name?: string | null; tax_id?: string | null; prices_include_tax?: boolean; is_active?: boolean
  visibility?: string; status?: string; user_id?: string; admin_created_by?: string | null; admin_draft?: boolean
  provider_declaration_accepted_at?: string | null
}
export type CommercialKind = 'businesses' | 'services'
