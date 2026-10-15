export function cosineSimilarity(a, b) {
  if (!a.length || a.length !== b.length) throw new Error('Embedding dimensions must match');
  const dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return norm ? dot / norm : 0;
}

export class SimpleVectorStore {
  constructor(embeddingModel) { this.embeddingModel = embeddingModel; this.documents = []; }
  async add(documents) {
    const vectors = await this.embeddingModel.embed(documents.map(document => document.text));
    this.documents = documents.map((document, i) => ({ ...document, embedding: vectors[i] }));
  }
  async similaritySearch(query, topK = 1) {
    const [embedding] = await this.embeddingModel.embed([query]);
    return this.documents.map(document => ({ document, score: cosineSimilarity(embedding, document.embedding) }))
      .sort((a, b) => b.score - a.score).slice(0, topK).map(item => item.document);
  }
}
