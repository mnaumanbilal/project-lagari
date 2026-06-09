export type PolicyLink = {
  text: string;
  href: string;
};

export type PolicySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: PolicyLink[];
};

export type PolicyDocument = {
  title: string;
  eyebrow?: string;
  lastUpdated?: string;
  intro: string | string[];
  sections: PolicySection[];
  closingNote?: string;
};
