'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { m } from 'motion/react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { formatMoneyInputValue, getCurrencySymbol } from '@/lib/utils'

// ── Schemas ────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = z.object({
  first_name:           z.string().min(1, 'First name is required'),
  last_name:            z.string().min(1, 'Last name is required'),
  email:                z.string().email('Enter a valid email'),
  password:             z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[0-9]/, 'Must include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
  confirm_password:     z.string().min(1, 'Please confirm your password'),
  freelance_role:       z.string().min(1, 'Select your role'),
  custom_role:          z.string().optional(),
  primary_currency:     z.string().min(1, 'Select a currency'),
  monthly_income_goal:  z.string().optional(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
}).refine((d) => {
  if (d.freelance_role === 'Other') {
    return !!d.custom_role && d.custom_role.trim().length > 0
  }
  return true
}, {
  message: 'Please describe your role',
  path: ['custom_role'],
})

type SignInValues = z.infer<typeof signInSchema>
type SignUpValues = z.infer<typeof signUpSchema>

// ── Constants ──────────────────────────────────────────────────────────────

const FREELANCE_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Designer',
  'Product Manager',
  'Product Engineer',
  'Marketing',
  'Copywriter',
  'Consultant',
  'Other',
]

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'BRL', label: 'BRL — Brazilian Real' },
]

const URL_ERROR_MESSAGES: Record<string, string> = {
  missing_code:  'The confirmation link was invalid or already used.',
  auth_failed:   'Authentication failed. Please try again.',
  access_denied: 'The confirmation link expired or was already used.',
}

function resolveUrlError(raw: string | null): string | null {
  if (!raw) return null
  return URL_ERROR_MESSAGES[raw] ?? `Authentication error: ${raw}`
}

// ── Component ──────────────────────────────────────────────────────────────

type Mode = 'signin' | 'signup'

interface LoginFormProps {
  urlError?: string | null
}

export function LoginForm({ urlError }: LoginFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [signupStep, setSignupStep] = useState<1 | 2>(1)
  const [showSpinner, setShowSpinner] = useState(false)
  const [signupSent, setSignupSent] = useState(false)
  const [signedUpEmail, setSignedUpEmail] = useState('')
  const [serverError, setServerError] = useState<string | null>(
    resolveUrlError(urlError ?? null)
  )
  const [goalDisplay, setGoalDisplay] = useState('')

  // Sign In form
  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  // Sign Up form
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      freelance_role: '',
      custom_role: '',
      primary_currency: 'USD',
      monthly_income_goal: undefined,
    },
  })

  // Declare here so handlers below can close over it
  const watchedCurrency = useWatch({
    control: signUpForm.control,
    name: 'primary_currency',
  })
  const watchedRole = useWatch({
    control: signUpForm.control,
    name: 'freelance_role',
  })

  function switchMode(next: Mode) {
    setMode(next)
    setServerError(null)
    setSignupStep(1)
    setShowSpinner(false)
    setGoalDisplay('')
  }

  // ── Monthly Goal formatting ────────────────────────────────────────────────

  function parseGoalDigits(raw: string): string {
    // BRL uses comma as decimal separator; USD uses period.
    // Strip the decimal part first so "22.222,00" → "22.222" → "22222"
    // rather than accidentally including the trailing zeros as extra digits.
    const decimalSep = watchedCurrency === 'BRL' ? ',' : '.'
    const integerPart = raw.split(decimalSep)[0]
    return integerPart.replace(/[^0-9]/g, '')
  }

  function handleGoalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = parseGoalDigits(e.target.value)
    if (!digits) {
      setGoalDisplay('')
      signUpForm.setValue('monthly_income_goal', undefined)
      return
    }
    const num = parseInt(digits, 10)
    const locale = watchedCurrency === 'BRL' ? 'pt-BR' : 'en-US'
    // Show thousands-separated integer while typing (no decimals yet)
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
    setGoalDisplay(formatted)
    signUpForm.setValue('monthly_income_goal', String(num))
  }

  function handleGoalBlur() {
    const digits = parseGoalDigits(goalDisplay)
    if (!digits) return
    const num = parseInt(digits, 10)
    if (!isNaN(num) && num > 0) {
      // Add 2 decimal places on blur: 300,999.00 (USD) or 300.999,00 (BRL)
      setGoalDisplay(formatMoneyInputValue(num, watchedCurrency))
      signUpForm.setValue('monthly_income_goal', String(num))
    }
  }

  // ── Step 1 → Step 2 transition ─────────────────────────────────────────────

  async function handleStep1Continue() {
    const valid = await signUpForm.trigger([
      'first_name', 'last_name', 'email', 'password', 'confirm_password',
    ])
    if (!valid) return

    setShowSpinner(true)
    setTimeout(() => {
      setShowSpinner(false)
      setSignupStep(2)
    }, 900)
  }

  async function onSignIn(values: SignInValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setServerError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function onSignUp(values: SignUpValues) {
    setServerError(null)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    if (data.session) {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name:          values.first_name,
          last_name:           values.last_name,
          freelance_role:      values.freelance_role === 'Other'
            ? (values.custom_role?.trim() || 'Other')
            : values.freelance_role,
          primary_currency:    values.primary_currency,
          monthly_income_goal: values.monthly_income_goal
            ? Number(values.monthly_income_goal) || undefined
            : undefined,
        }),
      })
      const json = await res.json() as { redirect?: string; error?: string }
      if (json.error) {
        setServerError(json.error)
        toast.error(json.error)
        return
      }
      router.push(json.redirect ?? '/onboarding')
      router.refresh()
    } else {
      setSignedUpEmail(values.email)
      setSignupSent(true)
    }
  }

  // ── Email sent state ──────────────────────────────────────────────────────

  if (signupSent) {
    return (
      <div className="auth-confirmation">
        <div className="auth-confirmation__icon">✉</div>
        <p className="auth-confirmation__title">Check your email</p>
        <p className="auth-confirmation__body">
          We sent a confirmation link to <strong>{signedUpEmail}</strong>.
          Click it to activate your account.
        </p>
        <button
          type="button"
          onClick={() => { setSignupSent(false); switchMode('signin') }}
          className="auth-confirmation__back"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  const signingIn  = signInForm.formState.isSubmitting
  const signingUp  = signUpForm.formState.isSubmitting
  const panelTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }

  const currencySymbol = getCurrencySymbol(watchedCurrency)
  const goalPlaceholder = watchedCurrency === 'BRL' ? '5.000,00' : '5,000.00'

  const showOAuth = mode === 'signin' || (mode === 'signup' && signupStep === 1 && !showSpinner)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="auth-form-shell">
      {/* Tab toggle */}
      <div className="auth-tab-bar" role="tablist">
        {(['signin', 'signup'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            onClick={() => switchMode(tab)}
            className={`auth-tab${mode === tab ? ' auth-tab--active' : ''}`}
          >
            {tab === 'signin' ? 'Sign in' : 'Sign up'}
            {mode === tab && (
              <m.div
                className="auth-tab__indicator"
                layoutId="auth-tab-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* OAuth — only on sign-in and signup step 1 */}
      {showOAuth && <OAuthButtons />}

      {/* Form body */}
      <m.div
        className="auth-form-stage"
        layout
        transition={panelTransition}
      >
        <div key={`${mode}-${signupStep}`} className="auth-form-panel">
          {mode === 'signin' ? (
            // ── Sign In ──────────────────────────────────────────────────────
            <form onSubmit={signInForm.handleSubmit(onSignIn)} className="auth-fields" noValidate>
              <div className="auth-field">
                <Label htmlFor="signin-email" className="auth-label">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={signingIn}
                  className="h-10"
                  {...signInForm.register('email')}
                />
                {signInForm.formState.errors.email && (
                  <p className="auth-field-error">{signInForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="auth-field">
                <Label htmlFor="signin-password" className="auth-label">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={signingIn}
                  className="h-10"
                  {...signInForm.register('password')}
                />
                {signInForm.formState.errors.password && (
                  <p className="auth-field-error">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              {serverError && <p className="auth-server-error">{serverError}</p>}

              <Button
                type="submit"
                disabled={signingIn}
                className="w-full h-10 font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {signingIn ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

          ) : showSpinner ? (
            // ── Step transition spinner ───────────────────────────────────────
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.5rem 0',
              gap: '1rem',
            }}>
              <m.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '2.5px solid rgba(91,127,255,0.15)',
                  borderTopColor: 'var(--accent)',
                  boxShadow: '0 0 14px rgba(91,127,255,0.22)',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: '0.03em' }}>
                Almost there…
              </span>
            </div>

          ) : signupStep === 1 ? (
            // ── Sign Up — Step 1 ─────────────────────────────────────────────
            <div className="auth-fields">
              <div className="auth-field-row">
                <div className="auth-field">
                  <Label htmlFor="first_name" className="auth-label">First name <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span></Label>
                  <Input
                    id="first_name"
                    type="text"
                    placeholder="Ada"
                    autoComplete="given-name"
                    disabled={signingUp}
                    className="h-10"
                    {...signUpForm.register('first_name')}
                  />
                  {signUpForm.formState.errors.first_name && (
                    <p className="auth-field-error">{signUpForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="auth-field">
                  <Label htmlFor="last_name" className="auth-label">Last name <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span></Label>
                  <Input
                    id="last_name"
                    type="text"
                    placeholder="Lovelace"
                    autoComplete="family-name"
                    disabled={signingUp}
                    className="h-10"
                    {...signUpForm.register('last_name')}
                  />
                  {signUpForm.formState.errors.last_name && (
                    <p className="auth-field-error">{signUpForm.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="auth-field">
                <Label htmlFor="signup-email" className="auth-label">Email <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span></Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={signingUp}
                  className="h-10"
                  {...signUpForm.register('email')}
                />
                {signUpForm.formState.errors.email && (
                  <p className="auth-field-error">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="auth-field-row">
                <div className="auth-field">
                  <Label htmlFor="signup-password" className="auth-label">Password <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span></Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={signingUp}
                    className="h-10"
                    {...signUpForm.register('password')}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="auth-field-error">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="auth-field">
                  <Label htmlFor="confirm_password" className="auth-label">Confirm password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={signingUp}
                    className="h-10"
                    {...signUpForm.register('confirm_password')}
                  />
                  {signUpForm.formState.errors.confirm_password && (
                    <p className="auth-field-error">{signUpForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5, margin: '-2px 0 2px' }}>
                Min 8 chars · 1 uppercase · 1 number · 1 special character
              </p>

              {serverError && <p className="auth-server-error">{serverError}</p>}

              <Button
                type="button"
                onClick={handleStep1Continue}
                disabled={signingUp}
                className="w-full h-10 font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Continue →
              </Button>
            </div>

          ) : (
            // ── Sign Up — Step 2 ─────────────────────────────────────────────
            <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="auth-fields" noValidate>
              <div className="auth-field">
                <Label htmlFor="freelance_role" className="auth-label">Your role <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span></Label>
                <Select
                  onValueChange={(v) => signUpForm.setValue('freelance_role', String(v ?? ''), { shouldValidate: true })}
                  disabled={signingUp}
                >
                  <SelectTrigger id="freelance_role" className="h-10">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREELANCE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {signUpForm.formState.errors.freelance_role && (
                  <p className="auth-field-error">{signUpForm.formState.errors.freelance_role.message}</p>
                )}
              </div>

              {watchedRole === 'Other' && (
                <div className="auth-field">
                  <Label htmlFor="custom_role" className="auth-label">Describe your role <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span></Label>
                  <Input
                    id="custom_role"
                    type="text"
                    placeholder="e.g. Motion Designer"
                    autoComplete="off"
                    disabled={signingUp}
                    className="h-10"
                    {...signUpForm.register('custom_role')}
                  />
                  {signUpForm.formState.errors.custom_role && (
                    <p className="auth-field-error">{signUpForm.formState.errors.custom_role.message}</p>
                  )}
                </div>
              )}

              <div className="auth-field-row">
                <div className="auth-field">
                  <Label htmlFor="primary_currency" className="auth-label">Currency</Label>
                  <Select
                    defaultValue="USD"
                    onValueChange={(v) => signUpForm.setValue('primary_currency', v ?? 'USD', { shouldValidate: true })}
                    disabled={signingUp}
                  >
                    <SelectTrigger id="primary_currency" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="auth-field">
                  <Label htmlFor="monthly_income_goal" className="auth-label">
                    Monthly goal <span className="auth-label-optional">(optional)</span>
                  </Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '0.65rem', top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 11.5, color: 'var(--text3)',
                      pointerEvents: 'none', userSelect: 'none', zIndex: 1,
                    }}>
                      {currencySymbol}
                    </span>
                    <Input
                      id="monthly_income_goal"
                      type="text"
                      inputMode="decimal"
                      placeholder={goalPlaceholder}
                      disabled={signingUp}
                      className="h-10"
                      style={{ paddingLeft: watchedCurrency === 'BRL' ? '2.25rem' : '1.75rem' }}
                      value={goalDisplay}
                      onChange={handleGoalChange}
                      onBlur={handleGoalBlur}
                    />
                  </div>
                </div>
              </div>

              {serverError && <p className="auth-server-error">{serverError}</p>}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  disabled={signingUp}
                  variant="outline"
                  className="h-10"
                  style={{ flex: '0 0 auto', paddingInline: '1rem' }}
                >
                  ←
                </Button>
                <Button
                  type="submit"
                  disabled={signingUp}
                  className="h-10 font-medium"
                  style={{ flex: 1, background: 'var(--accent)', color: '#fff' }}
                >
                  {signingUp ? 'Creating account…' : 'Create account'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </m.div>
    </div>
  )
}
