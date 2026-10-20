import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icons";
function Media({ stream, muted, className, label }) {
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} aria-label={label}/>;
}
export default function CallPanel({ session }) {
  const { call, local, remote, muted, cameraOff, end, accept, toggleMute, toggleCamera } = session;
  const [elapsed, setElapsed] = useState(0);
  const closeRef = useRef();
  useEffect(() => {
    if (!call) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, [call?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setElapsed(0);
    if (!call?.startedAt) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - call.startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [call?.startedAt]);
  if (!call) return null;
  const labels = { incoming: "Incoming call", permission: "Waiting for device permission…",
    ringing: "Ringing…", connecting: "Connecting…", connected: "Connected", preview: "Call interface preview · no live connection" };
  function trapKeys(event) {
    if (event.key === "Escape") end();
    if (event.key === "Tab") {
      const buttons = [...event.currentTarget.querySelectorAll("button:not([disabled])")];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  return <div className="tn-call-backdrop"><section className="tn-call" role="dialog" aria-modal="true" aria-labelledby="call-name" onKeyDown={trapKeys}>
    <header><span className="tn-call-brand"><Icon name="chat"/> TalkNest</span><button ref={closeRef} className="tn-circle" aria-label="End call and close" onClick={end}><Icon name="close"/></button></header>
    <div className="tn-call-stage">
      {remote && call.mode === "video" ? <Media stream={remote} label="Remote video" className="tn-remote"/> :
        <div className="tn-call-person"><div className="tn-orbit"><span>{call.person?.displayName?.[0] || "T"}</span></div><h2 id="call-name">{call.person?.displayName || "TalkNest caller"}</h2><p aria-live="polite">{labels[call.status]}</p></div>}
      {remote && call.mode === "audio" && <Media stream={remote} label="Remote audio" className="tn-audio"/>}
      {call.mode === "video" && <div className="tn-self">
        {local && !cameraOff ? <Media stream={local} muted label="Your camera" className="tn-local"/> : <span>{call.status === "preview" ? "Camera preview" : "Camera off"}</span>}
        <small>You{muted ? " · muted" : ""}</small>
      </div>}
    </div>
    <footer><div className="tn-call-detail"><span>{call.mode === "video" ? "Video" : "Voice"} call</span><strong>{call.status === "connected" ? `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}` : labels[call.status]}</strong></div>
      <div className="tn-call-actions">{call.status === "incoming" ? <>
        <button className="tn-call-action tn-accept" onClick={accept}><Icon name="phone"/>Accept</button>
        <button className="tn-call-action tn-end" onClick={end}><Icon name="close"/>Decline</button>
      </> : <>
        <button className={`tn-call-action ${muted ? "active" : ""}`} onClick={toggleMute} aria-pressed={muted}><Icon name="mic"/>{muted ? "Unmute" : "Mute"}</button>
        {call.mode === "video" && <button className={`tn-call-action ${cameraOff ? "active" : ""}`} onClick={toggleCamera} aria-pressed={cameraOff}><Icon name="video"/>{cameraOff ? "Camera on" : "Camera off"}</button>}
        <button className="tn-call-action tn-end" onClick={end}><Icon name="phone"/>End call</button>
      </>}</div>
      <p className="tn-call-note">{call.status === "preview" ? "Preview only. Your microphone and camera are not being accessed." : "Media is not recorded by TalkNest. Your browser controls device access."}</p>
    </footer>
  </section></div>;
}
