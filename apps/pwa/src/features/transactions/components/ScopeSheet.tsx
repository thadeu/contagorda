import { BottomSheet, SheetActionCard } from '@/ui/BottomSheet'
import { DeleteIcon, EditIcon, RepeatIcon } from '@/ui/icons'
import type { Scope } from '@/services/ports'

interface ScopeSheetProps {
  action: 'edit' | 'delete'
  onChoose: (scope: Scope) => void
  onClose: () => void
}

/**
 * How far this reaches, asked as a choice rather than a confirmation.
 *
 * "Are you sure?" has two answers and the question has three, so it gets asked
 * as what it is. Two options, not three: the past is never rewritten, so
 * changing every occurrence — including months already reconciled — is not
 * offered at all.
 *
 * It only appears for a row that belongs to a series. A single transaction is
 * edited by editing it.
 */
export function ScopeSheet({ action, onChoose, onClose }: ScopeSheetProps) {
  const deleting = action === 'delete'

  return (
    <BottomSheet
      title={deleting ? 'Excluir lançamento' : 'Editar lançamento'}
      subtitle="Este lançamento se repete."
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-2">
        <SheetActionCard
          label="Só este"
          icon={deleting ? DeleteIcon : EditIcon}
          danger={deleting}
          onClick={() => onChoose('one')}
        />

        <SheetActionCard
          label="Este e os próximos"
          icon={RepeatIcon}
          danger={deleting}
          onClick={() => onChoose('future')}
        />
      </div>

      <p className="px-3 pt-3 text-xs leading-relaxed text-muted">
        {deleting
          ? 'Os meses anteriores continuam como estão — o que já passou é histórico.'
          : 'Os meses anteriores continuam como estão, e qualquer mês que você já tenha corrigido à mão mantém a correção.'}
      </p>
    </BottomSheet>
  )
}
