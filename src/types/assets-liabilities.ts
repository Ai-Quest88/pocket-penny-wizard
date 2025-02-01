export interface Asset {
  id: string
  name: string
  value: number
  type: "cash" | "investment" | "property" | "vehicle" | "other"
}

export interface Liability {
  id: string
  name: string
  amount: number
  type: "credit" | "loan" | "mortgage" | "other"
}