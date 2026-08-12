import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import LandlordSignupPage from './LandlordSignupPage'
import ContractorSignupPage from './ContractorSignupPage'
import { login } from '@/api/authApi'
import { updateMyContractorProfile } from '@/api/contractorApi'
import {
  confirmJoinPhoneVerificationCode,
  joinMember,
  sendJoinPhoneVerificationCode,
  uploadBusinessRegistrationCertificate,
  verifyBusinessRegistration,
} from '@/api/signupApi'
import { openDaumPostcode } from '@/utils/daumPostcode'

vi.mock('@/api/signupApi', () => ({
  sendJoinPhoneVerificationCode: vi.fn(),
  confirmJoinPhoneVerificationCode: vi.fn(),
  joinMember: vi.fn(),
  verifyBusinessRegistration: vi.fn(),
  uploadBusinessRegistrationCertificate: vi.fn(),
}))
vi.mock('@/api/authApi', () => ({ login: vi.fn() }))
vi.mock('@/api/contractorApi', () => ({ updateMyContractorProfile: vi.fn() }))
vi.mock('@/utils/daumPostcode', () => ({ openDaumPostcode: vi.fn() }))

const sendCode = vi.mocked(sendJoinPhoneVerificationCode)
const confirmCode = vi.mocked(confirmJoinPhoneVerificationCode)
const join = vi.mocked(joinMember)
const verifyBusiness = vi.mocked(verifyBusinessRegistration)
const uploadCertificate = vi.mocked(uploadBusinessRegistrationCertificate)
const updateProfile = vi.mocked(updateMyContractorProfile)
const loginRequest = vi.mocked(login)
const openPostcode = vi.mocked(openDaumPostcode)

afterEach(cleanup)
beforeEach(() => {
  sendCode.mockReset().mockResolvedValue('123456')
  confirmCode.mockReset().mockResolvedValue(undefined)
  join.mockReset().mockResolvedValue({ accessToken: 'join-token', memberId: 31, role: 'LANDLORD' })
  verifyBusiness.mockReset().mockResolvedValue({ valid: true, businessRegistrationNumber: '220-81-62517', message: 'verified' })
  uploadCertificate.mockReset().mockResolvedValue('/api/files/business-documents/license.pdf')
  updateProfile.mockReset().mockResolvedValue(undefined)
  loginRequest.mockReset()
  openPostcode.mockReset()
  sessionStorage.clear()
})

function fillLandlordAccount() {
  fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@spaceup.co.kr' } })
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Test1234!' } })
  fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'Test1234!' } })
  fireEvent.click(screen.getByLabelText('서비스 이용약관'))
  fireEvent.click(screen.getByLabelText('개인정보 처리방침'))
}

describe('signup routes and guarded flows', () => {
  it('keeps email login and role-based destinations', async () => {
    loginRequest.mockResolvedValueOnce({ accessToken: 'landlord-token', memberId: 1, role: 'LANDLORD' })
    render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/" element={<p>landlord home</p>} /></Routes></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: ' landlord@spaceup.co.kr ' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Test1234!' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => expect(loginRequest).toHaveBeenCalledWith({ email: 'landlord@spaceup.co.kr', password: 'Test1234!' }, expect.any(AbortSignal)))
    expect(await screen.findByText('landlord home')).toBeInTheDocument()
    cleanup()

    loginRequest.mockResolvedValueOnce({ accessToken: 'contractor-token', memberId: 2, role: 'CONTRACTOR' })
    render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/signup/contractor/status" element={<p>contractor status</p>} /></Routes></MemoryRouter>)
    fireEvent.click(screen.getByLabelText('시공사'))
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'contractor@spaceup.co.kr' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Test1234!' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('contractor status')).toBeInTheDocument()
  })

  it('routes the login signup action according to the selected role', () => {
    render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/signup/landlord" element={<p>landlord signup</p>} /><Route path="/signup/contractor" element={<p>contractor signup</p>} /></Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))
    expect(screen.getByText('landlord signup')).toBeInTheDocument()
    cleanup()

    render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/signup/contractor" element={<p>contractor signup</p>} /></Routes></MemoryRouter>)
    fireEvent.click(screen.getByLabelText('시공사'))
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))
    expect(screen.getByText('contractor signup')).toBeInTheDocument()
  })

  it('blocks landlord account progression until fields, password match, and terms are valid', () => {
    render(<MemoryRouter><LandlordSignupPage /></MemoryRouter>)
    const next = screen.getByRole('button', { name: '다음: 휴대폰 인증' })
    expect(next).toBeDisabled()
    fillLandlordAccount()
    expect(next).toBeEnabled()
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'Different1!' } })
    expect(next).toBeDisabled()
  })

  it('uses verified phone data to call the real landlord join contract without username', async () => {
    render(<MemoryRouter><LandlordSignupPage /></MemoryRouter>)
    fillLandlordAccount()
    fireEvent.click(screen.getByRole('button', { name: '다음: 휴대폰 인증' }))
    fireEvent.change(screen.getByLabelText('휴대폰 번호'), { target: { value: '01012345678' } })
    fireEvent.click(screen.getByRole('button', { name: '인증번호 받기' }))
    await waitFor(() => expect(sendCode).toHaveBeenCalledWith('010-1234-5678'))
    fireEvent.change(screen.getByLabelText('인증번호 6자리'), { target: { value: '123456' } })
    await waitFor(() => expect(confirmCode).toHaveBeenCalledWith('010-1234-5678', '123456'))
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }))
    await waitFor(() => expect(join).toHaveBeenCalledWith({ role: 'LANDLORD', email: 'user@spaceup.co.kr', password: 'Test1234!', name: '홍길동', phoneNumber: '010-1234-5678' }))
    expect(join.mock.calls[0][0]).not.toHaveProperty('username')
    expect(await screen.findByText('회원가입이 완료되었습니다!')).toBeInTheDocument()
  })

  it('keeps phone input and verification state on API failure', async () => {
    confirmCode.mockRejectedValue(new Error('invalid'))
    render(<MemoryRouter><LandlordSignupPage /></MemoryRouter>)
    fillLandlordAccount()
    fireEvent.click(screen.getByRole('button', { name: '다음: 휴대폰 인증' }))
    fireEvent.change(screen.getByLabelText('휴대폰 번호'), { target: { value: '01012345678' } })
    fireEvent.click(screen.getByRole('button', { name: '인증번호 받기' }))
    await waitFor(() => expect(sendCode).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('인증번호 6자리'), { target: { value: '654321' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('인증번호가 일치하지 않습니다.')
    expect(screen.getByLabelText('휴대폰 번호')).toHaveValue('010-1234-5678')
  })

  it('keeps the landlord verification screen when join fails', async () => {
    join.mockRejectedValueOnce(new Error('join failed'))
    render(<MemoryRouter><LandlordSignupPage /></MemoryRouter>)
    fillLandlordAccount()
    fireEvent.click(screen.getByRole('button', { name: '다음: 휴대폰 인증' }))
    fireEvent.change(screen.getByLabelText('휴대폰 번호'), { target: { value: '01012345678' } })
    fireEvent.click(screen.getByRole('button', { name: '인증번호 받기' }))
    await waitFor(() => expect(sendCode).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('인증번호 6자리'), { target: { value: '123456' } })
    await waitFor(() => expect(confirmCode).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('회원가입에 실패했습니다.')
    expect(screen.getByLabelText('휴대폰 번호')).toHaveValue('010-1234-5678')
    expect(screen.queryByText('회원가입이 완료되었습니다!')).not.toBeInTheDocument()
  })

  it('joins contractor, verifies and uploads business data, then saves the authenticated profile', async () => {
    join.mockResolvedValue({ accessToken: 'contractor-token', memberId: 41, role: 'CONTRACTOR' })
    render(<MemoryRouter initialEntries={['/signup/contractor']}><Routes><Route path="/signup/contractor" element={<ContractorSignupPage />} /><Route path="/signup/contractor/status" element={<p>pending status</p>} /></Routes></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('담당자명'), { target: { value: '김현수' } })
    fireEvent.change(screen.getByLabelText('휴대폰 번호'), { target: { value: '01012345678' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'contractor@spaceup.co.kr' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Test1234!' } })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'Test1234!' } })
    fireEvent.click(screen.getByLabelText('서비스 이용약관'))
    fireEvent.click(screen.getByLabelText('개인정보 처리방침'))
    fireEvent.click(screen.getByRole('button', { name: '다음: 휴대폰 인증' }))
    fireEvent.click(screen.getByRole('button', { name: '인증번호 받기' }))
    await waitFor(() => expect(sendCode).toHaveBeenCalledWith('010-1234-5678'))
    fireEvent.change(screen.getByLabelText('인증번호 6자리'), { target: { value: '123456' } })
    await waitFor(() => expect(confirmCode).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    await waitFor(() => expect(join).toHaveBeenCalledWith({ role: 'CONTRACTOR', email: 'contractor@spaceup.co.kr', password: 'Test1234!', name: '김현수', phoneNumber: '010-1234-5678' }))
    expect(sessionStorage.getItem('accessToken')).toBe('contractor-token')
    expect(await screen.findByLabelText('업체명')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('업체명'), { target: { value: '스페이스업 인테리어' } })
    fireEvent.change(screen.getByLabelText('대표자명'), { target: { value: '초기 대표' } })
    openPostcode.mockResolvedValueOnce('광주광역시 북구 무등로 1')
    fireEvent.click(screen.getByRole('button', { name: '주소 검색' }))
    await waitFor(() => expect(screen.getByLabelText('업체 주소')).toHaveValue('광주광역시 북구 무등로 1'))
    fireEvent.click(screen.getByRole('button', { name: '광주 전체' }))
    fireEvent.click(screen.getByRole('button', { name: '벽지' }))
    fireEvent.change(screen.getByLabelText('시공 경력'), { target: { value: '36' } })
    expect(screen.getByRole('button', { name: '광주 전체' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '벽지' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    fireEvent.change(screen.getByLabelText('사업자등록번호'), { target: { value: '220-81-62517' } })
    fireEvent.click(screen.getByRole('button', { name: '사업자 확인' }))
    await waitFor(() => expect(verifyBusiness).toHaveBeenCalledWith('220-81-62517'))
    fireEvent.change(screen.getByLabelText('상호명'), { target: { value: '최종 상호' } })
    fireEvent.change(screen.getByLabelText('사업자 대표자명'), { target: { value: '최종 대표' } })
    openPostcode.mockResolvedValueOnce('광주광역시 서구 상무중앙로 1')
    fireEvent.click(screen.getByRole('button', { name: '주소 검색' }))
    await waitFor(() => expect(screen.getByLabelText('사업장 주소')).toHaveValue('광주광역시 서구 상무중앙로 1'))
    const file = new File(['certificate'], 'license.pdf', { type: 'application/pdf' })
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('checkbox'))
    updateProfile.mockRejectedValueOnce(new Error('profile save failed'))
    fireEvent.click(screen.getByRole('button', { name: '입점 심사 요청' }))
    await waitFor(() => expect(uploadCertificate).toHaveBeenCalledWith(file))
    expect(await screen.findByRole('alert')).toHaveTextContent('입점 심사 요청에 실패했습니다.')
    expect(screen.getByLabelText('상호명')).toHaveValue('최종 상호')
    expect(screen.queryByText('pending status')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '입점 심사 요청' }))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({
      businessRegistrationNumber: '220-81-62517',
      representativeName: '최종 대표',
      businessRegistrationCertificateUrl: '/api/files/business-documents/license.pdf',
      companyName: '최종 상호',
      companyAddress: '광주광역시 북구 무등로 1',
      businessAddress: '광주광역시 서구 상무중앙로 1',
      constructionExperienceMonths: 36,
      activityRegions: '광주 전체',
      specialties: '벽지',
      introduction: '',
    }))
    expect(uploadCertificate).toHaveBeenCalledTimes(1)
    expect(openPostcode).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('pending status')).toBeInTheDocument()
  })
})
