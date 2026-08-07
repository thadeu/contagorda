import type { ComponentType } from 'react'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Home,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Eraser,
  ListFilter,
  MoreHorizontal,
  Search,
  Crosshair,
  Sun,
  Moon,
  PiggyBank,
  BanknoteArrowDown,
  Bell,
  Wallet,
  X,
  type LucideProps,
} from 'lucide-react'

export type AppIcon = ComponentType<LucideProps>

/**
 * One place naming every icon the app uses, and the only place its stroke is
 * set.
 *
 * Leaving the weight to each call site is how a set drifts: some icons end up
 * at the library default and some at ours, and the difference is visible next
 * to type without being obvious in a diff. `absoluteStrokeWidth` keeps the line
 * the same thickness at every size, so a 12px glyph in a list row does not look
 * thinner than a 24px one in a sheet.
 *
 * Names describe the role rather than the picture — `PaidIcon` survives a change
 * of glyph, `CheckIcon` does not.
 */
function tuned(Icon: AppIcon): AppIcon {
  return function TunedIcon(props: LucideProps) {
    return <Icon strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" {...props} />
  }
}

export const HomeIcon = tuned(Home)
export const WalletIcon = tuned(Wallet)
export const PlusIcon = tuned(Plus)
export const CheckIcon = tuned(Check)
export const ChevronLeftIcon = tuned(ChevronLeft)
export const ChevronRightIcon = tuned(ChevronRight)
export const TargetIcon = tuned(Crosshair)
export const SunIcon = tuned(Sun)
export const MoonIcon = tuned(Moon)
export const PiggyIcon = tuned(PiggyBank)
export const OutflowIcon = tuned(BanknoteArrowDown)
export const ChevronDownIcon = tuned(ChevronDown)
export const RepeatIcon = tuned(RefreshCw)
export const PaidIcon = tuned(CircleCheckBig)
export const UnpaidIcon = tuned(RotateCcw)
export const EditIcon = tuned(Pencil)
export const DeleteIcon = tuned(Trash2)
export const SignOutIcon = tuned(LogOut)
export const CloseIcon = tuned(X)
export const SearchIcon = tuned(Search)
export const BellIcon = tuned(Bell)
export const MoreIcon = tuned(MoreHorizontal)
export const FilterIcon = tuned(ListFilter)
export const ClearIcon = tuned(Eraser)
