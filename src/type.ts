export interface GuestsObject {
  guestAdults?: number
  guestChildren?: number
  guestInfants?: number
}


export interface PropertyType {
  name: string
  description: string
  value: string
}

export type ClassOfProperties = PropertyType

export type DateRage = [Date | null, Date | null]
