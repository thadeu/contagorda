import { Link } from 'react-router'
import { useMonth } from '../../app/useMonth'
import { MonthList } from './MonthList'
import { MonthHeader } from '../dashboard/components/MonthHeader'
import { Button } from '../../ui/Button'

export function TransactionsPage() {
  const { month, setMonth } = useMonth()

  return (
    <>
      <MonthHeader month={month} onChange={setMonth} />

      <div className="flex justify-end px-4">
        <Link to="/transacoes/novo">
          <Button>Adicionar</Button>
        </Link>
      </div>

      <MonthList month={month} />
    </>
  )
}
