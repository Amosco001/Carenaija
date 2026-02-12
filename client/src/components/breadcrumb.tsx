import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="bg-white border-b" aria-label="Breadcrumb" data-testid="nav-breadcrumb">
      <div className="container mx-auto px-4 py-3">
        <ol className="flex items-center gap-2 text-sm flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/" className="text-slate-500 hover:text-emerald-600 flex items-center gap-1" data-testid="breadcrumb-home">
              <Home className="w-4 h-4" />
              <span itemProp="name">Home</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {item.href ? (
                <Link href={item.href} className="text-slate-500 hover:text-emerald-600" data-testid={`breadcrumb-${index + 1}`}>
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span className="text-slate-900 font-medium truncate max-w-[200px]" itemProp="name" data-testid={`breadcrumb-${index + 1}`}>
                  {item.label}
                </span>
              )}
              <meta itemProp="position" content={String(index + 2)} />
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
