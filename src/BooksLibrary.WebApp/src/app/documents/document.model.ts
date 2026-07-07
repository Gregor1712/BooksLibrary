export interface Document {
  id: string;
  volumeInfo: {
    title: string;
    authors: Array<string>;
  };
}
