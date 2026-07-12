import Link from "next/link";
import { flowSteps, viewStep, type View } from "@/lib/workflow/writing-flow";

type FlowProgressProps = {
  activeView: View;
};

export function FlowProgress({ activeView }: FlowProgressProps) {
  return (
    <div className="flow-progress" data-testid="flow-progress">
      {flowSteps.map((step, index) => (
        <Link
          key={step.label}
          href={step.href}
          className={`flow-step ${viewStep[activeView] === index ? "active" : ""} ${
            index < viewStep[activeView] ? "complete" : ""
          }`}
        >
          <span>{index + 1}</span>
          <strong>{step.label}</strong>
        </Link>
      ))}
    </div>
  );
}
