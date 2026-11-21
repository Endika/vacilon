export type Progress = (loaded: number, total: number | null) => void;

export function contentLength(response: Response): number | null {
  const header = Number(response.headers.get('content-length'));
  return header > 0 ? header : null;
}

/** Reads the whole stream, reporting the cumulative byte count after each chunk. */
export async function readChunks(
  body: ReadableStream<Uint8Array>,
  onProgress: (loaded: number) => void = () => undefined,
): Promise<Uint8Array<ArrayBuffer>[]> {
  const reader = body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as Uint8Array<ArrayBuffer>);
    loaded += value.length;
    onProgress(loaded);
  }
  return chunks;
}

export function concat(chunks: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export async function readWithProgress(
  response: Response,
  onProgress: Progress,
): Promise<ArrayBuffer> {
  const total = contentLength(response);
  if (!response.body) return response.arrayBuffer();
  const chunks = await readChunks(response.body, (loaded) => onProgress(loaded, total));
  return concat(chunks).buffer;
}
