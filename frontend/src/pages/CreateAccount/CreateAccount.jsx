import React, { useState } from 'react';  //useState keep track of user input
import axios from 'axios';  //carries data to the server
import "./CreateAccount.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function CreateAccount() {
    //Keeping track of user input [variable, function]
    //all initialized as empty strings
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(''); //error to be shown to the user through interface (e.g.wrong password)

    //  use navigate (for back button) to redirect button back to routed main page
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleCreateAccount = async (e) => {  //waiting for the server
        e.preventDefault();  //prevents page refresh
        setError('');       //resets error message from any previous attempts

        try {
            //Sending the request to the backend
            const response = await axios.post('http://localhost:5000/api/createaccount', {  //sends POST request for sensitive data
                username: username,
                email: email || null,  //sends null if email is empty (makes email optional for scouts)
                password: password,
                mustChangePassword: true  // makes the password only temporary (to be changed at first login by the scout)
            });

            // if successful
            console.log("Account created:", response.data);
            alert(t("CreateAccount.SuccessMessage"));
            navigate("/account_management_admin");

            // if error
        } catch (err) {
            console.error("Login failed:", err.response?.data);
            setError(err.response?.data?.message || t("CreateAccount.InvalidCredentials"));
        }
    };

    return (
        <div className="account-creation-container">
            <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
            <h1>{t("CreateAccount.Title")}</h1>

            {/* Shows red error message if login fails */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            {/*Login triggers when Enter or the Login button are pressed*/}
            <form onSubmit={handleCreateAccount}>
                <div className="input-group">
                    <label>{t("CreateAccount.Username")}</label>
                    <input
                        type="text"
                        value={username}
                        /*Updates the username character by character*/
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>{t("CreateAccount.EmailOptional")}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>{t("CreateAccount.Password")}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/*Button working as well when Enter clicked (type="submit")*/}
                <button type="submit" className="login-submit">
                    {t("CreateAccount.CreateButton")}
                </button>
            </form>

            {/* This button uses navigate to return the previous page */}
            <button className="back-btn" onClick={() => navigate(-1)}>
                {t("CreateAccount.Back")}
            </button>
        </div>
    );
}

export default CreateAccount;