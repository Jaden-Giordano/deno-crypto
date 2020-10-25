export const toHex = (data: Uint8Array): string => {
  return (data as any).map((x: number): string => x.toString(16).padStart(2, '0')).join('');
};

export const fromHex = (data: string): Uint8Array => {
  const buffer = [];
  for (let index = 0; index < data.length - 1; index += 2) {
    buffer.push(parseInt(data.slice(index, index + 2), 16));
  }
  return new Uint8Array(buffer);
};
