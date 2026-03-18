# 유튜브 구독 인증 자료 발송 서비스

유튜브 구독 인증샷을 업로드하면 Claude Vision AI가 "구독중" 텍스트를 자동 인식하여 자료 링크를 카카오 알림톡으로 발송하는 서비스.

## Supabase 테이블 생성 SQL

```sql
-- submissions 테이블
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auto_approved', 'approved', 'rejected')),
  ai_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- resources 테이블
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_url TEXT UNIQUE NOT NULL,
  resource_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (service_role 키 사용)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- service_role용 정책 (서버 사이드에서만 접근)
CREATE POLICY "Service role full access" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON resources FOR ALL USING (true) WITH CHECK (true);
```

### Supabase Storage 설정

1. Supabase 대시보드 → Storage → New Bucket
2. 버킷명: `screenshots`
3. Public bucket: ON

## 환경변수 (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon/public 키
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role 키

# 관리자
ADMIN_PASSWORD=                    # 관리자 페이지 비밀번호

# Claude AI
ANTHROPIC_API_KEY=                 # Anthropic API 키 (Vision 인증용)

# 솔라피 (카카오 알림톡)
SOLAPI_API_KEY=                    # 솔라피 API Key
SOLAPI_API_SECRET=                 # 솔라피 API Secret
SOLAPI_PFID=                       # 카카오 비즈니스 채널 PFID
SOLAPI_TEMPLATE_ID=                # 알림톡 템플릿 ID
SOLAPI_SENDER=                     # 발신번호
```

## 실행

```bash
npm install
npm run dev
```

## 페이지 구조

- `/` - 사용자: 구독 인증샷 업로드 + 전화번호 입력
- `/admin` - 관리자: 신청 승인/거절, 자료 등록/관리
