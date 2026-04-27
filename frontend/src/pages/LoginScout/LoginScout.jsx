import React, { useState, useEffect } from 'react';  //useState keep track of user input
import axios from 'axios';  //carries data to the server
import "./LoginScout.css";
import {useNavigate} from "react-router-dom";
import { useTranslation } from "react-i18next";

function LoginScout() {
    //Keeping track of user input [variable, function]
    //all initialized as empty strings
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');  //error to be shown to the user through interface (e.g.wrong password)

    const navigate = useNavigate();
    const { t } = useTranslation();

    // Logging the user out if they hit back arrow right after logging in
    // Ensures each user logs in using their credentials and does not use somebody else's account by accident
    useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        // If they land on login page while a session is active, delete it
        localStorage.removeItem('user');
        console.log("Shared Device Security: Session cleared.");
    }
}, []);  // no navigating away, just the log in page for the next person to log in


    const handleLogin = async (e) => {  //waiting for the server
    e.preventDefault();  //prevents page refresh
    setError('');       //resets error message from any previous attempts

        try {
            //Sending the request to the backend
            const response = await axios.post('http://localhost:5000/api/login', {  //sends POST request for sensitive data
                username: username,
                password: password,
                role: 'scout'
            });

            // if successful
            if (response.data && response.data.user) {
                const user = response.data.user;

                // Saving the user first
                localStorage.setItem('user', JSON.stringify(user));

                // Deciding where to send them based on the flag
                if (user.mustChangePassword) {  // if they are using a One Time Password
                    navigate("/force_password_change", { replace: true });
                } else {  // if they are normally logging in
                    navigate("/scout_home");
                }
            }
          // if error
        }  catch (err) {
            console.error("Login failed:", err.response?.data);
            setError(err.response?.data?.message || t("LoginScout.InvalidCredentials"));
        }
    };

    return (
        <div className="scout-login-container">
            <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
            <h1>{t("LoginScout.Title")}</h1>

            {/* Shows red error message if login fails */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            {/*Login triggers when Enter or the Login button are pressed*/}
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label>{t("LoginScout.Username")}</label>
                    <input
                        type="text"
                        value={username}
                        /*Updates the username character by character*/
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>{t("LoginScout.Password")}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/*Button working as well when Enter clicked (type="submit")*/}
                <button type="submit" className="login-submit">{t("LoginScout.LoginButton")}</button>
            </form>

            <a href="#" className="forgot-password">{t("LoginScout.ForgotPassword")}</a>

            {/* This button uses navigate to return the previous page */}
            <button
                className="back-btn"
                onClick={(e) => {
                    e.preventDefault(); // Stops the '#' from being added to the URL
                    navigate('/');      // sends back to the first page
                }}
                >
                {t("LoginScout.Back")}
            </button>
        </div>
    );
}

export default LoginScout;