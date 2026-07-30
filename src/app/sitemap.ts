import type { MetadataRoute } from 'next';
import { SITE } from './layout';

/** 도구·가이드를 추가할 때마다 여기에 등록한다. 빠뜨리면 색인이 늦어진다. */
const ROUTES: Array<{ path: string; priority: number }> = [
  { path: '/', priority: 1 },
  { path: '/건강보험/피부양자-자격판정/', priority: 0.9 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: new URL(path, SITE.url).toString(),
    lastModified: now,
    changeFrequency: 'monthly',
    priority,
  }));
}
