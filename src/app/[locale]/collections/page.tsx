import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface CollectionCard {
  id: string;
  slug: string;
  nameRu: string;
  nameEn: string;
  image: string | null;
}

async function fetchCollections(): Promise<CollectionCard[]> {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return collections.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      nameRu: c.nameRu,
      nameEn: c.nameEn,
      image: c.image ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function CollectionsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRu = locale === "ru";
  const prefix = isRu ? "" : "/en";

  const collections = await fetchCollections();

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
      <Navbar />
      <main className="pt-[72px]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
          {/* Header */}
          <div className="mb-8">
            <p
              className="text-[10px] tracking-[0.28em] uppercase mb-2"
              style={{ color: "#9a9a9a" }}
            >
              {isRu ? "Каталог" : "Catalog"}
            </p>
            <h1
              className="font-prata text-[32px] md:text-[40px]"
              style={{ color: "#191E1B" }}
            >
              {isRu ? "Коллекции" : "Collections"}
            </h1>
          </div>

          {collections.length === 0 ? (
            <div className="text-center py-24">
              <p
                className="font-prata text-[20px] mb-3"
                style={{ color: "#191E1B" }}
              >
                {isRu ? "Коллекции пока не добавлены" : "No collections yet"}
              </p>
              <p className="text-[13px] mb-6" style={{ color: "#9a9a9a" }}>
                {isRu
                  ? "Загляните в наш каталог"
                  : "Take a look at our catalog"}
              </p>
              <Link
                href={`${prefix}/catalog`}
                className="inline-block text-[11px] tracking-[0.16em] uppercase border-b pb-0.5 transition-opacity hover:opacity-70"
                style={{ color: "#3F1111", borderColor: "#3F1111" }}
              >
                {isRu ? "Весь каталог" : "All products"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {collections.map((col) => {
                const name = isRu ? col.nameRu : col.nameEn || col.nameRu;
                return (
                  <Link
                    key={col.id}
                    href={`${prefix}/catalog?collection=${col.slug}`}
                    className="group cursor-pointer block"
                  >
                    <div
                      className="relative overflow-hidden aspect-[3/4] mb-4"
                      style={{ background: "#F7F0EC" }}
                    >
                      {col.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={col.image}
                          alt={name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(.25,.46,.45,.94)] group-hover:scale-[1.06]"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "#e8e0da" }}
                        >
                          <span
                            className="font-prata text-[20px] px-4 text-center"
                            style={{ color: "#3F1111" }}
                          >
                            {name}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#191E1B]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <p
                      className="font-prata text-[17px] leading-snug"
                      style={{ color: "#191E1B" }}
                    >
                      {name}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
