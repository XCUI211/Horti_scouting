import React, { useState } from 'react';  //useState keep track of user input
import axios from 'axios';  //carries data to the server
import "./LoginScout.css";
import {useNavigate} from "react-router-dom";

function LoginScout() {
    //Keeping track of user input [variable, function]
    //all initialized as empty strings
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');  //error to be shown to the user through interface (e.g.wrong password)

    //  use navigate (for back button) to redirect button back to routed main page
    const navigate = useNavigate();

    const handleLogin = async (e) => {  //waiting for the server
    e.preventDefault();  //prevents page refresh
    setError('');       //resets error message from any previous attempts

        try {
            //Sending the request to the backend
            const response = await axios.post('http://localhost:5000/api/login', {  //sends POST request for sensitive data
                username: username,
                password: password
            });

            // if successful
            console.log("Success:", response.data);
            alert(`Welcome, ${response.data.user.username}!`);

          // if error
        }  catch (err) {
            console.error("Login failed:", err.response?.data);
            setError(err.response?.data?.message || "Invalid credentials");
        }
    };

    return (
        <div className="scout-container">
            <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
            <h1>Log in as a Scout</h1>

            {/* Shows red error message if login fails */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            {/*Login triggers when Enter or the Login button are pressed*/}
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        /*Updates the username character by character*/
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/*Button working as well when Enter clicked (type="submit")*/}
                <button type="submit" className="login-submit">Log in</button>
            </form>

            <a href="#" className="forgot-password">I forgot my password</a>

            {/* This button uses navigate to return the previous page */}
            <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
}

export default LoginScout;