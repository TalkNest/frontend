import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Workspace from "./Workspace";
jest.mock("./firebase", () => ({ configured: false, auth: null, apiBase: "", api: jest.fn() }));
jest.mock("firebase/auth", () => ({}));
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  Object.defineProperty(window, "crypto", { value: { randomUUID: () => "test-uuid" }, configurable: true });
});
test("preview is explicit and does not pretend to be a real conversation", () => {
  render(<Workspace/>);
  expect(screen.getByText("PREVIEW MODE")).toBeInTheDocument();
  expect(screen.getByText(/Sample conversations only/)).toBeInTheDocument();
});
test("send, search, and select a conversation", async () => {
  render(<Workspace/>);
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Preview test message" } });
  fireEvent.click(screen.getByLabelText("Send message"));
  expect(await screen.findByText("Preview test message")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search conversations"), { target: { value: "Devon" } });
  fireEvent.click(screen.getByRole("button", { name: /Devon Park/ }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "Devon Park" })).toBeInTheDocument());
});
test("call preview can mute, disable camera and end without accessing devices", () => {
  render(<Workspace/>);
  fireEvent.click(screen.getByLabelText("Start video call"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText(/Your microphone and camera are not being accessed/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mute" }));
  expect(screen.getByRole("button", { name: "Unmute" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Camera off" }));
  expect(screen.getByRole("button", { name: "Camera on" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "End call", exact: true }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
