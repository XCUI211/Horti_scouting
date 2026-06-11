import React, { useState, useEffect } from 'react';  //useState keep track of user input
import axios from 'axios';  //carries data to the server
import "./LoginAdmin.css";
import {useNavigate} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

function LoginAdmin() {

    //Keeping track of user input [variable, function]
    //all initialized as empty strings
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');  //error to be shown to the user through interface (e.g.wrong password)

    //  use navigate (for back button) to redirect button back to routed main page
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { setUser, logout } = useAuth();  // Uses AuthContext for setting the user and logging out


    // Logging the user out if they hit back arrow right after logging in
    // Ensures each user logs in using their credentials and does not use somebody else's account by accident
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            logout();
            console.log("Shared Device Security: Session cleared.");
        }
    }, [logout]);

    const handleLogin = async (e) => {  //waiting for the server
    e.preventDefault();  //prevents page refresh
    setError('');       //resets error message from any previous attempts

        try {
            //Sending the request to the backend
            const response = await axios.post('http://localhost:5000/api/login', {  //sends POST request for sensitive data
                username: username,
                password: password,
                role: 'admin'
            });

            // if successful
            // alert(`Welcome, ${response.data.user.username}!`);
            if (response.data) {
                const user = response.data.user;

                // Saving the userID via AuthContext (which automatically links to localStorage)
                setUser(user);
                i18n.changeLanguage(user.language || "nl");
                console.log("Success:", response.data);

                // Storing user info in localStorage for other pages
                console.log("Data saved to localStorage:", response.data.user);
                navigate("/admin_home");
            }
          // if error
        }  catch (err) {
            console.error("Login failed:", err.response?.data);
            setError(err.response?.data?.message || t("LoginAdmin.InvalidCredentials"));
        }
    };

    return (
        <div className="admin-login-container">
            <img src="/logo.png" alt="Vireo logo" className="admin-logo" />
            <h1>{t("LoginAdmin.Title")}</h1>

            {/* Shows red error message if login fails */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            {/*Login triggers when Enter or the Login button are pressed*/}
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label>{t("LoginAdmin.Username")}</label>
                    <input
                        type="text"
                        value={username}
                        /*Updates the username character by character*/
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>{t("LoginAdmin.Password")}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/*Button working as well when Enter clicked (type="submit")*/}
                <button type="submit" className="login-submit">{t("LoginAdmin.LoginButton")}</button>
            </form>


            {/* This button uses navigate to return the previous page */}
            <button
                className="back-btn"
                onClick={(e) => {
                    e.preventDefault(); // Stops the '#' from being added to the URL
                    navigate('/');      // sends back to the first page
                }}
            >
                {t("LoginAdmin.Back")}
            </button>
        </div>
    );
}

export default LoginAdmin;