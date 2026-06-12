// createContext for the creation of a context object
// useContext to be able to use the created context object
// useEffect to automatically update when (in this case) the userID changes
// useState to store the local state
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Initialise user state from localStorage, if available
    // This is useful when the user refreshes the page, so they don't get logged out
    const [user, setUser] = useState(() =>
    {const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null});

    // Actually store the user in localStorage whenever it changes, or remove it if user is null
    // This is useful for logging in/out for example, since now only setUser(user) or (null) needs to be called
    // and it will update automatically
    useEffect(() => {if (user) {localStorage.setItem("user", JSON.stringify(user))}
                                 else {localStorage.removeItem("user");}},
        [user]);

    // Loggs user out (which uses useEffect)
    const logout = () => {setUser(null);};

    // Makes the user, setUser and logout function available to all "children" components that use the above useAuth()
    return (<AuthContext.Provider value={{ user, setUser, logout }}>{children}
            </AuthContext.Provider>);
    }

    // eslint-disable-next-line react-refresh/only-export-components
    export function useAuth() {
        const context = useContext(AuthContext);
        if (!context) {throw new Error("useAuth must be used inside an AuthProvider");}
        return context;
    }