let validWords: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;

export function getValidWords(): Promise<Set<string>> {
  if (validWords) return Promise.resolve(validWords);
  if (!loading) {
    loading = fetch('/words/valid.json')
      .then(r => r.json() as Promise<string[]>)
      .then(words => {
        validWords = new Set(words);
        return validWords;
      });
  }
  return loading;
}
