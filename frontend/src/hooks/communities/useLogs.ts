import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Log } from "../../types/log";

export function useLogs() {
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { communityId } = useParams();
    const token = localStorage.getItem("token");
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        if (!token) return;
        const fetchLogs = async () => {
            try{
                const response = await fetch(`${apiUrl}/api/community/${communityId}/logs`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`},
                });
                const data = await response.json();
                if (data.success) {
                    setLogs(data.logs.reverse());
                }
            } catch (error) {
                console.log("error fetching logs ", error)
            }
        };
        fetchLogs();
    }, []);  

    return { logs, setLogs };
}