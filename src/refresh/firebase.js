import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
export const configured = Boolean(process.env.REACT_APP_API_KEY && process.env.REACT_APP_PROJECT_ID && process.env.REACT_APP_API_BASE_URL);
export const auth = configured ? getAuth(initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  appId: process.env.REACT_APP_APP_ID,
}, "talknest-refresh")) : null;
export const apiBase = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
export async function api(path, options = {}) {
  if (!auth?.currentUser) throw new Error("Please sign in.");
  const response = await fetch(apiBase + "/api" + path, {
    ...options, headers: { "Content-Type": "application/json",
      Authorization: "Bearer " + await auth.currentUser.getIdToken(), ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
