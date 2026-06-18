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

export default function Dashboard({ userData, onDataChange }: Props) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth())
  const selectedMonth = MONTHS[selectedMonthIdx]

  const transactions = userData.transactions.filter(t => t.mes === selectedMonth)
  const totalIncome = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalExpense = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const balance = totalIncome - totalExpense

  const goalAmount = totalIncome * (userData.goalParams.pct / 100)
  const monthKey = selectedMonthIdx.toString()
  const realizedSaving = Number(userData.realizedSavings[monthKey] ?? 0)
  const goalProgress = goalAmount > 0 ? Math.min((realizedSaving / goalAmount) * 100, 100) : 0

  function prevMonth() {
    setSelectedMonthIdx(i => (i - 1 + 12) % 12)
  }

  function nextMonth() {
    setSelectedMonthIdx(i => (i + 1) % 12)
  }

  function markGoalAchieved() {
    onDataChange({
      realizedSavings: { ...userData.realizedSavings, [monthKey]: goalAmount },
    })
  }

  const recentTransactions = [...transactions].reverse().slice(0, 5)

  return (
    <div className="p-4 space-y-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-white font-semibold text-lg">{selectedMonth}</h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white shadow-lg shadow-emerald-900/40">
        <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Saldo do mês</p>
        <p className={`text-3xl font-bold mt-1 ${balance < 0 ? 'text-red-200' : 'text-white'}`}>
          {fmt(balance)}
        </p>
        <div className="flex gap-5 mt-4 pt-4 border-t border-emerald-500/40">
          <div>
            <p className="text-emerald-100/70 text-xs">Receitas</p>
            <p className="font-semibold text-sm mt-0.5">{fmt(totalIncome)}</p>
          </div>
          <div>
            <p className="text-emerald-100/70 text-xs">Despesas</p>
            <p className="font-semibold text-sm mt-0.5 text-red-200">{fmt(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Goal card */}
      {goalAmount > 0 && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Meta de aporte</p>
              <p className="text-white font-bold text-xl mt-0.5">{fmt(goalAmount)}</p>
              <p className="text-slate-500 text-xs mt-0.5">{userData.goalParams.pct}% da receita mensal</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Realizado</p>
              <p className={`font-semibold mt-0.5 ${realizedSaving >= goalAmount ? 'text-emerald-400' : 'text-slate-300'}`}>
                {fmt(realizedSaving)}
              </p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">{goalProgress.toFixed(0)}% da meta atingida</p>

          {realizedSaving < goalAmount && (
            <button
              onClick={markGoalAchieved}
              className="mt-3 w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm py-2.5 rounded-xl transition-colors font-medium"
            >
              Marcar meta como atingida
            </button>
          )}
          {realizedSaving >= goalAmount && (
            <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Meta atingida neste mês!</span>
            </div>
          )}
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3">
          {recentTransactions.length > 0 ? 'Últimos lançamentos' : 'Lançamentos'}
        </h3>
        {recentTransactions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            Sem lançamentos em {selectedMonth}
          </p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <div
                  className={`w-1.5 h-8 rounded-full shrink-0 ${
                    t.tipo === 'receita' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{t.descricao}</p>
                  <p className="text-slate-500 text-xs capitalize">
                    {t.cat !== '-' ? t.cat : t.rec}
                    {t.parcelas ? ` • ${t.parcelas}x` : ''}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    t.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
