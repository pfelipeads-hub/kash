import { useState } from 'react'
import type { UserData } from '../types'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface Props {
  userData: UserData
  onDataChange: (updates: Partial<UserData>) => void
}

export default function Goals({ userData, onDataChange }: Props) {
  const [pct, setPct] = useState(userData.goalParams.pct)
  const [months, setMonths] = useState(userData.goalParams.months)
  const [startDate, setStartDate] = useState(userData.goalParams.startDate)
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    onDataChange({ goalParams: { pct, months, startDate } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Average monthly income from all transactions
  const incomeTransactions = userData.transactions.filter(t => t.tipo === 'receita')
  const uniqueMonths = new Set(incomeTransactions.map(t => t.mes)).size
  const totalIncome = incomeTransactions.reduce((s, t) => s + t.valor, 0)
  const avgMonthlyIncome = uniqueMonths > 0 ? totalIncome / uniqueMonths : 0

  const monthlyGoal = avgMonthlyIncome * (pct / 100)
  const totalGoal = monthlyGoal * months

  const totalRealized = Object.values(userData.realizedSavings).reduce((s, v) => s + Number(v), 0)
  const monthsCompleted = Object.keys(userData.realizedSavings).length

  return (
    <div className="p-4 space-y-4">
      {/* Config form */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Configurar meta de aporte</h3>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Percentual slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-400 text-sm">% da receita para poupar</label>
              <span className="text-emerald-400 font-bold text-lg">{pct}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={pct}
              onChange={e => setPct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-slate-600 text-xs mt-1">
              <span>1%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Duração (meses)</label>
            <input
              type="number"
              value={months}
              onChange={e => setMonths(Math.max(1, Number(e.target.value)))}
              min="1"
              max="60"
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Start date */}
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Data de início</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]"
            />
          </div>

          {/* Projection preview */}
          {avgMonthlyIncome > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
              <p className="text-emerald-400/70 text-xs font-medium uppercase tracking-wider">
                Projeção (baseada na receita média)
              </p>
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Por mês:</span>
                <span className="text-emerald-400 font-semibold">{fmt(monthlyGoal)}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-500/20 pt-2">
                <span className="text-slate-300 text-sm">Total em {months} meses:</span>
                <span className="text-emerald-400 font-bold">{fmt(totalGoal)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full font-semibold py-3 rounded-xl transition-colors ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            {saved ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Salvo!
              </span>
            ) : 'Salvar meta'}
          </button>
        </form>
      </div>

      {/* Savings history */}
      {monthsCompleted > 0 && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3">Histórico de aportes</h3>
          <div className="space-y-2.5">
            {Object.entries(userData.realizedSavings)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([monthIdx, amount]) => (
                <div key={monthIdx} className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">{MONTHS[Number(monthIdx)] ?? `Mês ${monthIdx}`}</span>
                  <span className="text-emerald-400 font-medium">{fmt(Number(amount))}</span>
                </div>
              ))}
            <div className="border-t border-slate-700 pt-2.5 flex justify-between items-center">
              <span className="text-slate-300 text-sm font-semibold">Total realizado</span>
              <span className="text-emerald-400 font-bold">{fmt(totalRealized)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
