import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <header className="space-y-3">
      {breadcrumbs ? <div>{breadcrumbs}</div> : null}

      <div className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <div className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:max-w-[65%] xl:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
