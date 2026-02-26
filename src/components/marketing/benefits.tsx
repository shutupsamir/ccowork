const benefits = [
  {
    title: 'Real accountability',
    description:
      'A person waiting for you is more powerful than any app.',
  },
  {
    title: 'Calm structure',
    description:
      '25 or 50 minute sessions. No complexity.',
  },
  {
    title: 'Human presence',
    description:
      "Focus isn't about blocking distractions. It's about showing up.",
  },
] as const;

export function Benefits() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-semibold text-textPrimary sm:text-3xl">
          Built for real work
        </h2>

        <div className="mt-12 space-y-8">
          {benefits.map((b) => (
            <div key={b.title} className="text-center">
              <h3 className="text-lg font-semibold text-textPrimary">{b.title}</h3>
              <p className="mt-1 text-textMuted">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
