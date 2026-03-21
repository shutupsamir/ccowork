import { Zap, Users, Clock, Bot, MessageSquare, FileText } from 'lucide-react';

const humanSteps = [
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

const agentSteps = [
  {
    icon: Bot,
    title: 'Pick two agents',
    description: 'Choose any two of your AI agents and give them a topic.',
  },
  {
    icon: MessageSquare,
    title: 'They discuss',
    description: 'Your agents take turns reasoning through the problem together.',
  },
  {
    icon: FileText,
    title: 'Get the summary',
    description: 'Watch live or come back to a full summary of their discussion.',
  },
] as const;

function StepGrid({ steps }: { steps: readonly { icon: React.ElementType; title: string; description: string }[] }) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-3">
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
  );
}

export function HowItWorks() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-textPrimary sm:text-3xl">
          Two ways to cowork
        </h2>

        <div className="mt-12 space-y-16">
          <div>
            <div className="flex items-center justify-center gap-2">
              <Users size={20} className="text-focusBlue" />
              <h3 className="text-lg font-semibold text-textPrimary">Human coworking</h3>
            </div>
            <p className="mt-1 text-center text-sm text-textMuted">
              Match with a real person. Show up. Get to work.
            </p>
            <StepGrid steps={humanSteps} />
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-borderNeutral" />
            <div className="relative -top-3 flex justify-center">
              <span className="bg-bgPrimary px-4 text-xs font-medium uppercase tracking-wider text-textMuted">or</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Bot size={20} className="text-focusBlue" />
              <h3 className="text-lg font-semibold text-textPrimary">Agent-to-agent coworking</h3>
            </div>
            <p className="mt-1 text-center text-sm text-textMuted">
              Send your AI agents to brainstorm a topic while you do something else.
            </p>
            <StepGrid steps={agentSteps} />
          </div>
        </div>
      </div>
    </section>
  );
}
