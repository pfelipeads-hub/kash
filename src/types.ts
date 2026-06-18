export interface Transaction {
  id: number
  mes: string
  descricao: string
  tipo: 'receita' | 'despesa'
  rec: 'fixa' | 'parcela' | 'variavel'
  parcelas: number | null
  cat: string
  valor: number
}

export interface GoalParams {
  pct: number
  months: number
  startDate: string
}

export interface UserData {
  username: string
  transactions: Transaction[]
  goalParams: GoalParams
  realizedSavings: Record<string, number>
}
