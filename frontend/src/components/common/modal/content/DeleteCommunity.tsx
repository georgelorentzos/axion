import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../../../contexts/communities/useCommunities";
import Input from "../../Input";
import Button from "../../Button";
import { type Community } from "../../../../types/community";

type DeleteCommunityProps = {
    community?: Community;
}

export default function DeleteCommunity({ community }: DeleteCommunityProps){
    const [confirmInput, setConfirmInput] = useState('');
    const [error, setError] = useState('');
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { setCommunities } = useCommunities();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (error) {
                setError('');
            }
        }, 3000)
        return () => clearTimeout(timer);
    }, [error]);

    const handleDeleteCommunity = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await fetch(`${apiUrl}/api/community/${community?.id}?community_name=${encodeURIComponent(confirmInput)}`, {
                method: "DELETE",
                headers: {"Authorization": `Bearer ${token}`}
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.detail);
                return;
            }
            navigate("/");
            setCommunities(communities => communities?.filter(c => c.id !== data.id) || null);
        } catch (error) {
            setError('Connection error.');
        }
    }

    return(
        <>
            <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">Delete {community?.name}</div>
                <div className="text-gray-500">Are you sure you want to delete this community? This action cannot be undone.</div>
            </div>
            {error && <div className="text-crimson text-sm text-center">{error}</div>}
            <Input placeholder="Enter community name" onChange={(e) => setConfirmInput(e.target.value)} />
            <Button text="Delete" isDanger onClick={handleDeleteCommunity} />
        </>
    );
}