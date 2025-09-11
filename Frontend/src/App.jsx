import './App.css';
import io from 'socket.io-client';
import { useState } from 'react';

const socket = io('http://localhost:5000');
const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  
  if(!joined) {
    return <div className='join-container'>
      <div className="join-form">
        <h1>Join Code Room</h1>
        <input type="text" placeholder='Room ID' id='roomId' value={roomId} onChange={(e) => setRoomId(e.target.value)} />
        <input type="text" placeholder='Username' id='username' value={username} onChange={(e) => setUsername(e.target.value)} />
        <button onClick={() => {
          socket.emit("join", { roomId, username });
          setJoined(true);
        }}>Join Room</button>
      </div>
    </div>
  }

  return (
    <div>
      <h1>Welcome to the Real-Time Code Editor</h1>
    </div>
  )
}

export default App