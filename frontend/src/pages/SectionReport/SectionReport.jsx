import React, { useState } from 'react';  //useState keep track of user input
import axios from 'axios';  //carries data to the server
import "./SectionReport.css";
import {useNavigate} from "react-router-dom";
import { useTranslation } from "react-i18next";

function SectionReport() {
    // Keeping track of user input [variable, function]
    // all initialized as empty strings
    const [sid, setSid] = useState("");
    const [uid, setUid] = useState("");
    const [floor, setFloor] = useState("");
    const [pestType, setPestType] = useState("");
    const [pestSeverity, setPestSeverity] = useState("");
    const [biology, setBiology] = useState("");
    const [trapNumber, setTrapNumber] = useState("");
    const [bugCount, setBugCount] = useState("");
    const [error, setError] = useState("");  // error to be shown to the user through interface (e.g.wrong password)
    const [success, setSuccess] = useState("");  // success message to be shown to the user

    // use navigate (for back button) to redirect button back to routed main page
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSectionReport  = async (e) => {  //waiting for the server
    e.preventDefault();  // prevents page refresh
    setError('');       // resets error message from any previous attempts
    setSuccess('');      // resets success message from any previous attempts

        try {
            //Sending the request to the backend
            const response = await axios.post('http://localhost:5000/api/sectionreports', {  // sends POST request
                sid: Number(sid),
                uid: Number(uid),
                floor: floor,
                pests_found: pestType !== 'none',
                pest_type: pestType === 'none' ? null : pestType,
                pest_severity: pestType === 'none' || pestSeverity === '' ? null : Number(pestSeverity),
                biology: biology,
                trap_number: trapNumber,
                bug_count: bugCount === '' ? null : Number(bugCount),
            });

            // if successful
            console.log("Section report created:", response.data);
            setSuccess(t("SectionReport.SubmitSuccess"));
            alert(t("SectionReport.AlertSuccess"));
            navigate("/");

          // if error
        }  catch (err) {
            console.error("Section report failed:", err.response?.data);
            setError(err.response?.data?.message || t("SectionReport.SubmitFailed"));
        }
    };

    return (
        <div className="scout-container">
            <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
            <h1>{t("SectionReport.Title")}</h1>

            {/* Shows red error message if report fails */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            {/* Shows green success message if report succeeds */}
            {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}

            {/*Form triggers when Enter or the Submit button are pressed*/}
            <form onSubmit={handleSectionReport}>
                <div className="input-group">
                    <label>{t("SectionReport.SectionID")}</label>
                    <input type="number"
                           value={sid}
                           onChange={(e) => setSid(e.target.value)}
                           required/>
                </div>

                <div className="input-group">
                    <label>{t("SectionReport.UserID")}</label>
                    <input type="number"
                           value={uid}
                           onChange={(e) => setUid(e.target.value)}
                           required/>
                </div>

                <div className="input-group">
                    <label>{t("SectionReport.Floor")}</label>
                    <input type="text"
                           value={floor}
                           onChange={(e) => setFloor(e.target.value)}
                           required/>
                </div>

                <div className="input-group">
                    <label>{t("SectionReport.PestsType")}</label>
                    <select value={pestType}
                            onChange={(e) => {setPestType(e.target.value);
                                if (e.target.value === 'none') {setPestSeverity('');}}}
                            required>
                        <option value="">{t("SectionReport.SelectOption")}</option>
                        <option value="none">{t("SectionReport.NoPestsFound")}</option>
                        <option value="red_spider_mite">{t("SectionReport.RedSpiderMite")}</option>
                        <option value="thrips">{t("SectionReport.Thrips")}</option>
                        <option value="green_louse">{t("SectionReport.GreenLouse")}</option>
                        <option value="black_louse">{t("SectionReport.BlackLouse")}</option>
                        <option value="mealybug">{t("SectionReport.Mealybug")}</option>
                        <option value="pythium">{t("SectionReport.Pythium")}</option>
                        <option value="mite">{t("SectionReport.Mite")}</option>
                        <option value="cycada">{t("SectionReport.Cycada")}</option>
                        <option value="weed">{t("SectionReport.Weed")}</option>
                        <option value="caterpillar">{t("SectionReport.Caterpillar")}</option>
                    </select>
                </div>

                {pestType !== 'none' && pestType !== '' && (<>
                    <div className="input-group">
                        <label>{t("SectionReport.PestSeverity")}</label>
                        <select value={pestSeverity}
                                onChange={(e) => setPestSeverity(e.target.value)}
                                required={pestType !== 'none' && pestType !== ''}>
                            <option value="">{t("SectionReport.SelectScore")}</option>
                            <option value="1">{t("SectionReport.Severity1")}</option>
                            <option value="2">{t("SectionReport.Severity2")}</option>
                            <option value="3">{t("SectionReport.Severity3")}</option>
                            <option value="4">{t("SectionReport.Severity4")}</option>
                            <option value="5">{t("SectionReport.Severity5")}</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>{t("SectionReport.Biology")}</label>
                        <input type="text"
                               value={biology}
                               onChange={(e) => setBiology(e.target.value)}/>
                    </div>
                </>)}

                <div className="input-group">
                    <label>{t("SectionReport.TrapNumber")}</label>
                    <input type="text"
                           value={trapNumber}
                           onChange={(e) => setTrapNumber(e.target.value)}/>
                </div>

                <div className="input-group">
                    <label>{t("SectionReport.BugCount")}</label>
                    <input type="number"
                           value={bugCount}
                           onChange={(e) => setBugCount(e.target.value)}/>
                </div>

                {/*Button working as well when Enter clicked (type="submit")*/}
                <button type="submit" className="login-submit">{t("SectionReport.SubmitReport")}</button>
            </form>

            {/* This button uses navigate to return the previous page */}
            <button className="back-btn" onClick={() => navigate(-1)}>{t("SectionReport.Back")}</button>
        </div>
    );
}

export default SectionReport;