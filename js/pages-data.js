/**
 * Lightweight barrel re-exporting modularized page data for Smart-City-Led.com
 */
import { PAGE_UI_LABELS, MENU_CATEGORIES } from './data/nav-menu.js';
import { BLOG_POSTS } from './data/blog-posts.js';
import { SOLAR_PAGES } from './data/pages-solar.js';
import { CLIM_PAGES } from './data/pages-clim.js';
import { EV_AND_GROUP_PAGES } from './data/pages-ev-group.js';

export { PAGE_UI_LABELS, MENU_CATEGORIES, BLOG_POSTS };

export const PAGES_DATA = {
  ...SOLAR_PAGES,
  ...CLIM_PAGES,
  ...EV_AND_GROUP_PAGES
};
