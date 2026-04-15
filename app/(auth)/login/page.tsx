import { ParticleCanvas } from '@/components/auth/ParticleCanvas'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'
import Image from 'next/image'

interface Props {
  searchParams: Promise<{ error?: string; error_description?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const urlError = params.error_description ?? params.error ?? null

  return (
    <div className="auth-page">
      <ParticleCanvas />
      <div className="auth-card-wrapper">
        <div className="auth-brand">
          <Image src="/icon.png" alt="" width={40} height={40} className="auth-brand__mark" priority />
          <span className="auth-brand__name">FlowSave</span>
        </div>
        <p className="auth-brand__tagline">Cashflow OS for freelancers</p>
        <AuthCard>
          <LoginForm urlError={urlError} />
        </AuthCard>
      </div>
    </div>
  )
}
