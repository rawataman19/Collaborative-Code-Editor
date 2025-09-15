import './App.css';
import io from 'socket.io-client';
import {  useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

const socket = io('http://localhost:5000');
const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('cpp'); 
  const [code, setCode] = useState("// start coding");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState(false);

  const [copySuccess, setCopySuccess] = useState('');

useEffect(() => {
  socket.on('userJoined', (users) => {
    setUsers(users);
  });

  socket.on("codeUpdate", ({ code }) => {
    setCode(code);
  });

  socket.on("userTyping", ({ user }) => {
    setTyping(`${user.slice(0,8)}... is typing`);
    setTimeout(() => {
      setTyping("");
    }, 2000);
  });
  socket.on("languageUpdate", ({ language }) => {
    setLanguage(language);
  });

  return () => {
    socket.off('userJoined');
    socket.off("codeUpdate");
    socket.off("userTyping");
    socket.off("languageUpdate");
  };
}, []);


  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {  
     if(roomId && username) {
      socket.emit('join', { roomId, username });
      setJoined(true);
     } else {
      alert("Room ID and Username are required");
     }
  }

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId('');
    setUsername('');
    setUsers([]);
    setCode('//start coding...');
    setLanguage('cpp');
  }

  const copyRoomId = async () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess('Copied!');
    setTimeout(() => {
      setCopySuccess('');
    }, 2000);
  }

  const handleChangeCode = (newcode) => {
    setCode(newcode);
    socket.emit("codeChange",{roomId,code:newcode});
    socket.emit("typing", { roomId, username });
  }

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  
  if(!joined) {
    return <div className='join-container'>
      <div className="join-form">
        <h1>Join Code Room</h1>
        <input type="text" placeholder='Room ID' id='roomId' value={roomId} onChange={(e) => setRoomId(e.target.value)} />
        <input type="text" placeholder='Username' id='username' value={username} onChange={(e) => setUsername(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  }

return (
  <div className="editor-container">
    <div className="sidebar">
      <div className="room-info">
        <h2>Room ID: {roomId}</h2>
        <button className="copy-btn" onClick={copyRoomId}>Copy Id
          

        </button>
        {copySuccess && <span className="copy-success">{copySuccess}</span>}
      </div>

      <h3>Connected Users</h3>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.slice(0, 10)}...</li>
        ))}
      </ul>

      <p className="typing-indicator">{typing}</p>

      <select id="language" className="language-selector" value={language}
        onChange={handleLanguageChange}>
        <option value="cpp">C++</option>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>

      <button className="leave-button" onClick={leaveRoom}>Leave Room</button>
    </div>

    <div className="editor-wrapper">
      <Editor
        height="100vh"
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={handleChangeCode}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 16,
        }}
      />
    </div>
  </div>
);

}

export default App