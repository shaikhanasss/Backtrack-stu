export function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      {description ? <p className="mt-2 text-white/70">{description}</p> : null}
    </div>
  );
}
