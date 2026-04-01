import { LoginForm } from '@/components/auth/LoginForm'

interface Props {
  searchParams: Promise<{ error?: string; error_description?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const urlError = params.error_description ?? params.error ?? null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            FlowSave
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text2)' }}>
            Income tracker for freelancers
          </p>
        </div>
        <LoginForm urlError={urlError} />
      </div>
    </div>
  )
}
