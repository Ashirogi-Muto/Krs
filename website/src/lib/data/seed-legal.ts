/** Privacy policy and terms as they were written into the pages; imported once into the CMS (Legal pages). */
export type LegalSection = { heading: string; body: string }
export type LegalPage = { title: string; lastUpdated: string; sections: LegalSection[]; seoTitle?: string; seoDescription?: string }

export const SEED_LEGAL: Record<'privacy' | 'terms', LegalPage> = {
  "privacy": {
    "title": "Privacy Policy",
    "lastUpdated": "24 September 2026 // Effective Version 1.0",
    "sections": [
      {
        "heading": "1. Scope & Commitment",
        "body": "Kalam Robotics Society (KRS) at IILM University, Greater Noida, operates this web platform and the AURIX competition ecosystem. We are committed to strict data minimization, collecting only information necessary to administer competition registrations, verify collegiate enrollment, and deliver participant notifications."
      },
      {
        "heading": "2. Information Collected",
        "body": "We collect participant names, institutional email addresses, student identification numbers, and contact telephone numbers exclusively for event logistics. We never sell, monetize, or publicly distribute participant contact information."
      },
      {
        "heading": "3. Submission & Intellectual Property Protection",
        "body": "Technical proposals, code repositories, circuit schematics, and presentation files submitted to AURIX competitions are restricted to assigned evaluation judges and faculty organizers. Submissions are never made public without explicit team authorization."
      },
      {
        "heading": "4. Cookies & Session Storage",
        "body": "We use secure HTTP-only cookies strictly for authenticated sessions (Participant Portal, Judge Portal, CMS Admin). We do not deploy cross-site tracking or third-party advertising cookies."
      }
    ]
  },
  "terms": {
    "title": "Terms of Service & Competition Rules",
    "lastUpdated": "24 September 2026 // Effective Version 1.0",
    "sections": [
      {
        "heading": "1. Eligibility & Conduct",
        "body": "Participation in KRS and AURIX events is open to bona fide college and university students. Participants must uphold collegiate ethics, laboratory safety standards, and respectful conduct toward peers, mentors, and judges."
      },
      {
        "heading": "2. Originality & Disqualification",
        "body": "All prototypes, software repositories, and design schematics submitted to AURIX competitions must be original student work. Pre-completed solutions, commercial off-the-shelf clones, or direct plagiarism will result in immediate disqualification."
      },
      {
        "heading": "3. Generative AI Policy",
        "body": "Generative AI tools (LLMs, code generation assistants) are permitted as modern productivity amplifiers. However, substantial AI assistance must be explicitly disclosed in the project dossier. Undisclosed generative automation may incur scoring penalties."
      },
      {
        "heading": "4. Judging Authority",
        "body": "The scoring decisions of the official AURIX evaluation panel and faculty committee are final and binding in all technical disputes."
      }
    ]
  }
}
