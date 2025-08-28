function createUrlWithParams(url: string, params: Record<string, string>) {
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });
  return urlObj.toString();
}

type DictionaryLink = {
  name: string;
  icon: string;
  url: string;
};

const dictionaries: Record<string, (str: string) => DictionaryLink[]> = {
  de: (str) => [
    {
      name: "Satzapp",
      icon: "https://www.satzapp.com/favicon.ico",
      url: createUrlWithParams("https://www.satzapp.com", {
        t: str,
      }),
    },
  ],
  ja: (str) => [
    {
      name: "Jisho",
      icon: "https://assets.jisho.org/assets/favicon-062c4a0240e1e6d72c38aa524742c2d558ee6234497d91dd6b75a182ea823d65.ico",
      url: `https://jisho.org/search/${str}`,
    },
  ],
  ru: (str) => [
    {
      name: "Reverso",
      icon: "https://cdn.reverso.net/context/v80510/images/reverso180.png",
      url: `https://context.reverso.net/translation/russian-english/${str}`,
    },
    {
      name: "PONS",
      icon: "https://en.pons.com/favicon.ico",
      url: createUrlWithParams(
        "https://en.pons.com/text-translation/russian-english",
        {
          q: str,
        },
      ),
    },
  ],
  es: (str) => [
    {
      name: "SpanishDict",
      icon: "https://neodarwin-prod.sdcdns.com/img/common/apple-touch-icons/favicon-production.png",
      url: `https://www.spanishdict.com/translate/${encodeURIComponent(str)}`,
    },
  ],
};

export function getDictionaryLinks(
  language: string,
  str: string,
): DictionaryLink[] | null {
  return dictionaries[language]?.(str) || null;
}
