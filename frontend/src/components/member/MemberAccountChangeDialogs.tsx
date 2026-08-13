import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

const PHONE_PATTERN = /^010-\d{4}-\d{4}$/

function DialogShell({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-[#e8edf4]">
      <button type="button" tabIndex={-1} aria-label={`${title} 창 닫기`} onClick={onClose} className="absolute inset-0" />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative z-10 h-dvh w-full max-w-[393px] overflow-y-auto bg-white">
        <div className="flex h-14 items-center border-b border-[#e2e8f0] px-4">
          <button type="button" aria-label={`${title} 창 닫기`} onClick={onClose} className="mr-2 flex h-10 w-3 items-center justify-center text-2xl text-[#0b2b59]">‹</button>
          <h2 className="min-w-0 flex-1 text-[17px] font-bold text-[#1e293b]">{title}</h2>
        </div>
        <p className="px-4 pt-4 text-xs leading-5 text-[#64748b]">{description}</p>
        {children}
      </div>
    </div>
  )
}

const inputClassName = 'mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]'

export function MemberProfileChangeDialog({ open, initialName, initialEmail, onClose, onSubmit }: {
  open: boolean
  initialName: string
  initialEmail: string
  onClose: () => void
  onSubmit: (input: { name: string; email: string }) => Promise<void>
}) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setName(initialName); setEmail(initialEmail); setError('') }
  }, [initialEmail, initialName, open])

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextName = name.trim()
    const nextEmail = email.trim()
    if (!nextName) { setError('이름을 입력해 주세요.'); return }
    if (!/^\S+@\S+\.\S+$/.test(nextEmail)) { setError('올바른 이메일을 입력해 주세요.'); return }
    setSubmitting(true); setError('')
    try { await onSubmit({ name: nextName, email: nextEmail }); onClose() } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '개인정보 수정에 실패했습니다.')
    } finally { setSubmitting(false) }
  }

  return (
    <DialogShell title="개인정보 수정" description="이름과 로그인 이메일을 수정할 수 있습니다." onClose={onClose}>
      <form className="px-4 pt-3" onSubmit={submit} noValidate>
        <label htmlFor="member-profile-name" className="block text-xs font-bold text-[#334155]">이름</label>
        <input id="member-profile-name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} className={inputClassName} />
        <label htmlFor="member-profile-email" className="mt-3 block text-xs font-bold text-[#334155]">로그인 이메일</label>
        <input id="member-profile-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} className={inputClassName} />
        {error ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-4 flex flex-col gap-3">
          <button type="submit" disabled={submitting} className="h-12 rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:bg-[#93b4f5]">{submitting ? '수정 중...' : '수정하기'}</button>
          <button type="button" disabled={submitting} onClick={onClose} className="h-12 rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb]">취소</button>
        </div>
      </form>
    </DialogShell>
  )
}

export function MemberPhoneChangeDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (phoneNumber: string) => Promise<void> }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setPhoneNumber(''); setError('') }
  }, [open])

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = phoneNumber.replace(/\D/g, '').slice(0, 11).replace(/^(\d{3})(\d{4})(\d{0,4})$/, '$1-$2-$3')
    if (!PHONE_PATTERN.test(normalized)) { setError('휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요.'); return }
    setSubmitting(true); setError('')
    try { await onSubmit(normalized); onClose() } catch (submitError) { setError(submitError instanceof Error ? submitError.message : '휴대폰 번호 변경에 실패했습니다.') } finally { setSubmitting(false) }
  }

  return (
    <DialogShell title="휴대폰 번호 변경" description="새 휴대폰 번호를 입력해 주세요." onClose={onClose}>
      <form className="px-4 pt-3" onSubmit={submit} noValidate>
        <label htmlFor="member-new-phone" className="block text-xs font-bold text-[#334155]">새 휴대폰 번호</label>
        <input id="member-new-phone" inputMode="numeric" autoComplete="tel" value={phoneNumber} onChange={(event) => { setPhoneNumber(event.target.value); setError('') }} placeholder="010-1234-5678" className={inputClassName} />
        {error ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-4 flex flex-col gap-3">
          <button type="submit" disabled={submitting} className="h-12 rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:bg-[#93b4f5]">{submitting ? '변경 중...' : '변경하기'}</button>
          <button type="button" disabled={submitting} onClick={onClose} className="h-12 rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb]">취소</button>
        </div>
      </form>
    </DialogShell>
  )
}

export function MemberPasswordChangeDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (input: { currentPassword: string; newPassword: string }) => Promise<void> }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirm(''); setError('') }
  }, [open])

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentPassword || !newPassword || !newPasswordConfirm) { setError('비밀번호를 모두 입력해 주세요.'); return }
    if (newPassword !== newPasswordConfirm) { setError('새 비밀번호가 일치하지 않습니다.'); return }
    setSubmitting(true); setError('')
    try { await onSubmit({ currentPassword, newPassword }); setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirm(''); onClose() } catch (submitError) { setError(submitError instanceof Error ? submitError.message : '비밀번호 변경에 실패했습니다.') } finally { setSubmitting(false) }
  }

  return (
    <DialogShell title="비밀번호 변경" description="현재 비밀번호를 확인하고 새 비밀번호를 입력해 주세요." onClose={onClose}>
      <form className="px-4 pt-3" onSubmit={submit} noValidate>
        <label htmlFor="member-current-password" className="block text-xs font-bold text-[#334155]">현재 비밀번호</label>
        <input id="member-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError('') }} className={inputClassName} />
        <label htmlFor="member-new-password" className="mt-3 block text-xs font-bold text-[#334155]">새 비밀번호</label>
        <input id="member-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError('') }} className={inputClassName} />
        <label htmlFor="member-new-password-confirm" className="mt-3 block text-xs font-bold text-[#334155]">새 비밀번호 확인</label>
        <input id="member-new-password-confirm" type="password" autoComplete="new-password" value={newPasswordConfirm} onChange={(event) => { setNewPasswordConfirm(event.target.value); setError('') }} className={inputClassName} />
        {error ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-4 flex flex-col gap-3">
          <button type="submit" disabled={submitting} className="h-12 rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:bg-[#93b4f5]">{submitting ? '변경 중...' : '변경하기'}</button>
          <button type="button" disabled={submitting} onClick={onClose} className="h-12 rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb]">취소</button>
        </div>
      </form>
    </DialogShell>
  )
}
