import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

// base-ui's floating menus measure their trigger, which jsdom cannot do.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

const trigger = () => screen.getByRole("button", { name: "Theme" });
const menuIsOpen = () => trigger().getAttribute("aria-expanded") === "true";

afterEach(cleanup);

describe("theme toggle (AC-3, AC-4, AC-5)", () => {
  it("offers light, dark and follow the system as radio items", () => {
    renderToggle();
    fireEvent.click(trigger());

    const items = screen.getAllByRole("menuitemradio");
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      "Light",
      "Dark",
      "Follow the system",
    ]);
    expect(
      items.filter((item) => item.getAttribute("aria-checked") === "true"),
    ).toHaveLength(1);
  });

  it("applies and saves the choice that was picked", () => {
    renderToggle();
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Dark" }));

    expect(localStorage.getItem("veni-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  // Regression: choosing a theme must close the menu and take focus out of it.
  // base-ui's radio item defaults closeOnClick to false, so without it the
  // popup stayed open with focus stranded on the item.
  //
  // This asserts that focus left the popup. Returning it all the way to the
  // trigger is base-ui's focus management and does not run under jsdom's
  // synthetic events, so it is verified in a real browser instead
  // (activeElement === the trigger, both by mouse and by keyboard).
  it("closes the menu and takes focus out of it after a choice", () => {
    renderToggle();
    const button = trigger();

    button.focus();
    fireEvent.click(button);
    expect(menuIsOpen()).toBe(true);

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Light" }));

    expect(menuIsOpen()).toBe(false);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement?.closest('[role="menu"]')).toBeNull();
  });
});
