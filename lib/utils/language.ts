import ISO6391 from "iso-639-1";

export const getLanguageName = (code: string) => {
  const languageName = ISO6391.getName(code);
  return languageName || code.toUpperCase();
};
