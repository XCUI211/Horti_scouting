import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import "./TasksScout.css";
import { useAuth } from "../../context/AuthContext";

const TasksScout = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                if (user?.uid) {
                    const res = await axios.get(`http://localhost:5000/api/scout/tasks/${user.uid}`);
                    setTasks(res.data);
                }
            } catch (err) {
                console.error("Error fetching tasks:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [user]);

    // Navigates to maps
    const handleRedo = (task) => {
        navigate(`/maps/`, {
            state: { redoReportId: task.rid }
        });
    };

    return (
        <ScoutLayout title={t("TasksScout.Title")}>
            <div className="task-scout-vireo-page-wrapper">
                {loading ? (
                    <p className="task-scout-vireo-loading">{t("TasksScout.Loading")}</p>
                ) : (
                    <div className="task-scout-vireo-list">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.rid} className="task-scout-vireo-item-group">
                                    <div className="task-scout-vireo-row">
                                        <div className="task-scout-vireo-info">
                                            <span className="task-scout-vireo-location">
                                                {task.map_name}
                                            </span>
                                            <span className="task-scout-vireo-section">
                                                {task.section_name}
                                            </span>
                                        </div>

                                        <div className="task-scout-vireo-status-area">
                                            {task.status === 'rejected' && (
                                                <button
                                                    className="task-scout-vireo-btn-redo"
                                                    onClick={() => handleRedo(task)}
                                                >
                                                    {t("TasksScout.Redo")}
                                                </button>
                                            )}
                                            {task.status === 'pending' && (
                                                <span className="task-scout-vireo-status-pending">
                                                    {t("TasksScout.AwaitingApproval")}
                                                </span>
                                            )}
                                            {task.status === 'approved' && (
                                                <span className="task-scout-vireo-status-done">
                                                    {t("TasksScout.Done")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admin comment */}
                                    {task.comment && (
                                        <div className="task-scout-vireo-comment-box">
                                            <p className="task-scout-vireo-comment-text">
                                                <strong>{t("TasksScout.AdminNote")}:</strong> {task.comment}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="task-scout-vireo-empty">{t("TasksScout.NoReports")}</p>
                        )}
                    </div>
                )}
            </div>
        </ScoutLayout>
    );
};

export default TasksScout;