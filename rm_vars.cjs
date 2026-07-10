const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(`          bannerAdsEnabled: data.bannerAdsEnabled ?? false,\n`, '');
code = code.replace(`          totalBannerSlots: data.totalBannerSlots ?? 0,\n`, '');
code = code.replace(`          bannerSpotIds: data.bannerSpotIds ?? [],\n`, '');
code = code.replace(`          totalBannerAds: data.totalBannerAds ?? 0,\n`, '');
code = code.replace(`          onclickaBanners: data.onclickaBanners ?? [],\n`, '');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Removed banner variables from userShortenerSettings");
