import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const page = await prisma.pageContent.findUnique({ where: { slug } });
  if (!page || !page.content) notFound();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[72px]">
        <div className="max-w-[800px] mx-auto px-6 md:px-8 py-14">
          {page.titleRu && (
            <h1 className="font-prata text-[26px] sm:text-[32px] text-[#191E1B] mb-10 leading-tight">
              {page.titleRu}
            </h1>
          )}
          {/* Render HTML content safely */}
          <div
            className="prose-custom text-[#191E1B] overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
