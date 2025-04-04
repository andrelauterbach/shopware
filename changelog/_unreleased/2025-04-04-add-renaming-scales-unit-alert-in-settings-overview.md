---
title: Add renaming scales unit banner in Settings overview
issue: #8226
author: Le Nguyen
author_email: nguyenquocdaile@gmail.com
author_github: @nguyenquocdaile
---
# Administration
* Added `sw_settings_content_card_view_banner_info` block to show banner info for settings overview in `src/module/sw-settings/page/sw-settings-index/sw-settings-index.html.twig`
* Added `isUnitBannerVisible` data property to check if the banner is visible in `src/module/sw-settings/page/sw-settings-index/index.js`.
* Added `created` property to get a localStorage item in `src/module/sw-settings/page/sw-settings-index/index.js`.
* Added `onCloseUnitBanner` method to `src/module/sw-settings/page/sw-settings-index/index.js` to close the banner.
