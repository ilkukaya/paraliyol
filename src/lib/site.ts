import settings from "../../data/site-settings.json";

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in Netlify when a custom domain is added. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://paraliyol.netlify.app").replace(/\/$/, "");
export const SITE_NAME = settings.siteName;
export const SITE_TAGLINE = settings.tagline;
export const LAST_DATA_CHECK = settings.lastDataCheck;
export const ANNOUNCEMENT = settings.announcement;

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ""; // ca-pub-XXXXXXXX
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ""; // G-XXXXXXX
export const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID || "";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
