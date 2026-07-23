import { createClient } from "@/lib/supabase/server";

function createBucketStorage(bucket: string) {
  return {
    async upload(file: File): Promise<string> {
      const supabase = await createClient();
      // 원본 파일명은 사용자가 자유롭게 정하는 값(한글 등 포함 가능)이라 Storage 키로 쓰기에 안전하지 않다.
      // 대신 매 업로드마다 새 랜덤 폴더를 사용하고, 실제 파일명은 별도 컬럼에 저장한다.
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${crypto.randomUUID()}/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });

      if (error) {
        throw new Error(`파일 업로드에 실패했습니다: ${error.message}`);
      }

      return path;
    },
    async getSignedUrl(path: string): Promise<string | null> {
      const supabase = await createClient();
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);

      if (error || !data) return null;
      return data.signedUrl;
    },
    async remove(paths: string[]): Promise<void> {
      if (paths.length === 0) return;
      const supabase = await createClient();
      await supabase.storage.from(bucket).remove(paths);
    },
  };
}

const bomStorage = createBucketStorage("bom-files");
export const uploadBomFile = bomStorage.upload;
export const getBomFileSignedUrl = bomStorage.getSignedUrl;
export const deleteBomFile = (path: string) => bomStorage.remove([path]);
export const deleteBomFiles = bomStorage.remove;

const purchaseStorage = createBucketStorage("purchase-files");
export const uploadPurchaseFile = purchaseStorage.upload;
export const getPurchaseFileSignedUrl = purchaseStorage.getSignedUrl;
export const deletePurchaseFile = (path: string) => purchaseStorage.remove([path]);
export const deletePurchaseFiles = purchaseStorage.remove;

const generalDocumentStorage = createBucketStorage("general-documents");
export const uploadGeneralDocumentFile = generalDocumentStorage.upload;
export const getGeneralDocumentFileSignedUrl = generalDocumentStorage.getSignedUrl;
export const deleteGeneralDocumentFile = (path: string) => generalDocumentStorage.remove([path]);

const designJournalStorage = createBucketStorage("design-journal-files");
export const uploadDesignJournalFile = designJournalStorage.upload;
export const getDesignJournalFileSignedUrl = designJournalStorage.getSignedUrl;
export const deleteDesignJournalFile = (path: string) => designJournalStorage.remove([path]);

const workJournalStorage = createBucketStorage("work-journal-files");
export const uploadWorkJournalFile = workJournalStorage.upload;
export const getWorkJournalFileSignedUrl = workJournalStorage.getSignedUrl;
export const deleteWorkJournalFile = (path: string) => workJournalStorage.remove([path]);

const dataEntryStorage = createBucketStorage("data-entry-files");
export const uploadDataEntryFile = dataEntryStorage.upload;
export const getDataEntryFileSignedUrl = dataEntryStorage.getSignedUrl;
export const deleteDataEntryFile = (path: string) => dataEntryStorage.remove([path]);
