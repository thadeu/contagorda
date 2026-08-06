import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'
import { TopAlert } from '../ui/TopAlert'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
  /** Bumped on retry, which remounts the subtree and clears whatever state broke it. */
  attempt: number
}

/**
 * The last thing between a thrown error and a white screen.
 *
 * React unmounts the whole tree when nothing catches, and what is left is either
 * a blank page in production or a stack trace in development — both of which
 * tell someone using a finance app that their money went somewhere unspeakable.
 * This says something went wrong, in their language, and offers the one useful
 * response.
 *
 * Retrying remounts rather than merely clearing the flag. The error came from
 * some state the subtree was holding, and rendering the same components over the
 * same state throws again immediately — the key change is what makes the attempt
 * mean anything.
 *
 * It is a class because error boundaries have no hook. `componentDidCatch` is
 * the only way React offers to catch a render error, and there is no version of
 * this that is a function.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The only copy of what happened. Without this the report is the alert, and
    // the alert deliberately says nothing technical.
    console.error('Erro não tratado', error, info.componentStack)
  }

  retry = () => {
    this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }))
  }

  render() {
    if (this.state.failed) {
      return (
        <TopAlert
          title="Algo deu errado"
          message="Não conseguimos carregar esta parte do app. Seus dados estão salvos."
          actionLabel="Tentar de novo"
          onAction={this.retry}
        />
      )
    }

    // A keyed fragment, not a keyed element: the remount has to happen without
    // putting a box into a layout whose heights are measured through it.
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
  }
}
