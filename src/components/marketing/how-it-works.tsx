import { Zap, Users, Clock } from 'lucide-react';

const steps = [
  {
    icon: Zap,
    title: 'Tap match',
    description: 'Choose 25 or 50 minutes and tap one button.',
  },
  {
    icon: Users,
    title: 'Meet your coworker',
    description: 'We pair you with someone ready to focus.',
  },
  {
    icon: Clock,
    title: 'Focus with a timer',
    description: 'Work side by side until the timer ends.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-textPrimary sm:text-3xl">
          How it works
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-center rounded-card bg-bgSecondary border border-borderNeutral p-6 text-center"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-focusBlue/10 text-focusBlue">
                <step.icon size={24} />
              </div>
              <h3 className="text-base font-semibold text-textPrimary">{step.title}</h3>
              <p className="mt-2 text-sm text-textMuted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
