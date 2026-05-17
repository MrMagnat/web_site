import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // /ru/catalog → /catalog (для дефолтного), /en/catalog
  localeDetection: false,    // не читать Accept-Language — выбор пользователя явный
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin|uploads|.*\\..*).*)"],
};
