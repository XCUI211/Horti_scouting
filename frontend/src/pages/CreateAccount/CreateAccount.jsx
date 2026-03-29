import React, { useState } from 'react';  //useState keep track of user input
import axios from 'axios';  //carries data to the server
import "./CreateAccount.css";

function CreateAccount({ onBack }) {
    //Keeping track of user input [variable, function]
    //all initialized as empty strings
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');  //error to be shown to the user through interface (e.g.wrong password)

    const handleCreateAccount  = async (e) => {  //waiting for the server
    e.preventDefault();  //prevents page refresh
    setError('');       //resets error message from any previous attempts

        try {
            //Sending the request to the backend
            const response = await axios.post('http://localhost:5000/api/createaccount', {  //sends POST request for sensitive data
                username: username,
                email: email,
                password: password,
            });

            // if successful
            console.log("Account created:", response.data);
            alert(`Account creation succesfull! Please log in with your new credentials.`);
            onBack();

          // if error
        }  catch (err) {
            console.error("Login failed:", err.response?.data);
            setError(err.response?.data?.message || "Invalid credentials");
        }
    };

    return (
        <div className="scout-container">
            <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
            <h1>Create Scout Account</h1>

            {/* Shows red error message if login fails */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            {/*Login triggers when Enter or the Login button are pressed*/}
            <form onSubmit={handleCreateAccount}>
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
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                <button type="submit" className="login-submit">Create Account</button>
            </form>

            {/* This button uses the onBack function from App.js */}
            <button className="back-btn" onClick={onBack}>Back</button>
        </div>
    );
}

export default CreateAccount;