import Link from 'next/link'
import LoginForm from '../../components/LoginForm'
import PageHeader from '../../components/PageHeader'

type Props = { searchParams: Promise<{ next?: string; error?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams

  return (
    <div className="max-w-md mx-auto space-y-8 enter-up">
      <PageHeader variant="default" eyebrow="Cuenta" title="Entrar" />
      <div className="card-glass p-6 md:p-8">
        <LoginForm next={next || '/'} error={error} />
        <p className="text-xs text-faint mt-6 text-center">
          <Link href="/" className="hover:text-accent transition">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
