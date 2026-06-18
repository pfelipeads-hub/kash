import { useState } from 'react'
import type { UserData, Transaction } from '../types'
import TransactionForm from './TransactionForm'

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

export default function Transactions({ userData, onDataChange }: Props) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth())
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const selectedMonth = MONTHS[selectedMonthIdx]
  const filtered = userData.transactions.filter(t => t.mes === selectedMonth)

  const totalIncome = filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalExpense = filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)

  function prevMonth() {
    setSelectedMonthIdx(i => (i - 1 + 12) % 12)
  }

  function nextMonth() {
    setSelectedMonthIdx(i => (i + 1) % 12)
  }

  function deleteTransaction(id: number) {
    onDataChange({ transactions: userData.transactions.filter(t => t.id !== id) })
    setConfirmDeleteId(null)
  }

  function handleSave(t: Omit<Transaction, 'id'> & { id?: number }) {
    let updated: Transaction[]
    if (t.id !== undefined) {
      updated = userData.transactions.map(existing =>
        existing.id === t.id ? (t as Transaction) : existing
      )
    } else {
      const newId = userData.transactions.length > 0
        ? Math.max(...userData.transactions.map(x => x.id)) + 1
        : 1
      updated = [...userData.transactions, { ...t, id: newId } as Transaction]
    }
    onDataChange({ transactions: updated })
    setShowForm(false)
    setEditingTransaction(null)
  }

  function openAdd() {
    setEditingTransaction(null)
    setShowForm(true)
  }

  function openEdit(t: Transaction) {
    setEditingTransaction(t)
    setShowForm(true)
  }

  return (
    <div className="p-4">
      {/* Month selector */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Summary chips */}
      {filtered.length > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-center">
            <p className="text-emerald-400/70 text-xs">Receitas</p>
            <p className="text-emerald-400 font-semibold text-sm">{fmt(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">
            <p className="text-red-400/70 text-xs">Despesas</p>
            <p className="text-red-400 font-semibold text-sm">{fmt(totalExpense)}</p>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl p-8 text-center">
          <p className="text-slate-400">Nenhum lançamento em {selectedMonth}</p>
          <p className="text-slate-600 text-sm mt-1">Toque em + para adicionar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <div
                className={`w-1.5 h-9 rounded-full shrink-0 ${
                  t.tipo === 'receita' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{t.descricao}</p>
                <p className="text-slate-500 text-xs capitalize">
                  {t.cat !== '-' ? t.cat : t.rec}
                  {t.parcelas ? ` • ${t.parcelas}x` : ''}
                </p>
              </div>
              <span
                className={`font-semibold text-sm shrink-0 ${
                  t.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
              </span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(t)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {confirmDeleteId === t.id ? (
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(t.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center transition-colors z-10"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Transaction form modal */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          defaultMonth={selectedMonth}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTransaction(null) }}
        />
      )}
    </div>
  )
}
