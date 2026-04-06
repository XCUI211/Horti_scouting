import React, { useState } from 'react';  //useState keep track of user input
import axios from 'axios';  //carries data to the server
import "./FloorReport.css";
import {useNavigate} from "react-router-dom";

function FloorReport() {
    // Keeping track of user input [variable, function]
    // all initialized as empty strings
    const [fid, setFid] = useState("");
    const [uid, setUid] = useState("");

    const [pestsFound, setPestsFound] = useState("");
    const [pestType, setPestType] = useState([]);
    const pestOptions =
        [{ value: 'red_spider_mite', label: 'Red spider mite' },
        { value: 'thrips', label: 'Thrips' },
        { value: 'green_louse', label: 'Green louse' },
        { value: 'black_louse', label: 'Black louse' },
        { value: 'mealybug', label: 'Mealybug' },
        { value: 'pythium', label: 'Pythium' },
        { value: 'mite', label: 'Mite' },
        { value: 'cycada', label: 'Cycada' },
        { value: 'weed', label: 'Weed' },
        { value: 'caterpillar', label: 'Caterpillar' }];
    const [pestSeverity, setPestSeverity] = useState("");

    const [biologyUsed, setBiologyUsed] = useState("");
    const [biologyTypes, setBiologyTypes] = useState([]);
    const biologyOptions =
        [{ value: 'bio1', label: 'Bio1' },
        { value: 'bio2', label: 'Bio2' },
        { value: 'bio3', label: 'Bio3' }];
    const [chemicalsUsed, setChemicalsUsed] = useState("");
    const [chemicalsTypes, setChemicalsTypes] = useState([]);
    const chemicalsOptions =
        [{ value: 'chem1', label: 'Chem1' },
        { value: 'chem2', label: 'Chem2' },
        { value: 'chem3', label: 'Chem3' }];
    const [behandelaar, setBehandelaar] = useState("");

    const [potmaat, setPotmaat] = useState("");
    const [oppotweek, setOppotweek] = useState("");
    const [teelduurWeeks, setTeelduurWeeks] = useState("");

    const [trapNumber, setTrapNumber] = useState("");
    const [bugCount, setBugCount] = useState("");

    const [error, setError] = useState("");  // error to be shown to the user through interface (e.g.wrong password)
    const [success, setSuccess] = useState("");  // success message to be shown to the user

    // use navigate (for back button) to redirect button back to routed main page
    const navigate = useNavigate();

    const handleFloorReport  = async (e) => {  //waiting for the server
    e.preventDefault();  // prevents page refresh
    setError('');       // resets error message from any previous attempts
    setSuccess('');      // resets success message from any previous attempts

        try {
            //Sending the request to the backend
            const response = await axios.post('http://localhost:5000/api/floorreports', {  // sends POST request
                fid: Number(fid),
                uid: Number(uid),

                pests_found: !pestType.includes('none') && pestType.length > 0,
                pest_types: pestsFound === 'true' && pestType.length > 0 ? pestType : null,
                pest_severity: pestType.includes('none') || pestSeverity === ''
                                ? null
                                : Number(pestSeverity),

                biology_used: biologyUsed === true,
                biology_types: biologyUsed === 'true' && biologyTypes.length > 0 ? biologyTypes : null,
                chemicals_used: chemicalsUsed === true,
                chemicals_types: chemicalsUsed === 'true' && chemicalsTypes.length > 0 ? chemicalsTypes : null,
                behandelaar: biologyUsed === 'true' || chemicalsUsed === 'true'
                                ? behandelaar || null
                                : null,

                potmaat: potmaat || null,
                oppotweek: oppotweek === '' ? null : Number(oppotweek),
                teelduur_weeks: teelduurWeeks === '' ? null : Number(teelduurWeeks),

                trap_number: trapNumber,
                bug_count: bugCount === '' ? null : Number(bugCount),
            });

            // if successful
            console.log("Floor report created:", response.data);
            setSuccess("Floor report submitted successfully.");
            alert("Report succesfully submitted!");
            navigate("/");

          // if error
        }  catch (err) {
            console.error("Floor report failed:", err.response?.data);
            setError(err.response?.data?.message || "Could not submit Floor report");
        }
    };

    return (
        <div className="scout-container">
            <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
            <h1>Create Floor Report</h1>

            {/* Shows red error message if report fails */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            {/* Shows green success message if report succeeds */}
            {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}

            {/*Form triggers when Enter or the Submit button are pressed*/}
            <form onSubmit={handleFloorReport}>
                <div className="input-group">
                    <label>Floor ID</label>
                    <input type="number"
                           value={fid}
                           onChange={(e) => setFid(e.target.value)}
                           required/>
                </div>

                <div className="input-group">
                    <label>User ID</label>
                    <input type="number"
                           value={uid}
                           onChange={(e) => setUid(e.target.value)}
                           required/>
                </div>

                {/*PEST DETECTION
                    FIRST: Boolean whether pest is found
                    SECOND: Pest options (checkboxes; multiple pests per floor possible)
                    SECOND: Pest serverity (1-5)
                    SECOND: Biology used (Bool)
                    If biology used, then:
                    THIRD: Biology type used (drop down)
                    THIRD: Behandelaar (text)*/}
                <div className="input-group">
                    <label>Pests Found</label>
                    <select value={pestsFound}
                            onChange={(e) => {
                                      const value = e.target.value;
                                      setPestsFound(value);
                                      if (value === 'false') {setPestType([]); setPestSeverity('');}}}
                            required>
                        <option value="">Select option</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>

                {/*Pest options (checkboxes; multiple pests per floor possible)*/}
                {pestsFound === 'true' && (
                    <>
                    <div className="input-group">
                        <label>Found Pests</label>

                        <div className="pest-checkbox-group">
                            {pestOptions.map((pest) => (
                                <label key={pest.value} className="pest-checkbox-item">
                                    <input type="checkbox"
                                           checked={pestType.includes(pest.value)}
                                           onChange={(e) =>
                                                {if (e.target.checked) {
                                                    setPestType([...pestType, pest.value]);}

                                                else {const updated = pestType.filter((p) => p !== pest.value);
                                                    setPestType(updated);
                                                    if (updated.length === 0) {setPestSeverity('');}}
                                                }}/>
                                    <span>{pest.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/*Pest serverity (1-5)*/}
                    <div className="input-group">
                        <label>Pest Severity (1-5)</label>
                        <select value={pestSeverity}
                                onChange={(e) => setPestSeverity(e.target.value)}
                                required={pestType !== 'none' && pestType !== ''}>
                            <option value="">Select score</option>
                            <option value="1">1 (low)</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5 (high)</option>
                        </select>
                    </div>

                    {/*Biology used (Bool)*/}
                    <div className="input-group">
                        <label>Biology Used</label>
                        <select value={biologyUsed}
                                onChange={(e) => {
                                const value = e.target.value;
                                setBiologyUsed(value);

                                if (value === 'false') {
                                    setBiologyTypes('');
                                    if (chemicalsUsed !== 'true') {
                                        setBehandelaar('');
                                    }
                                }}}
                            required>
                            <option value="">Select option</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>

                    {/*If biology used, then: Biology type used*/}
                    {biologyUsed === 'true' && (
                            <div className="input-group">
                                <label>Biology Type</label>

                                <div className="pest-checkbox-group">
                                    {biologyOptions.map((bio) => (
                                        <label key={bio.value} className="pest-checkbox-item">
                                            <input type="checkbox"
                                                   checked={biologyTypes.includes(bio.value)}
                                                   onChange={(e) =>
                                                        {if (e.target.checked) {
                                                            setBiologyTypes([...biologyTypes, bio.value]);}

                                                        else {const updated = biologyTypes.filter((b) => b !== bio.value);
                                                            setBiologyTypes(updated);}
                                                        }}/>
                                            <span>{bio.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                    )}

                    {/*Chemicals used (Bool)*/}
                    <div className="input-group">
                        <label>Chemicals Used</label>
                        <select value={chemicalsUsed}
                                onChange={(e) => {
                                const value = e.target.value;
                                setChemicalsUsed(value);

                                if (value === 'false') {
                                    setChemicalsTypes('');
                                    if (biologyUsed !== 'true') {
                                        setBehandelaar('');
                                    }
                                }}}
                            required>
                            <option value="">Select option</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>

                    {/*If chemicals used, then: Chemicals type used*/}
                    {chemicalsUsed === 'true' && (
                            <div className="input-group">
                                <label>Chemicals Type</label>

                                <div className="pest-checkbox-group">
                                    {chemicalsOptions.map((chem) => (
                                        <label key={chem.value} className="pest-checkbox-item">
                                            <input type="checkbox"
                                                   checked={chemicalsTypes.includes(chem.value)}
                                                   onChange={(e) =>
                                                        {if (e.target.checked) {
                                                            setChemicalsTypes([...chemicalsTypes, chem.value]);}

                                                        else {const updated = chemicalsTypes.filter((c) => c !== chem.value);
                                                            setChemicalsTypes(updated);}
                                                        }}/>
                                            <span>{chem.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                    )}

                    {/*Behandelaar (if EITHER biology OR chemicals is used)*/}
                    {(biologyUsed === 'true' || chemicalsUsed === 'true') && (
                        <>
                            <div className="input-group">
                                <label>Behandelaar</label>
                                <input type="text"
                                       value={behandelaar}
                                       onChange={(e) => setBehandelaar(e.target.value)}/>
                            </div>
                        </>
                    )}







                    </>)}

                {/*FLOOR INFO*/}
                <div className="input-group">
                    <label>Potmaat</label>
                    <input type="text"
                           value={potmaat}
                           onChange={(e) => setPotmaat(e.target.value)}/>
                </div>

                <div className="input-group">
                    <label>Oppotweek</label>
                    <input type="number"
                           value={oppotweek}
                           onChange={(e) => setOppotweek(e.target.value)}/>
                </div>

                <div className="input-group">
                    <label>Teelduur (weeks)</label>
                    <input type="number"
                           value={teelduurWeeks}
                           onChange={(e) => setTeelduurWeeks(e.target.value)}/>
                </div>

                <div className="input-group">
                    <label>Trap Number</label>
                    <input type="date"
                           value={trapNumber}
                           onChange={(e) => setTrapNumber(e.target.value)}/>
                </div>

                <div className="input-group">
                    <label>Bug Count</label>
                    <input type="number"
                           value={bugCount}
                           onChange={(e) => setBugCount(e.target.value)}/>
                </div>

                {/*Button working as well when Enter clicked (type="submit")*/}
                <button type="submit" className="login-submit">Submit Report</button>
            </form>

            {/* This button uses navigate to return the previous page */}
            <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
}

export default FloorReport;