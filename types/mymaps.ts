/** Google My Maps 연결 정보 */
export interface MyMapsConnection {
  mapId: string;
  viewerUrl: string;
  lastSyncAt?: string;
  lastSyncResult?: MyMapsSyncResult;
}

/** 동기화 결과 */
export interface MyMapsSyncResult {
  addedCount: number;
  updatedCount: number;
  deletedCount: number;
}
