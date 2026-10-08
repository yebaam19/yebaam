export type AssetKind = 'image' | 'video' | 'document';
export interface LibraryAsset {
  id: string; community_id: string; kind: AssetKind; folder_id: string | null;
  title: string; description: string; media_id: string; original_name: string;
  content_type: string; size_bytes: number | null; duration_seconds: number | null;
  uploaded_by: string | null; visibility: 'editors' | 'members' | 'public';
  is_published: boolean; version: number; created_at: string;
  uploader_name?: string | null;
}
export interface AssetFolder {
  id: string; community_id: string; kind: AssetKind; title: string; is_visible: boolean; version: number;
}
export interface LibraryCursor { id: string; createdAt: string }
export interface LibraryPage { items: LibraryAsset[]; nextCursor: LibraryCursor | null }
export interface FolderPage { items: AssetFolder[]; nextCursor: LibraryCursor | null }
export interface PlanAttachment {
  id: string; community_id: string; point_id: string; asset_id: string; position: number;
  asset: LibraryAsset;
}
