import { writable } from 'svelte/store';
import { siteConfig } from '../../../site.config.js';

const initialLang = siteConfig.internationalization?.defaultLanguage || 'en';

export const currentLanguage = writable(initialLang);
