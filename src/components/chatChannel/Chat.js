import React, {useContext, useEffect, useRef, useState} from "react";
import Input from "./Input";
import {ChatContext} from "../../auth/ChatContext";
import Messages from "./Messages";
import {VideoCameraOutlined, UserAddOutlined, EllipsisOutlined} from "@ant-design/icons";
import ChatButton from "./ChatButton";
import io from 'socket.io-client';
import Peer from 'simple-peer';
import {getVideoStream} from "./mediaHelpers";
import {AuthContext} from "../../auth/AuthContext";

const Chat = () => {
  const { data } = useContext(ChatContext);
  const [stream, setStream] = useState();
  const [userStream, setUserStream] = useState();
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const {currentUser} = useContext(AuthContext);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io(`${process.env.REACT_APP_API_BASE_URL}`);

    // Emit a registration event with the user's ID
    if (currentUser && currentUser.uid) {
      socket.current.emit('register', { userId: currentUser.uid });
    }

    socket.current.on('callAccepted', (signal) => {
      setCallAccepted(true);
      // Signal the peer connection that the call has been accepted
      connectionRef.current.signal(signal);

    });

    socket.current.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    // Listen for the 'hangUp' event from the server to handle when the other user hangs up the call
    socket.current.on('hangUp', () => {
      window.location.reload();
    });

  }, []);

  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (userStream && userVideo.current) {
      userVideo.current.srcObject = userStream;
    }
  }, [userStream]);

  const answerCall = () => {
    getVideoStream().then(stream => {
      setStream(stream); // Update the local state with the new stream
      setCallAccepted(true);

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream, // Use the updated stream here
      });

      peer.on('signal', data => {
        socket.current.emit('answerCall', { signal: data, to: call.from });
      });

      peer.on('stream', currentStream => {
        setUserStream(currentStream); // Update userStream instead of setting it directly to userVideo
      });

      peer.signal(call.signal);
      connectionRef.current = peer;
    });
  };


  const callUser = (id) => {
    getVideoStream().then(stream => {
      setStream(stream);

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on('signal', data => {
        socket.current.emit('callUser', { userToCall: id, signalData: data, from: currentUser.uid });
      });

      // Do not set userVideo.srcObject here for the caller
      peer.on('stream', currentStream => {
        setUserStream(currentStream); // Set the remote stream received from the peer
      });

      connectionRef.current = peer;
    }).catch(err => console.log('Error getting user media:', err));
  };


  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();

    // Check if there's an ongoing call and if we have the ID of the other participant
    if (call.from) {
      // Emit 'hangUp' event to the server, signaling that the call has ended
      socket.current.emit('hangUp', { to: call.from });
    }

    window.location.reload();
  };

  return (
    <div className="chat">
      <div className="chatInfo">
        <span>{data.user?.displayName}</span>
        <div className="chatIcons">
          <ChatButton icon={<VideoCameraOutlined style={{marginLeft: '5px'}}/>}
                      onClick={() => {
                        if (data.user?.uid) {
                          callUser(data.user.uid);
                        } else {
                          // Handle the case where data.user?.uid is null or empty
                          console.log("User ID is missing");
                        }
                      }}
                      style={{
                        width: '40px',
                        height: '45px',
                        borderRadius: '10px',
                        display: 'flex',
                        lineHeight: '10px',
                        textAlign: 'center',

                        background: 'linear-gradient(45deg, #7B90D2, #00AA90)',
                        boxShadow: '0px 3px 9px #7B90D2'
                      }}/>
          <ChatButton icon={<UserAddOutlined style={{marginLeft: '5px'}}/>}
            // onClick={handleSend}
                      style={{
                        width: '40px',
                        height: '45px',
                        borderRadius: '10px',
                        display: 'flex',
                        lineHeight: '10px',
                        textAlign: 'center',

                        background: 'linear-gradient(45deg, #7B90D2, #00AA90)',
                        boxShadow: '0px 3px 9px #7B90D2'
                      }}/>
          <ChatButton icon={<EllipsisOutlined style={{marginLeft: '5px'}}/>}
            // onClick={handleSend}
                      style={{
                        width: '40px',
                        height: '45px',
                        borderRadius: '10px',
                        display: 'flex',
                        lineHeight: '10px',
                        textAlign: 'center',

                        background: 'linear-gradient(45deg, #7B90D2, #00AA90)',
                        boxShadow: '0px 3px 9px #7B90D2'
                      }}/>

        </div>
      </div>
      <Messages/>
      <Input/>

      <div className="videos-top-layer" style={{position: 'absolute',width: '100%', top: 0, left: 0, zIndex: 1}}>
        <div>
          {stream && <video playsInline muted ref={myVideo} autoPlay style={{
              position: "absolute",
              width: "20%",
              height:"20%",
              bottom: "10px",
              right: "10px",
              zIndex: 2
          }}/>}
          {callAccepted && !callEnded && (
            <video playsInline ref={userVideo} autoPlay style={{
                position: 'relative',
                width: "100%",
                height:"100%",
                top: 0,
                left: 0,
                zIndex: 1
            }}/>
          )}
        </div>
      </div>
      <div className="call-actions-top-layer" style={{position: 'absolute', top: '350px', left: 0, zIndex: 1}}>
        <div>
          {call.isReceivingCall && !callAccepted && (
              <ChatButton name={'Answer'}
                            onClick={answerCall}
                            style={{
                                position: 'fixed',
                                top: '20px',
                                left: '50%',
                                fontSize: '20px',
                                // transform: 'translateX(-50%)',
                                width: '120px',
                                height: '45px',
                                borderRadius: '10px',
                                lineHeight: '10px',
                                textAlign: 'center',
                                background: 'linear-gradient(45deg, #86C166, #24936E)',
                                boxShadow: '0px 3px 9px #86C166'
              }}/>
          )}
          {callAccepted &&
              <ChatButton name={'Hang Up'}
                          onClick={leaveCall}
                          style={{
                              position: 'fixed',
                              top: '20px',
                              left: '50%',
                              fontSize: '20px',
                              transform: 'translateX(-50%)',
                              width: '150px',
                              height: '45px',
                              borderRadius: '10px',
                              lineHeight: '10px',
                              textAlign: 'center',
                              background: 'linear-gradient(45deg, #E87A90, #D0104C)',
                              boxShadow: '0px 2px 5px #E87A90C'
                          }}/>
          }
        </div>
      </div>

    </div>
  );
};

export default Chat;
