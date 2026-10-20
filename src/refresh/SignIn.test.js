import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SignIn } from "./Workspace";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, updateProfile } from "firebase/auth";

jest.mock("./firebase", () => ({ configured: true, auth: { name: "current-auth" }, apiBase: "", api: jest.fn() }));
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());
function enterCredentials() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "fixture@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "fixture-password" } });
}
test("original cover and branding are shown without the replacement hero", () => {
  const { container } = render(<SignIn onDemo={jest.fn()}/>);
  expect(container.querySelector(".tn-original-cover")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "TalkNest" })).toBeInTheDocument();
  expect(screen.getByText("Access to each other")).toBeInTheDocument();
  expect(screen.queryByText(/Good conversations/)).not.toBeInTheDocument();
});
test("login continues using the current Firebase instance", async () => {
  render(<SignIn onDemo={jest.fn()}/>);
  enterCredentials();
  await act(async () => fireEvent.submit(screen.getByRole("form", { name: "Login" })));
  await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, "fixture@example.test", "fixture-password"));
  await waitFor(() => expect(within(screen.getByRole("form", { name: "Login" })).getByRole("button", { name: "Login", exact: true })).toBeEnabled());
});
test("register tab preserves account creation and display name", async () => {
  const user = { uid: "fixture" };
  createUserWithEmailAndPassword.mockResolvedValue({ user });
  render(<SignIn onDemo={jest.fn()}/>);
  fireEvent.click(within(screen.getByRole("navigation", { name: "Authentication" })).getByRole("button", { name: "Register" }));
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Test Person" } });
  enterCredentials();
  await act(async () => fireEvent.submit(screen.getByRole("form", { name: "Register" })));
  await waitFor(() => expect(updateProfile).toHaveBeenCalledWith(user, { displayName: "Test Person" }));
});
test("Google, password reset and preview actions stay available", async () => {
  const preview = jest.fn();
  render(<SignIn onDemo={preview}/>);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /Sign in with Google/ })));
  await waitFor(() => expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.anything()));
  enterCredentials();
  await waitFor(() => expect(screen.getByRole("button", { name: "Forgot password?" })).toBeEnabled());
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Forgot password?" })));
  await waitFor(() => expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, "fixture@example.test"));
  await screen.findByText(/check your email for a reset link/);
  fireEvent.click(screen.getByRole("button", { name: "Explore the interactive preview" }));
  expect(preview).toHaveBeenCalledTimes(1);
});
