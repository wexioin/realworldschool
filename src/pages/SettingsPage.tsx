import React from 'react';
import { PageHeader, Card, StatusBadge } from '../components/ui';

// 설정: 데이터 소스 연동 상태를 투명하게 보여주는 페이지.
// 실연동이 진행되면 여기서 각 소스의 연결 상태·마지막 동기화 시각을 표시합니다.

export default function SettingsPage() {
  const sources = [
    { name: '리얼월드 스튜디오', url: 'studio.realworld.to', desc: '크리에이터 · 콘텐츠 개발 데이터', status: 'mock' },
    { name: '리얼월드 스쿨', url: 'realworld-school.org', desc: '회원 · 구매 · 콘텐츠 카탈로그 데이터', status: 'mock' },
    { name: '스쿨 어드민', url: 'school-admin.realworld.to', desc: '채널 관리 · 콘텐츠 이전 데이터', status: 'mock' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="설정" description="데이터 소스 연동과 시스템 설정을 관리합니다" />

      <Card title="데이터 소스 연동 상태">
        <div className="divide-y divide-gray-50">
          {sources.map(s => (
            <div key={s.name} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.url} · {s.desc}</p>
              </div>
              <StatusBadge label="Mock 데이터 (연동 대기)" tone="amber" />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          실데이터 연동은 Admin BFF API 구축 후 <code className="bg-gray-100 px-1 py-0.5 rounded">src/api/index.ts</code>의
          MockApi를 HttpApi로 교체하는 방식으로 진행됩니다. 페이지 코드는 수정할 필요가 없습니다.
        </p>
      </Card>

      <Card title="관리자 계정">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-gray-900">plusu0617@gmail.com</p>
            <p className="text-xs text-gray-400">소유자 · 전체 권한</p>
          </div>
          <StatusBadge label="활성" tone="green" />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          실연동 시 Google SSO + 역할 기반 권한(RBAC)이 적용될 예정입니다.
        </p>
      </Card>
    </div>
  );
}
