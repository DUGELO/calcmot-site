import { ChangeDetectionStrategy, Component, RESPONSE_INIT, computed, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageMetaService } from '../core/services/page-meta.service';
import { BRAND_TOKENS } from '../core/constants/brand.tokens';
import { BLOG_POSTS, BLOG_CATEGORIES, BLOG_PAGE_SIZE } from './generated/posts';
import { BLOG_LIST_PATHS } from './generated/routes';

@Component({
  selector: 'app-blog-page',
  imports: [DatePipe],
  templateUrl: './blog-page.component.html',
  styleUrl: './blog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly pageMeta = inject(PageMetaService);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  readonly playStore = BRAND_TOKENS.links.playStore;
  readonly slug = computed(() => this.params().get('slug'));
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  readonly post = computed(() => {
    const summary = BLOG_POSTS.find(p => p.slug === this.slug());
    return summary ? { ...summary, html: String(this.data()['body'] ?? '') } : undefined;
  });
  readonly category = computed(() => this.params().get('category'));
  readonly categoryLabel = computed(() => BLOG_CATEGORIES[this.category() ?? '']);
  readonly page = computed(() => Number(this.params().get('page') ?? 1));
  readonly listPath = computed(() => this.listUrl(this.page()).replace(/^\/|\/$/g, ''));
  readonly missing = computed(() => (this.params().has('page') && (!/^[1-9]\d*$/.test(this.params().get('page')!) || this.page() < 2)) || !!this.route.snapshot.data['notFound'] || (this.slug() ? !this.post() : !BLOG_LIST_PATHS.includes(this.listPath())));
  readonly filtered = computed(() => BLOG_POSTS.filter(p => !this.category() || p.category === this.category()));
  readonly posts = computed(() => this.filtered().slice((this.page() - 1) * BLOG_PAGE_SIZE, this.page() * BLOG_PAGE_SIZE));
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / BLOG_PAGE_SIZE));
  readonly categories = Object.entries(BLOG_CATEGORIES).filter(([key]) => BLOG_POSTS.some(p => p.category === key));
  readonly related = computed(() => {
    const post = this.post();
    if (!post) return [];
    return BLOG_POSTS.filter(p => p.slug !== post.slug).sort((a,b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0,3);
  });
  readonly listingTitle = computed(() => (this.categoryLabel() || 'Blog CalcMot') + (this.page() > 1 ? ' — Página ' + this.page() : ''));
  listUrl(page: number): string {
    const base = this.category() ? '/blog/categoria/' + this.category() : '/blog';
    return base + (page > 1 ? '/pagina/' + page : '') + '/';
  }
  constructor() {
    effect(() => {
      const post = this.post();
      if (this.missing()) {
        if (this.response) this.response.status = 404;
        this.pageMeta.apply({ title: 'Conteúdo não encontrado — CalcMot', description: 'Este conteúdo não está disponível. Explore os artigos e ferramentas do CalcMot.', path: '/blog/', robots: 'noindex,follow' });
        return;
      }
      if (post) {
        const url = BRAND_TOKENS.site.url + '/blog/' + post.slug + '/';
        this.pageMeta.apply({
          title: post.seoTitle, description: post.seoDescription, path: '/blog/' + post.slug,
          canonical: post.canonical, type: 'article', image: BRAND_TOKENS.site.url + post.cover.src,
          imageAlt: post.coverAlt, publishedAt: post.publishedAt, updatedAt: post.updatedAt,
          structuredData: [
            { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': url + '#article', url,
              headline: post.title, description: post.summary, image: [BRAND_TOKENS.site.url + post.cover.src],
              datePublished: post.publishedAt + 'T12:00:00-03:00', dateModified: post.updatedAt + 'T12:00:00-03:00',
              author: { '@type': 'Person', name: post.author }, publisher: { '@type': 'Organization', name: 'CalcMot', url: BRAND_TOKENS.site.url },
              mainEntityOfPage: post.canonical, articleSection: post.categoryLabel, inLanguage: 'pt-BR',
            },
            { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: BRAND_TOKENS.site.url + '/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: BRAND_TOKENS.site.url + '/blog/' },
              { '@type': 'ListItem', position: 3, name: post.title, item: url },
            ] },
          ],
        });
      } else {
        this.pageMeta.apply({
          title: this.listingTitle() + ' | Custos e rentabilidade para motoristas',
          description: this.categoryLabel()
            ? 'Artigos de ' + this.categoryLabel() + ' para motoristas de aplicativo.' + (this.page() > 1 ? ' Página ' + this.page() + '.' : '')
            : 'Guias práticos para entender os custos, comparar corridas e acompanhar a rentabilidade como motorista de aplicativo.' + (this.page() > 1 ? ' Página ' + this.page() + '.' : ''),
          path: '/' + this.listPath(),
          structuredData: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: this.listingTitle(), url: BRAND_TOKENS.site.url + this.listUrl(this.page()), inLanguage: 'pt-BR' }],
        });
      }
    });
  }
}
