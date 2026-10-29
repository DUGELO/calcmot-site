export interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly author: string;
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly cover: { readonly src: string; readonly srcset: string; readonly width: number; readonly height: number };
  readonly coverAlt: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly canonical: string;
  readonly aliases: readonly string[];
  readonly html: string;
  readonly readingMinutes: number;
}

export type BlogSummary = Omit<BlogPost, 'html'>;
