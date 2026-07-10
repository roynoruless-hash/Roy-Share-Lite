const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/        bannerAdsEnabled: false,\n/g, '');
code = code.replace(/        totalBannerSlots: 0,\n/g, '');
code = code.replace(/        bannerSpotIds: \[\],\n/g, '');
code = code.replace(/        totalBannerAds: 0,\n/g, '');

code = code.replace(/        bannerAdsEnabled: globalSettings.bannerAdsEnabled \?\? false,\n/g, '');
code = code.replace(/        totalBannerSlots: globalSettings.totalBannerSlots \?\? 0,\n/g, '');
code = code.replace(/        bannerSpotIds: globalSettings.bannerSpotIds \?\? \[\],\n/g, '');
code = code.replace(/        totalBannerAds: globalSettings.totalBannerAds \?\? 0,\n/g, '');

code = code.replace(/          bannerAdsEnabled: data.bannerAdsEnabled \?\? false,\n/g, '');
code = code.replace(/          totalBannerSlots: data.totalBannerSlots \?\? 0,\n/g, '');
code = code.replace(/          bannerSpotIds: data.bannerSpotIds \?\? \[\],\n/g, '');
code = code.replace(/          totalBannerAds: data.totalBannerAds \?\? 0,\n/g, '');

fs.writeFileSync('server.ts', code);
console.log("Removed banner settings from server.ts");
