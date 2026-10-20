import { useEffect, useRef, useState } from "react";

// Media is acquired only after an explicit Call/Accept action.
export default function useCall(socket, demo) {
  const [call, setCall] = useState(null), [error, setError] = useState("");
  const [local, setLocal] = useState(null), [remote, setRemote] = useState(null);
  const [muted, setMuted] = useState(false), [cameraOff, setCameraOff] = useState(false);
  const current = useRef(null), pc = useRef(null), stream = useRef(null), candidates = useRef([]);
  const generation = useRef(0);
  function update(value) { current.current = value; setCall(value); }
  function cleanup() {
    generation.current++;
    if (pc.current) { pc.current.onconnectionstatechange = null; pc.current.close(); pc.current = null; }
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null; candidates.current = [];
    setLocal(null); setRemote(null); setMuted(false); setCameraOff(false); update(null);
  }
  function end() {
    if (current.current?.id && !demo) socket?.emit("call:end", { id: current.current.id });
    cleanup();
  }
  async function acquire(mode) {
    const version = generation.current;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Calling requires HTTPS and microphone access.");
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
    if (version !== generation.current) { media.getTracks().forEach(t => t.stop()); return null; }
    stream.current = media; setLocal(media); return media;
  }
  function connect(media) {
    let iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
    // Optional short-lived TURN credentials should be provided by a TURN broker
    // in production; never put a permanent TURN password in a frontend build.
    const peer = new RTCPeerConnection({ iceServers });
    pc.current = peer;
    media.getTracks().forEach(track => peer.addTrack(track, media));
    peer.ontrack = event => setRemote(event.streams[0]);
    peer.onicecandidate = event => {
      if (event.candidate && current.current?.id) socket.emit("call:signal", { id: current.current.id, signal: { candidate: event.candidate } });
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected" && current.current) {
        update({ ...current.current, status: "connected", startedAt: Date.now() });
        socket.emit("call:connected", { id: current.current.id });
      } else if (["failed", "disconnected"].includes(peer.connectionState)) {
        setError("The call disconnected. Some networks need a TURN relay; try another network."); end();
      }
    };
    return peer;
  }
  async function start(person, mode) {
    if (current.current) return;
    setError("");
    if (demo) { update({ id: "preview", person, mode, status: "preview", startedAt: Date.now() }); return; }
    if (!socket?.connected) { setError("Messaging is reconnecting. Please try again in a moment."); return; }
    update({ person, mode, status: "permission" });
    try {
      const media = await acquire(mode);
      if (!media) return;
      connect(media);
      socket.timeout(10000).emit("call:start", { to: person.uid, mode }, (err, result) => {
        if (!current.current) { if (result?.id) socket.emit("call:end", { id: result.id }); return; }
        if (err || result?.error) { setError(result?.error || "Couldn't reach the calling service."); cleanup(); return; }
        update({ person, mode, id: result.id, status: "ringing" });
      });
    } catch (e) { setError(e.name === "NotAllowedError" ? "Microphone/camera permission was denied. You can still send messages." : e.message); end(); }
  }
  async function accept() {
    const incoming = current.current; if (!incoming || incoming.status !== "incoming") return;
    update({ ...incoming, status: "permission" });
    try {
      const media = await acquire(incoming.mode); if (!media) return;
      connect(media); update({ ...incoming, status: "connecting" });
      socket.emit("call:accept", { id: incoming.id });
    } catch (e) { setError("Could not access your microphone/camera. Check browser permissions."); end(); }
  }
  useEffect(() => {
    if (!socket) return;
    const incoming = data => {
      if (current.current) return;
      setError(""); update({ id: data.id, person: data.from, mode: data.mode, status: "incoming" });
    };
    const accepted = async ({ id }) => {
      if (current.current?.id !== id || !pc.current) return;
      try {
        update({ ...current.current, status: "connecting" });
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit("call:signal", { id, signal: { description: offer } });
      } catch { setError("Call setup failed."); end(); }
    };
    let signalQueue = Promise.resolve();
    const signal = data => {
      signalQueue = signalQueue.then(async () => {
        if (current.current?.id !== data.id || !pc.current) return;
        const peer = pc.current;
        if (data.signal.description) {
          await peer.setRemoteDescription(data.signal.description);
          for (const candidate of candidates.current.splice(0)) await peer.addIceCandidate(candidate);
          if (data.signal.description.type === "offer") {
            const answer = await peer.createAnswer(); await peer.setLocalDescription(answer);
            socket.emit("call:signal", { id: data.id, signal: { description: answer } });
          }
        } else if (data.signal.candidate) {
          if (peer.remoteDescription) await peer.addIceCandidate(data.signal.candidate);
          else candidates.current.push(data.signal.candidate);
        }
      }).catch(() => { setError("Could not establish the call."); end(); });
    };
    const ended = ({ id, reason }) => {
      if (current.current?.id === id) { if (reason !== "Call ended") setError(reason); cleanup(); }
    };
    const handled = ({ id }) => { if (current.current?.id === id) cleanup(); };
    const disconnected = () => { if (current.current) { setError("Connection lost. Please call again."); cleanup(); } };
    socket.on("call:incoming", incoming); socket.on("call:accepted", accepted);
    socket.on("call:signal", signal); socket.on("call:ended", ended);
    socket.on("call:handled", handled); socket.on("disconnect", disconnected);
    return () => {
      socket.off("call:incoming", incoming); socket.off("call:accepted", accepted);
      socket.off("call:signal", signal); socket.off("call:ended", ended);
      socket.off("call:handled", handled); socket.off("disconnect", disconnected);
      if (current.current?.id) socket.emit("call:end", { id: current.current.id });
      cleanup();
    };
    // The socket is the session boundary. Mutable call state lives in refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);
  const toggleMute = () => { stream.current?.getAudioTracks().forEach(t => { t.enabled = muted; }); setMuted(!muted); };
  const toggleCamera = () => { stream.current?.getVideoTracks().forEach(t => { t.enabled = cameraOff; }); setCameraOff(!cameraOff); };
  return { call, error, setError, local, remote, muted, cameraOff, start, accept, end, toggleMute, toggleCamera };
}
