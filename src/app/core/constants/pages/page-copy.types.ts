export type ClassificationTone = 'great' | 'good' | 'warning' | 'bad';

export interface CopyImage {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface CopyExample {
  readonly status: string;
  readonly meaning: string;
  readonly perKm: string;
  readonly perHour: string;
  readonly minutes: string;
  readonly tone: ClassificationTone;
  readonly note?: string;
}

export interface CopyCard {
  readonly title: string;
  readonly detail: string;
}

export interface CopyStep {
  readonly number?: string;
  readonly title: string;
  readonly detail?: string;
}

export interface CopyFormula {
  readonly label: string;
  readonly expression: string;
  readonly result: string;
  readonly note?: string;
}

export interface PageSection {
  readonly id: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly paragraphs?: readonly string[];
  readonly bullets?: readonly string[];
  readonly note?: string;
  readonly image?: CopyImage;
  readonly example?: CopyExample;
  readonly formulas?: readonly CopyFormula[];
  readonly cards?: readonly CopyCard[];
  readonly steps?: readonly CopyStep[];
}

export interface PageFaqItem {
  readonly question: string;
  readonly answer: string;
}

export interface PageCopy {
  readonly meta: {
    readonly path: string;
    readonly title: string;
    readonly description: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly points?: readonly string[];
  };
  readonly sections: readonly PageSection[];
  readonly faq?: {
    readonly title: string;
    readonly items: readonly PageFaqItem[];
  };
  readonly closing: {
    readonly title: string;
    readonly description: string;
  };
}
