import Breadcrumbs from "./Breadcrumbs";

export default function ProsePage({
  title,
  lead,
  path,
  crumbs = [],
  updated,
  children,
}: {
  title: string;
  lead?: string;
  path: string;
  crumbs?: { name: string; href: string }[];
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[...crumbs, { name: title, href: path }]} />
      <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
      {lead && <p className="muted mt-4 text-lg leading-8">{lead}</p>}
      {updated && <p className="muted mt-2 text-sm">Son güncelleme: {updated}</p>}
      <div className="prose-tr mt-6">{children}</div>
    </div>
  );
}
