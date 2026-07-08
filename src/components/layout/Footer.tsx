import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function Footer() {
  const t      = useTranslations("footer");
  const locale = useLocale();
  const prefix = locale === "ru" ? "" : "/en";

  return (
    <footer className="bg-[#191E1B] text-white/55 pt-16 pb-8 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">

          {/* Brand */}
          <div>
            <p className="font-prata text-[17px] tracking-[0.14em] uppercase text-white mb-4">
              Андруа Фамиль
            </p>
            <p className="text-[13px] leading-[1.75] text-white/45 max-w-[220px]">
              Бренд домашнего текстиля. Создаём уют и комфорт в каждом доме.
            </p>
          </div>

          {/* Buyers */}
          <div>
            <h4 className="text-[10px] tracking-[0.22em] uppercase text-white/35 mb-5">
              {t("buyers")}
            </h4>
            <ul className="space-y-2.5 list-none">
              <li>
                <Link href={`${prefix}/info/delivery`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.delivery")}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/return`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.return")}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/info/size-guide`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.sizes")}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/info/care`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.care")}
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-[10px] tracking-[0.22em] uppercase text-white/35 mb-5">
              {t("about")}
            </h4>
            <ul className="space-y-2.5 list-none">
              <li>
                <Link href={`${prefix}/info/about`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.company")}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/info/values`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.values")}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/info/partnership`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.partner")}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/info/contacts`} className="text-[13px] text-white/55 hover:text-white transition-colors duration-200">
                  {t("links.contacts")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal info */}
        <div className="border-t border-white/8 pt-6 mb-4">
          <p className="text-[11px] text-white/25 leading-relaxed">
            ООО «Андруа Фамиль»&nbsp;&nbsp;·&nbsp;&nbsp;
            ОГРН&nbsp;1267700195795&nbsp;&nbsp;·&nbsp;&nbsp;
            ИНН&nbsp;9729420867&nbsp;&nbsp;·&nbsp;&nbsp;
            КПП&nbsp;772901001&nbsp;&nbsp;·&nbsp;&nbsp;
            Юридический адрес: 119330, г. Москва, ул. Мосфильмовская, д. 37, к. 2, помещ. 3П
          </p>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/30">{t("rights")}</p>
        </div>
      </div>
    </footer>
  );
}
