// app-types.d.ts
export {};

declare global {
  interface Window {
    electron: {
      saveFile: (
        filePath: string | null,
        content: string
      ) => Promise<{
        success: boolean;
        canceled?: boolean;
        filePath: string | null;
      }>;
      openFile: () => Promise<{
        content: string;
        filePath: string | null;
      } | null>;
      newFile: () => Promise<void>;
    };
  }
}