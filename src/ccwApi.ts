import type VirtualMachine from "./virtual-machine";

export interface OnlineExtConfig {
  fileSrc: "";
  hosts: {
    cloudDBHost: "https://community-web-cloud-database.ccw.site";
    mmoHost: "wss://mo.ccw.site";
    gandiMainHost: "https://gandi-main.ccw.site";
    translate: "https://community-web.ccw.site/ccw-main/external/mt/translate/";
    tts: "https://community-web.ccw.site/ccw-main/external/speech/tts/";
  };
  GandiMedia: {
    api: any;
  };
  GandiAchievementAndLeaderboard: {
    api: any;
  };
  GandiAsyncAssetManager: {
    api: any;
  };
  GandiEconomy: {
    api: any;
  };
}

export interface ProjectStats {
  commentCount: number;
  favoriteCount: number;
  likeCount: number;
  totalBucks: number;
}

export interface CCWApi {
  getOpenVM(): Partial<VirtualMachine>;
  getOnlineExtensionsConfig(): OnlineExtConfig;
  getExtensionURLById(id: string): Promise<string>;
  /**
   * 获取用户投了几个币
   */
  getCoinCount(): Promise<number>;
  commentWithStageSnapshot(): Promise<any>;
  getDeviceType(): Promise<"PC">;
  getProjectDonateRanking: Function;
  getProjectSb3Id(): string;
  getProjectStats(): Promise<ProjectStats>;
  getProjectUUID: Function;
  getUserInfo: Function;
  isFavoriteProject: Function;
  isFollowed(): Promise<boolean>;
  isLiked(): Promise<boolean>;
  isLikedProject(): Promise<boolean>;
  isMyFans(): Promise<boolean>;
  preActionInterceptor: Function;
  redirect: Function;
  requestCoins: Function;
  requestFollow: Function;
  sendPlayEventCode: Function;
  setAvatar: Function;
  showShare: Function;
  uploadAssetToCloud: Function;
}
