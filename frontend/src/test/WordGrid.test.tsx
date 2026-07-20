import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WordGrid } from "../features/grid/WordGrid";
import type { PredictedWord } from "../api/types";

const sampleWords: PredictedWord[] = [
  { word: "yes", category: "social", urgent: false, rank: 1, reason: "" },
  { word: "no", category: "social", urgent: false, rank: 2, reason: "" },
  { word: "help", category: "urgent", urgent: true, rank: 3, reason: "" },
];

describe("WordGrid", () => {
  it("renders every word as a button", () => {
    render(<WordGrid words={sampleWords} onTapWord={() => {}} />);
    expect(screen.getByText("yes")).toBeInTheDocument();
    expect(screen.getByText("no")).toBeInTheDocument();
    expect(screen.getByText("help")).toBeInTheDocument();
  });

  it("fires onTapWord with the correct word when a cell is tapped", async () => {
    const onTap = vi.fn();
    const user = userEvent.setup();
    render(<WordGrid words={sampleWords} onTapWord={onTap} />);

    await user.click(screen.getByText("help"));

    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTap).toHaveBeenCalledWith("help");
  });

  it("does not fire when disabled", async () => {
    const onTap = vi.fn();
    const user = userEvent.setup();
    render(<WordGrid words={sampleWords} onTapWord={onTap} disabled />);

    await user.click(screen.getByText("yes"));

    expect(onTap).not.toHaveBeenCalled();
  });

  it("labels urgent cells for screen readers", () => {
    render(<WordGrid words={sampleWords} onTapWord={() => {}} />);
    // The urgent 'help' cell includes 'urgent' in its aria-label.
    const helpButton = screen.getByLabelText(/help.*urgent/i);
    expect(helpButton).toBeInTheDocument();
  });
});