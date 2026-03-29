import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../../features/community/contexts/useCommunities";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import { type Community } from "../../../features/community/types/community";
import { api } from "../../../api/client";

type DeleteCommunityProps = {
    community?: Community;
}

export default function DeleteCommunity({ community }: DeleteCommunityProps){
    const [confirmInput, setConfirmInput] = useState('');
    const [error, setError] = useState('');
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
        try {
            const { response, data } = await api.communities.delete(community?.id!, confirmInput);
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