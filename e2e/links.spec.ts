import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';

/**
 * P0-2 "법령 출처 링크가 새 탭에서 열리고, 깨진 링크가 없는지 확인한다"
 *
 * 내부 링크는 실제로 방문해 200~3xx 인지 확인하고, 페이지 안 앵커(#id)는
 * 대상 페이지에 그 id 를 가진 요소가 실제로 있는지 확인한다.
 * 외부 링크(법제처 등)는 네트워크 왕복 없이 target/rel/href 형식만 검증한다
 * — 외부 사이트 가용성은 이 프로젝트가 통제할 수 있는 범위 밖이다.
 */

const READY_PAGES = Object.values(ROUTES).filter((r) => r.ready);

interface LinkInfo {
  href: string;
  target: string | null;
  rel: string | null;
}

async function collectLinks(page: Page): Promise<LinkInfo[]> {
  return page.$$eval('a[href]', (as) =>
    as.map((a) => ({
      href: a.getAttribute('href') ?? '',
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    })),
  );
}

// 이 파일의 테스트는 모두 사이트 전체를 순회한다. goto 가 수십 번 일어나고
// WebKit 은 Chromium 보다 느려 기본 30초로는 부족하다 — 파일 전체에 여유를 준다.
test.beforeEach(() => {
  test.slow();
});

test('페이지 안의 모든 외부 링크는 새 탭 + noopener 로 열린다', async ({ page }) => {
  const offenders: string[] = [];

  for (const route of READY_PAGES) {
    await page.goto(route.path);
    const links = await collectLinks(page);
    for (const link of links) {
      if (!link.href.startsWith('http')) continue; // 내부 링크는 별도 테스트
      const isNewTab = link.target === '_blank';
      const hasNoopener = (link.rel ?? '').includes('noopener');
      if (!isNewTab || !hasNoopener) {
        offenders.push(`${route.path} → ${link.href} (target=${link.target}, rel=${link.rel})`);
      }
    }
  }

  expect(offenders, offenders.join('\n')).toEqual([]);
});

test('내부 링크는 404 없이 열린다 (사이트 전체 크롤)', async ({ page }) => {
  const visited = new Set<string>();
  const broken: string[] = [];

  for (const route of READY_PAGES) {
    await page.goto(route.path);
    const links = await collectLinks(page);

    for (const link of links) {
      if (link.href.startsWith('http') || link.href.startsWith('mailto:')) continue;

      const [pathPart, hash] = link.href.split('#');
      const targetPath = pathPart || route.path; // "#judge" 처럼 경로 없이 해시만 있는 경우 현재 페이지

      if (!visited.has(targetPath) && targetPath) {
        visited.add(targetPath);
        const res = await page.goto(targetPath);
        if (!res || res.status() >= 400) {
          broken.push(`${route.path} → ${link.href} (status=${res?.status()})`);
        }
      }

      if (hash) {
        const exists = await page.evaluate((id) => !!document.getElementById(id), hash);
        if (!exists) {
          // 현재 goto 가 다른 페이지로 이동했을 수 있으니 원래 대상 경로에서 다시 확인
          await page.goto(targetPath);
          const existsOnTarget = await page.evaluate(
            (id) => !!document.getElementById(id),
            hash,
          );
          if (!existsOnTarget) {
            broken.push(`${route.path} → ${link.href} (id="${hash}" 없음)`);
          }
        }
      }
    }
  }

  expect(broken, broken.join('\n')).toEqual([]);
});

test('sitemap.xml 의 모든 URL이 200으로 열린다', async ({ page, baseURL }) => {
  const res = await page.goto('/sitemap.xml');
  expect(res?.status()).toBe(200);
  const xml = await res!.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.length, 'sitemap 이 비어있으면 안 된다').toBeGreaterThan(0);

  for (const loc of locs) {
    const url = new URL(loc);
    const r = await page.goto(url.pathname);
    expect(r?.status(), `${loc}`).toBeLessThan(400);
  }
});
