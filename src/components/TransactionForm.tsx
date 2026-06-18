import { useState } from 'react'
import type { Transaction } from '../types'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const CATEGORIES = [
  '-', 'alimentação', 'moradia', 'transporte', 'saúde',
  'educação', 'lazer', 'cartão', 'outros',
]

interface Props {
  transaction: Transaction | null
  defaultMonth: string
  onSave: (t: Omit<Transaction, 'id'> & { id?: number }) => void
  onClose: () => void
}

export default function TransactionForm({ transaction, defaultMonth, onSave, onClose }: Props) {
  const [mes, setMes] = useState(transaction?.mes ?? defaultMonth)
  const [descricao, setDescricao] = useState(transaction?.descricao ?? '')
  const [tipo, setTipo] = useState<'receita' | 'despesa'>(transaction?.tipo ?? 'despesa')
  const [rec, setRec] = useState<'fixa' | 'parcela' | 'variavel'>(transaction?.rec ?? 'fixa')
  const [parcelas, setParcelas] = useState<number | ''>(transaction?.parcelas ?? '')
  const [cat, setCat] = useState(transaction?.cat ?? '-')
  const [valor, setValor] = useState<number | ''>(transaction?.valor ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      id: transaction?.id,
      mes,
      descricao,
      tipo,
      rec,
      parcelas: rec === 'parcela' && parcelas !== '' ? Number(parcelas) : null,
      cat,
      valor: Number(valor),
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 w-full max-w-md rounded-t-3xl p-6 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">
            {transaction ? 'Editar lançamento' : 'Novo lançamento'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700">
            {(['despesa', 'receita'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  tipo === t
                    ? t === 'receita'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'receita' ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              required
              placeholder="Ex: Aluguel, Salário..."
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Valor (R$)</label>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              min="0"
              step="0.01"
              placeholder="0,00"
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* Mês */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Mês</label>
            <select
              value={mes}
              onChange={e => setMes(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Recorrência */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Recorrência</label>
            <div className="flex rounded-xl overflow-hidden border border-slate-700">
              {(['fixa', 'variavel', 'parcela'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRec(r)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                    rec === r ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r === 'fixa' ? 'Fixa' : r === 'variavel' ? 'Variável' : 'Parcelada'}
                </button>
              ))}
            </div>
          </div>

          {/* Parcelas */}
          {rec === 'parcela' && (
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Nº de parcelas</label>
              <input
                type="number"
                value={parcelas}
                onChange={e => setParcelas(e.target.value === '' ? '' : parseInt(e.target.value))}
                required
                min="2"
                placeholder="Ex: 12"
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
              />
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Categoria</label>
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c === '-' ? 'Sem categoria' : c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {transaction ? 'Salvar alterações' : 'Adicionar lançamento'}
          </button>
        </form>
      </div>
    </div>
  )
}
