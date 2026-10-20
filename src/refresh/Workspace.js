import React, { useEffect, useRef, useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from "firebase/auth";
import { io } from "socket.io-client";
import { api, apiBase, auth, configured } from "./firebase";
import Icon from "./Icons";
import CallPanel from "./CallPanel";
import useCall from "./useCall";
import "./workspace.css";
import "./login.css";

const demoUser = { uid: "demo-you", displayName: "Yuqi Guo" };
const demoChats = [
  { id: "demo-1", peer: { uid: "morgan", displayName: "Morgan Lee" }, lastMessage: "A little space for a great conversation.", updatedAt: 3 },
  { id: "demo-2", peer: { uid: "devon", displayName: "Devon Park" }, lastMessage: "Chat, call, and stay in the loop.", updatedAt: 2 },
  { id: "demo-3", peer: { uid: "alex", displayName: "Alex Chen" }, lastMessage: "Everything starts with a hello.", updatedAt: 1 },
];
const initialMessages = {
  "demo-1": [
    { id: "m1", senderId: "morgan", text: "Hey Yuqi 👋 Welcome back to TalkNest.", createdAt: 1792458000000 },
    { id: "m2", senderId: "morgan", text: "A little space for a great conversation. Messages, voice, and video — all in one place.", createdAt: 1792458060000 },
    { id: "m3", senderId: "demo-you", text: "Exactly what I had in mind. Let’s make keeping in touch feel simple.", createdAt: 1792458120000 },
    { id: "m4", senderId: "morgan", text: "Try the call buttons above to explore the new interface. This is a local demo, so nothing will be sent to anyone.", createdAt: 1792458180000 },
  ],
};
function Avatar({ person, large = false }) {
  return <span className={`tn-avatar ${large ? "large" : ""}`} aria-hidden="true">
    {person?.photoURL ? <img src={person.photoURL} alt="" referrerPolicy="no-referrer"/> : (person?.displayName || "T").split(" ").map(w => w[0]).slice(0, 2).join("")}
  </span>;
}
const friendlyAuthError = e => ({
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/email-already-in-use": "This email already has an account. Please sign in.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/popup-closed-by-user": "Sign-in was cancelled. You can try again.",
  "auth/unauthorized-domain": "This hostname has not been approved in Firebase Authentication yet.",
  "auth/operation-not-allowed": "This sign-in method has not been enabled in Firebase yet.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
}[e.code] || "Could not sign in. Please try again.");

export function SignIn({ onDemo }) {
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [name, setName] = useState(""), [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  const run = async fn => { setNotice(""); setBusy(true); try { await fn(); } catch (e) { setNotice(friendlyAuthError(e)); } finally { setBusy(false); } };
  function submit(e) {
    e.preventDefault();
    run(async () => {
      if (signup) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name.trim() });
      } else await signInWithEmailAndPassword(auth, email, password);
    });
  }
  return <main className="tn-original-auth">
    <div className="tn-original-cover" aria-hidden="true"/>
    <section className="tn-original-form"><div className="tn-original-items">
      <h1 className="tn-original-title">TalkNest</h1>
      <p className="tn-original-tagline">Access to each other</p>
      <nav className="tn-original-tabs" aria-label="Authentication">
        <button type="button" className={!signup ? "active" : ""} aria-pressed={!signup} disabled={busy}
          onClick={() => { setSignup(false); setNotice(""); }}>Login</button>
        <button type="button" className={signup ? "active" : ""} aria-pressed={signup} disabled={busy}
          onClick={() => { setSignup(true); setNotice(""); }}>Register</button>
      </nav>
      <p className="tn-original-intro">{signup ? "A new conversation starts with you." : "Sign in to pick up the conversation."}</p>
      <form aria-label={signup ? "Register" : "Login"} onSubmit={submit}>
        {signup && <label className="tn-original-field">Your name
          <input placeholder="Your name" required maxLength={70} value={name}
            onChange={e => setName(e.target.value)} autoComplete="name"/>
        </label>}
        <label className="tn-original-field">Email
          <input placeholder="you@example.com" type="email" required value={email}
            onChange={e => setEmail(e.target.value)} autoComplete="email"/>
        </label>
        <div className="tn-original-password-label">
          <label htmlFor="tn-login-password">Password</label>
          {!signup && <button type="button" className="tn-original-link" disabled={busy || !email}
            onClick={() => run(async () => { await sendPasswordResetEmail(auth, email); setNotice("If an account exists, check your email for a reset link."); })}>Forgot password?</button>}
        </div>
        <input id="tn-login-password" placeholder={signup ? "At least 8 characters" : "Enter your password"} type="password" minLength={signup ? 8 : 1}
          required value={password} onChange={e => setPassword(e.target.value)}
          autoComplete={signup ? "new-password" : "current-password"}/>
        <div className="tn-original-actions">
          <button className="tn-original-submit" disabled={busy}>{busy ? "Please wait…" : signup ? "Register" : "Login"}<Icon name="arrow" size={17}/></button>
        </div>
      </form>
      {notice && <p className="tn-original-notice" role="status">{notice}</p>}
      <div className="tn-original-divider"><span>or continue with</span></div>
      <button className="tn-original-google" disabled={busy}
        onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.25c1.9-1.75 2.97-4.33 2.97-7.36Z"/>
          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.25-2.51c-.9.6-2.04.96-3.37.96-2.6 0-4.8-1.75-5.59-4.1H3.06v2.6A10 10 0 0 0 12 22Z"/>
          <path fill="#FBBC05" d="M6.41 13.93a6 6 0 0 1 0-3.86v-2.6H3.06a10 10 0 0 0 0 9.06l3.35-2.6Z"/>
          <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.47l3.35 2.6A6 6 0 0 1 12 5.97Z"/>
        </svg>
        Sign in with Google
      </button>
      <button className="tn-original-preview" onClick={onDemo}>Explore the interactive preview<Icon name="arrow" size={14}/></button>
      <small>Messages are stored in Firebase. Calls use WebRTC and are not recorded by this app.</small>
    </div></section>
  </main>;
}

function Profile({ user, current, onSaved }) {
  const [name, setName] = useState(current?.displayName || user.displayName || "");
  const [discoverable, setDiscoverable] = useState(current?.discoverable || false);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <div className="tn-profile-backdrop"><form className="tn-profile" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError("");
    try { onSaved(await api("/me", { method: "PUT", body: JSON.stringify({ displayName: name, discoverable }) })); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }}><Icon name="chat" size={30}/><h2>Your TalkNest profile</h2><p>Choose how people find you.</p>
    <label>Display name<input required maxLength={70} value={name} onChange={e => setName(e.target.value)}/></label>
    <label className="tn-checkbox"><input type="checkbox" checked={discoverable} onChange={e => setDiscoverable(e.target.checked)}/>Let signed-in users find my name and start a conversation.</label>
    <small>Your email is never shown in the directory.</small>
    {error && <p role="alert">{error}</p>}<button className="tn-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    {current && <button type="button" className="tn-text-button" onClick={() => onSaved(current)}>Cancel</button>}
  </form></div>;
}

export default function Workspace() {
  const [user, setUser] = useState(null), [authLoading, setAuthLoading] = useState(configured);
  const [demo, setDemo] = useState(!configured || new URLSearchParams(window.location.search).has("demo"));
  const [profile, setProfile] = useState(null), [editProfile, setEditProfile] = useState(false);
  const [chats, setChats] = useState([]), [selected, setSelected] = useState(null), [messages, setMessages] = useState([]);
  const [demoMessages, setDemoMessages] = useState(initialMessages);
  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get("connect") || "");
  const [people, setPeople] = useState([]), [discover, setDiscover] = useState(Boolean(query));
  const [draft, setDraft] = useState(""), [sending, setSending] = useState(false), [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState(""), [loading, setLoading] = useState(false), [status, setStatus] = useState("Connecting");
  const [socket, setSocket] = useState(null), [mobileChat, setMobileChat] = useState(false);
  const selectedRef = useRef(null), bottom = useRef();
  const call = useCall(socket, demo);
  const me = demo ? demoUser : profile || user;
  const chatList = demo ? demoChats : chats;
  const shownMessages = demo ? demoMessages[selected?.id] || [] : messages;
  useEffect(() => { if (!auth) return; return onAuthStateChanged(auth, value => { setUser(value); setAuthLoading(false); }); }, []);
  useEffect(() => {
    if (demo) { setSelected(demoChats[0]); return; }
    setSelected(null); setProfile(null); setChats([]); setMessages([]);
    if (!user) return;
    let active = true;
    setLoading(true);
    Promise.all([api("/me"), api("/chats")]).then(([p, c]) => {
      if (!active) return; setProfile(p); setEditProfile(!p); setChats(c);
    }).catch(e => active && setError(e.message)).finally(() => active && setLoading(false));
    const connection = io(apiBase, { auth: async done => { try { done({ token: await user.getIdToken() }); } catch { done({}); } },
      reconnectionDelay: 1000, reconnectionDelayMax: 10000 });
    setSocket(connection);
    connection.on("connect", () => {
      setStatus("Connected");
      api("/chats").then(c => active && setChats(c)).catch(() => {});
      const id = selectedRef.current?.id;
      if (id) api(`/chats/${id}/messages`).then(m => {
        if (active && selectedRef.current?.id === id) setMessages(m);
      }).catch(() => {});
    });
    connection.on("disconnect", reason => {
      setStatus("Reconnecting");
      if (reason === "io server disconnect") user.getIdToken(true).then(() => active && connection.connect()).catch(() => active && setError("Please sign in again."));
    });
    connection.on("connect_error", () => setStatus("Reconnecting"));
    connection.on("message", ({ chatId, message }) => {
      if (selectedRef.current?.id === chatId) setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
      api("/chats").then(c => active && setChats(c)).catch(() => {});
    });
    return () => { active = false; connection.removeAllListeners(); connection.disconnect(); setSocket(null); };
  }, [user, demo]);
  useEffect(() => {
    selectedRef.current = selected; setDraft(""); setPendingId(null); setError("");
    if (demo || !selected) return;
    let active = true; setLoading(true); setMessages([]);
    api(`/chats/${selected.id}/messages`).then(result => active && setMessages(result))
      .catch(e => active && setError(e.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selected, demo]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [shownMessages.length, selected?.id]);
  useEffect(() => {
    if (demo || !user || !discover || query.trim().length < 2) { setPeople([]); return; }
    let active = true;
    const timer = setTimeout(() => api(`/people?q=${encodeURIComponent(query)}`).then(p => active && setPeople(p)).catch(e => active && setError(e.message)), 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, user, demo, discover]);
  async function startChat(person) {
    try {
      const c = await api("/chats", { method: "POST", body: JSON.stringify({ peerUid: person.uid }) });
      setChats(await api("/chats")); setSelected(c); setQuery(""); setDiscover(false); setMobileChat(true);
    } catch (e) { setError(e.message); }
  }
  async function send(e) {
    e.preventDefault(); const text = draft.trim(); if (!text || !selected || sending) return;
    const chatId = selected.id, id = pendingId || crypto.randomUUID();
    setPendingId(id); setSending(true); setError("");
    try {
      if (demo) setDemoMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), { id, text, senderId: demoUser.uid, createdAt: Date.now() }] }));
      else {
        const message = await api(`/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify({ id, text }) });
        if (selectedRef.current?.id === chatId) setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
      }
      if (selectedRef.current?.id === chatId || demo) { setDraft(""); setPendingId(null); }
    } catch (e) { setError(e.message + " Your draft is still here."); } finally { setSending(false); }
  }
  if (authLoading) return <main className="tn-loading">Opening TalkNest…</main>;
  if (!demo && !user) return <SignIn onDemo={() => setDemo(true)}/>;
  return <div className="tn-app">
    <header className="tn-topbar"><a className="tn-brand" href="/"><span className="tn-brand-icon"><Icon name="chat" size={25}/></span>TalkNest<span className="tn-beta">BETA</span></a>
      <span className="tn-top-note">A little closer, wherever you are.</span>
      <div className="tn-top-actions"><span className={`tn-connection ${!demo && status !== "Connected" ? "waiting" : ""}`}><i/>{demo ? "Interactive preview" : status}</span>
        {demo ? configured && <button className="tn-text-button" onClick={() => setDemo(false)}>Sign in <Icon name="arrow"/></button> :
          <button className="tn-circle" title="Sign out" aria-label="Sign out" onClick={() => signOut(auth)}><Icon name="logout"/></button>}
      </div>
    </header>
    {demo && <div className="tn-preview-banner">PREVIEW MODE <span>Sample conversations only. Messages stay in this tab; calls do not access your camera or microphone.</span></div>}
    <div className={`tn-shell ${mobileChat ? "show-chat" : ""}`}><aside className="tn-sidebar">
      <div className="tn-sidebar-title"><div><span className="tn-eyebrow">YOUR PEOPLE</span><h1>Messages<span>{chatList.length}</span></h1></div>
        {!demo && <button className="tn-circle" aria-label={discover ? "Show conversations" : "Find people"} onClick={() => { setDiscover(!discover); setQuery(""); }}><Icon name={discover ? "chat" : "search"}/></button>}
      </div>
      <label className="tn-search"><Icon name="search" size={18}/><input aria-label={discover ? "Find people by name" : "Search conversations"} placeholder={discover ? "Find people by name…" : "Search conversations…"} value={query} onChange={e => setQuery(e.target.value)}/></label>
      <div className="tn-list-label">{discover && !demo ? "START A CONVERSATION" : "ALL CONVERSATIONS"}</div>
      <div className="tn-conversations">{discover && !demo ? <>
        <p className="tn-helper">Search at least two letters. Only people who opted into the directory appear.</p>
        {people.map(p => <button className="tn-conversation" key={p.uid} onClick={() => startChat(p)}><Avatar person={p}/><span><strong>{p.displayName}</strong><small>Start a conversation</small></span><Icon name="arrow" size={16}/></button>)}
        {query.length >= 2 && !people.length && <p className="tn-helper">No matching people yet.</p>}
      </> : chatList.filter(c => c.peer?.displayName?.toLowerCase().includes(query.toLowerCase())).map(c =>
        <button key={c.id} className={`tn-conversation ${selected?.id === c.id ? "selected" : ""}`} onClick={() => { setSelected(c); setMobileChat(true); }}>
          <Avatar person={c.peer}/><span><strong>{c.peer?.displayName || "Conversation"}</strong><small>{c.lastMessage || "Say hello"}</small></span>
          {selected?.id === c.id && <span className="tn-selected-dot"/>}
        </button>)}
        {!loading && !chatList.length && !discover && <p className="tn-helper">Your conversations will appear here. Use Find people to say hello.</p>}
      </div>
      <div className="tn-sidebar-bottom"><div className="tn-mini-tip"><Icon name="video"/><div><strong>More than a message.</strong><p>Sometimes a quick call says it better.</p></div></div>
        <button className="tn-me" disabled={demo} onClick={() => setEditProfile(true)}><Avatar person={me}/><span><strong>{me?.displayName || "Your profile"}</strong><small>{demo ? "Demo profile" : "Manage your profile"}</small></span><Icon name="arrow" size={16}/></button>
      </div>
    </aside><main className="tn-main">{selected ? <>
      <header className="tn-chat-header"><button className="tn-circle tn-mobile-back" aria-label="Back to conversations" onClick={() => setMobileChat(false)}><Icon name="back"/></button>
        <Avatar person={selected.peer}/><div className="tn-chat-person"><h2>{selected.peer?.displayName}</h2><span>{demo ? "Sample conversation" : "Private conversation"}</span></div>
        <div className="tn-header-actions"><button className="tn-circle" aria-label="Start voice call" title="Voice call" disabled={Boolean(call.call)} onClick={() => call.start(selected.peer, "audio")}><Icon name="phone"/></button>
          <button className="tn-video-button" aria-label="Start video call" disabled={Boolean(call.call)} onClick={() => call.start(selected.peer, "video")}><Icon name="video"/><span>Video call</span></button></div>
      </header>
      {(error || call.error) && <div className="tn-error" role="alert"><span>{error || call.error}</span><button aria-label="Dismiss notice" onClick={() => { setError(""); call.setError(""); }}><Icon name="close" size={16}/></button></div>}
      <div className="tn-message-scroll" role="log" aria-label="Conversation messages">
        <div className="tn-conversation-start"><Avatar person={selected.peer} large/><h3>You and {selected.peer?.displayName?.split(" ")[0]}</h3><p>{demo ? "This is a preview of your new conversation space." : "A little space to share ideas, catch up, and connect."}</p></div>
        {loading && !demo && <p className="tn-helper">Loading messages… Free hosting may take a moment to wake up.</p>}
        {shownMessages.map((m, i) => <React.Fragment key={m.id}>
          {(i === 0 || new Date(shownMessages[i - 1].createdAt).toDateString() !== new Date(m.createdAt).toDateString()) && <div className="tn-date"><span>{demo && m.id.startsWith("m") ? "SAMPLE CONVERSATION" : new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>}
          <div className={`tn-message ${m.senderId === me?.uid ? "outgoing" : ""}`}><div className="tn-bubble">{m.text}</div><small>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{m.senderId === me?.uid && <><Icon name="check" size={12}/><span>{demo ? "Preview" : "Sent"}</span></>}</small></div>
        </React.Fragment>)}<div ref={bottom}/>
      </div>
      <form className="tn-composer" onSubmit={send}><div className="tn-compose-box"><textarea aria-label="Message" maxLength={4000} rows={1} placeholder={`Message ${selected.peer?.displayName?.split(" ")[0]}…`} value={draft}
        onChange={e => { setDraft(e.target.value); setPendingId(null); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(e); } }}/>
        <button aria-label="Send message" disabled={!draft.trim() || sending}><Icon name="send"/></button></div><div className="tn-composer-note"><span>{sending ? "Sending…" : "Enter to send · Shift + Enter for a new line"}</span><span>{draft.length}/4000</span></div></form>
    </> : <section className="tn-empty"><span className="tn-brand-icon"><Icon name="chat" size={36}/></span><span className="tn-eyebrow">MAKE ROOM FOR CONNECTION</span><h2>Start with a hello.</h2><p>Choose a conversation or find someone new.<br/>Your next good conversation is one message away.</p>
      <button className="tn-primary" onClick={() => setDiscover(true)}>Find people <Icon name="arrow"/></button>{error && <p role="alert">{error}</p>}</section>}
    </main></div><div className="tn-page-foot"><span>Built for conversations, not distractions.</span><a href="https://github.com/TalkNest" target="_blank" rel="noreferrer">Open-source project <Icon name="arrow" size={13}/></a></div>
    {editProfile && !demo && user && <Profile user={user} current={profile} onSaved={p => { setProfile(p); setEditProfile(false); }}/>}
    <CallPanel session={call}/>
  </div>;
}
