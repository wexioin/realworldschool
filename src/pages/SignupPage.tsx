import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  GraduationCap, Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2, Link2,
} from 'lucide-react';
import {
  useSignup, usePreviewSchoolProfile, usePreviewStudioAccount,
} from '../api';
import type {
  UserRole, AdvisorType, CreatorSignupType, CreatorIdentitySource, SignupFailure, SignupRequest,
} from '../api/types';
import {
  SignupError, ADMIN_EMAIL_DOMAIN, isAdminEmail,
  CREATOR_IDENTITY_META, CREATOR_SIGNUP_TYPE_LABEL,
  ADVISOR_TYPE_LABEL, ADVISOR_CATEGORY_OPTIONS,
} from '../api/types';
import { useSessionMaybe, ROLE_HOME, ROLE_LABEL } from '../session';

// ─────────────────────────────────────────────────────────────
// 회원가입
// - 어드민: @e-redpoint.com 만
// - 검수자: 이메일 가입 + Advisor DB 필드 전부
// - 크리에이터: School.org(권장) / Studio / 이메일 — 프로필·지급·연동 키 전부 수집
// ─────────────────────────────────────────────────────────────

const FAILURE_MESSAGE: Record<SignupFailure, string> = {
  email_taken: '이미 가입된 이메일입니다.',
  invalid_admin_domain: `관리자는 @${ADMIN_EMAIL_DOMAIN} 이메일만 가입할 수 있습니다.`,
  weak_password: '비밀번호는 8자 이상이어야 합니다.',
  invalid_payload: '필수 항목을 모두 입력해 주세요.',
};

const ROLES: UserRole[] = ['creator', 'reviewer', 'admin'];

const inputCls = 'w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5';

export default function SignupPage() {
  const { signIn } = useSessionMaybe();
  const navigate = useNavigate();
  const signup = useSignup();
  const previewSchool = usePreviewSchoolProfile();
  const previewStudio = usePreviewStudioAccount();

  const [role, setRole] = useState<UserRole>('creator');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 공통
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [affiliation, setAffiliation] = useState('');

  // 검수자
  const [specialty, setSpecialty] = useState('');
  const [advisorType, setAdvisorType] = useState<AdvisorType>('teacher');
  const [categories, setCategories] = useState<string[]>(['A']);

  // 크리에이터
  const [identitySource, setIdentitySource] = useState<CreatorIdentitySource>('school');
  const [creatorType, setCreatorType] = useState<CreatorSignupType>('creator_teacher');
  const [institution, setInstitution] = useState('');
  const [studioEmail, setStudioEmail] = useState('');
  const [schoolOrgEmail, setSchoolOrgEmail] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const [residentId, setResidentId] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const resetRoleFields = (next: UserRole) => {
    setRole(next);
    setError('');
    setLinkNote('');
  };

  const toggleCategory = (c: string) => {
    setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleSchoolLink = () => {
    setError('');
    const target = schoolOrgEmail.trim() || email.trim();
    if (!target) {
      setError('School.org 이메일을 먼저 입력해 주세요.');
      return;
    }
    previewSchool.mutate(target, {
      onSuccess: (profile) => {
        if (!profile) {
          setError('School.org 계정을 찾지 못했습니다. (mock)');
          return;
        }
        setSchoolOrgEmail(target);
        if (!email) setEmail(target);
        setName(profile.name);
        setInstitution(profile.institution);
        setAffiliation(profile.institution);
        setPhone(profile.phone);
        setLinkNote('School.org 프로필을 불러왔습니다. Studio 이메일을 이어서 연결해 주세요.');
      },
    });
  };

  const handleStudioLink = () => {
    setError('');
    const target = studioEmail.trim() || email.trim();
    if (!target) {
      setError('Studio 이메일을 먼저 입력해 주세요.');
      return;
    }
    previewStudio.mutate(target, {
      onSuccess: (acc) => {
        if (!acc) {
          setError('Studio 계정을 찾지 못했습니다. (mock)');
          return;
        }
        setStudioEmail(acc.email);
        if (!email) setEmail(acc.email);
        setLinkNote('Studio 계정을 확인했습니다. 이름·학교·전화는 직접 입력해 주세요.');
      },
    });
  };

  const submit = () => {
    setError('');
    if (password !== passwordConfirm) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (role === 'admin' && !isAdminEmail(email)) {
      setError(FAILURE_MESSAGE.invalid_admin_domain);
      return;
    }

    let req: SignupRequest;
    if (role === 'admin') {
      req = {
        role: 'admin',
        email, password,
        name, affiliation, phone,
      };
    } else if (role === 'reviewer') {
      req = {
        role: 'reviewer',
        email, password,
        name, affiliation, phone,
        specialty, type: advisorType, categories,
      };
    } else {
      req = {
        role: 'creator',
        email, password,
        name, phone,
        type: creatorType,
        institution: institution || affiliation,
        identitySource,
        studioEmail: studioEmail || email,
        schoolOrgEmail: schoolOrgEmail || email,
        payout: { residentId, address, bankAccount },
      };
    }

    signup.mutate(req, {
      onSuccess: (account) => {
        signIn(account);
        navigate(ROLE_HOME[account.role], { replace: true });
      },
      onError: (err) => {
        const reason = err instanceof SignupError
          ? err.reason
          : (err as { reason?: SignupFailure })?.reason;
        setError(reason && reason in FAILURE_MESSAGE
          ? FAILURE_MESSAGE[reason]
          : '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-3">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">회원가입</h1>
          <p className="text-xs text-gray-400 mt-0.5">리얼월드 스쿨 통합 관리 시스템</p>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); submit(); }}
          className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5"
        >
          {/* 역할 선택 */}
          <div>
            <p className={labelCls}>가입 유형</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => resetRoleFields(r)}
                  className={clsx(
                    'px-2 py-2 text-xs font-medium rounded-lg border transition-colors',
                    role === r
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50',
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              {role === 'admin' && `회사 운영 계정만 가입할 수 있습니다. 이메일 도메인은 @${ADMIN_EMAIL_DOMAIN} 이어야 합니다.`}
              {role === 'reviewer' && '검수자(자문단)는 이메일로 가입하며, 배정에 필요한 전문 분야·카테고리를 함께 등록합니다.'}
              {role === 'creator' && '콘텐츠·정산에 필요한 프로필·연동 키·지급 정보를 가입 단계에서 모두 받습니다.'}
            </p>
          </div>

          {role === 'creator' && (
            <CreatorIdentityPicker
              value={identitySource}
              onChange={setIdentitySource}
              onSchoolLink={handleSchoolLink}
              onStudioLink={handleStudioLink}
              schoolBusy={previewSchool.isPending}
              studioBusy={previewStudio.isPending}
              schoolOrgEmail={schoolOrgEmail}
              studioEmail={studioEmail}
              onSchoolEmail={setSchoolOrgEmail}
              onStudioEmail={setStudioEmail}
              linkNote={linkNote}
            />
          )}

          {/* 계정 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-700 mb-1">계정</legend>
            <Field label={role === 'admin' ? `이메일 (@${ADMIN_EMAIL_DOMAIN})` : '로그인 이메일'}>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role === 'admin' ? `name@${ADMIN_EMAIL_DOMAIN}` : 'name@example.com'}
                className={inputCls}
                required
              />
            </Field>
            {role === 'admin' && email && !isAdminEmail(email) && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                관리자 이메일은 @{ADMIN_EMAIL_DOMAIN} 로 끝나야 합니다.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="비밀번호 (8자 이상)">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={clsx(inputCls, 'pr-10')}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                    aria-label="비밀번호 표시"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <Field label="비밀번호 확인">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  className={inputCls}
                  required
                  minLength={8}
                />
              </Field>
            </div>
          </fieldset>

          {/* 프로필 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-700 mb-1">프로필</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="이름">
                <input value={name} onChange={e => setName(e.target.value)} className={inputCls} required />
              </Field>
              <Field label="휴대폰">
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className={inputCls}
                  required
                />
              </Field>
            </div>

            {role === 'admin' && (
              <Field label="소속 / 팀">
                <input
                  value={affiliation}
                  onChange={e => setAffiliation(e.target.value)}
                  placeholder="예: 리얼월드 스쿨 운영팀"
                  className={inputCls}
                  required
                />
              </Field>
            )}

            {role === 'reviewer' && (
              <>
                <Field label="소속">
                  <input
                    value={affiliation}
                    onChange={e => setAffiliation(e.target.value)}
                    placeholder="예: OO대학교 교육학과"
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="전문 분야">
                  <input
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    placeholder="예: 초등 수학교육"
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="검수자 유형">
                  <select
                    value={advisorType}
                    onChange={e => setAdvisorType(e.target.value as AdvisorType)}
                    className={inputCls}
                  >
                    {(Object.keys(ADVISOR_TYPE_LABEL) as AdvisorType[]).map(t => (
                      <option key={t} value={t}>{ADVISOR_TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                </Field>
                <div>
                  <p className={labelCls}>담당 카테고리 (복수 선택)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ADVISOR_CATEGORY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleCategory(opt.value)}
                        className={clsx(
                          'px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors',
                          categories.includes(opt.value)
                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {role === 'creator' && (
              <>
                <Field label="크리에이터 유형">
                  <select
                    value={creatorType}
                    onChange={e => setCreatorType(e.target.value as CreatorSignupType)}
                    className={inputCls}
                  >
                    {(Object.keys(CREATOR_SIGNUP_TYPE_LABEL) as CreatorSignupType[]).map(t => (
                      <option key={t} value={t}>{CREATOR_SIGNUP_TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="소속 학교 / 기관">
                  <input
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="예: 서울초등학교"
                    className={inputCls}
                    required
                  />
                </Field>
                {identitySource === 'email' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Studio 계정 이메일">
                      <input
                        type="email"
                        value={studioEmail}
                        onChange={e => setStudioEmail(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </Field>
                    <Field label="School.org 계정 이메일">
                      <input
                        type="email"
                        value={schoolOrgEmail}
                        onChange={e => setSchoolOrgEmail(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </Field>
                  </div>
                )}
              </>
            )}
          </fieldset>

          {role === 'creator' && (
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold text-gray-700 mb-1">지급 · 정산 정보</legend>
              <p className="text-[11px] text-gray-400 -mt-1 mb-1 leading-relaxed">
                오리지널 지급과 개인 콘텐츠 로열티 정산에 사용합니다. 암호화 보관 예정이며, 가입 시 받아 두면 승인 후 지급 대기 단계가 줄어듭니다.
              </p>
              <Field label="주민등록번호">
                <input
                  value={residentId}
                  onChange={e => setResidentId(e.target.value)}
                  placeholder="000000-0000000"
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="주소">
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="도로명 주소"
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="입금 계좌">
                <input
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  placeholder="은행명 000-000-000000 (예금주)"
                  className={inputCls}
                  required
                />
              </Field>
            </fieldset>
          )}

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="mt-px flex-shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={signup.isPending}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            <UserPlus size={15} /> {signup.isPending ? '가입 처리 중...' : '가입하고 시작하기'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function CreatorIdentityPicker({
  value, onChange, onSchoolLink, onStudioLink,
  schoolBusy, studioBusy, schoolOrgEmail, studioEmail,
  onSchoolEmail, onStudioEmail, linkNote,
}: {
  value: CreatorIdentitySource;
  onChange: (v: CreatorIdentitySource) => void;
  onSchoolLink: () => void;
  onStudioLink: () => void;
  schoolBusy?: boolean;
  studioBusy?: boolean;
  schoolOrgEmail: string;
  studioEmail: string;
  onSchoolEmail: (v: string) => void;
  onStudioEmail: (v: string) => void;
  linkNote: string;
}) {
  const sources: CreatorIdentitySource[] = ['school', 'studio', 'email'];

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-700">계정 연결 방식</p>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
          권장: <b className="font-medium text-gray-600">School.org(프로필)</b> + <b className="font-medium text-gray-600">Studio(콘텐츠)</b>를 함께 연결.
          Studio만으로는 이름·학교·전화를 알 수 없습니다.
        </p>
      </div>

      <div className="space-y-1.5">
        {sources.map(src => {
          const meta = CREATOR_IDENTITY_META[src];
          return (
            <button
              key={src}
              type="button"
              onClick={() => onChange(src)}
              className={clsx(
                'w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                value === src
                  ? 'bg-white border-primary-200 ring-1 ring-primary-100'
                  : 'bg-white/60 border-gray-200 hover:border-gray-300',
              )}
            >
              <p className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                {meta.label}
                {meta.recommend && (
                  <span className="text-[10px] font-semibold text-primary-700 bg-primary-50 border border-primary-100 px-1.5 py-0.5 rounded">
                    권장
                  </span>
                )}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{meta.desc}</p>
            </button>
          );
        })}
      </div>

      {value === 'school' && (
        <div className="space-y-2 pt-1">
          <Field label="School.org 이메일">
            <div className="flex gap-2">
              <input
                type="email"
                value={schoolOrgEmail}
                onChange={e => onSchoolEmail(e.target.value)}
                placeholder="school@example.com"
                className={inputCls}
              />
              <button
                type="button"
                onClick={onSchoolLink}
                disabled={schoolBusy}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50"
              >
                <Link2 size={13} /> {schoolBusy ? '확인 중' : '연동'}
              </button>
            </div>
          </Field>
          <Field label="Studio 이메일 (콘텐츠 매칭)">
            <input
              type="email"
              value={studioEmail}
              onChange={e => onStudioEmail(e.target.value)}
              placeholder="studio@example.com"
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {value === 'studio' && (
        <div className="space-y-2 pt-1">
          <Field label="Studio 이메일">
            <div className="flex gap-2">
              <input
                type="email"
                value={studioEmail}
                onChange={e => onStudioEmail(e.target.value)}
                placeholder="studio@example.com"
                className={inputCls}
              />
              <button
                type="button"
                onClick={onStudioLink}
                disabled={studioBusy}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50"
              >
                <Link2 size={13} /> {studioBusy ? '확인 중' : '연동'}
              </button>
            </div>
          </Field>
          <Field label="School.org 이메일 (있으면)">
            <input
              type="email"
              value={schoolOrgEmail}
              onChange={e => onSchoolEmail(e.target.value)}
              placeholder="선택 — 나중에 매칭"
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {linkNote && (
        <p className="flex items-start gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-2">
          <CheckCircle2 size={12} className="mt-px flex-shrink-0" /> {linkNote}
        </p>
      )}
    </div>
  );
}
