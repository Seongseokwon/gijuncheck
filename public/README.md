# public/

이 폴더의 파일은 빌드 시 `out/` 루트로 그대로 복사됩니다.
`public/foo.html` → `https://도메인/foo.html`

## 여기에 넣는 것

**검색엔진 소유 확인 파일**

- 네이버 서치어드바이저: `naver<해시>.html`
- 구글 서치콘솔: `google<해시>.html` (DNS TXT 인증을 쓰면 불필요)

소유 확인은 파일 방식보다 **DNS TXT 방식**이 낫습니다. 도메인을 옮기거나
재배포해도 유지되기 때문입니다. 다만 네이버는 파일·메타태그 방식만 지원하는
경우가 있어 그때는 여기에 넣습니다.

**애드센스 관련**

- `ads.txt` — 애드센스 승인 후 안내받은 내용을 넣습니다

**정적 자산**

- `favicon.ico`, `og-image.png` 등

## 주의

`output: 'export'` 설정이므로 `next/image` 최적화가 동작하지 않습니다
(`images.unoptimized: true`). 이미지는 미리 압축해서 넣고,
WebP 변환도 직접 해야 합니다.
