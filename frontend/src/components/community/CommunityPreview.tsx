import { useNavigate, useParams } from "react-router-dom";
import CommunityProfile from "./CommunityProfile";
import Button from "../common/Button";
import { useEffect, useState } from "react";
import { useCommunities } from "../../contexts/community/useCommunities";
import { type Community } from "../../types/community";
import Modal from "../common/modal/Modal";
import Alert from "../common/modal/content/Alert";

type CommunityPreviewProps = {
  joinBtn?: boolean;
  community?: Community;
  skipFetch?: boolean;
  onContentLoaded?: () => void;
};

export default function CommunityPreview({ joinBtn, community: communityProp, skipFetch }: CommunityPreviewProps) {
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
  const [fetchedCommunity, setFetchedCommunity] = useState<Community | null>(null);
  const [doesNotExist, setDoesNotExist] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setCommunities } = useCommunities();
  const { communityId } = useParams();
  const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');


  const community = fetchedCommunity || communityProp;

  const id = community?.id || communityId;
  const name = community?.name;
  const image = skipFetch ? communityProp?.image : community?.image;
  const onlineMembers = community?.onlineMembers;
  const totalMembers = community?.totalMembers;
  const createdAt = community?.createdAt;

  const getImageSrc = (image: string) => {
    if (image.startsWith("blob:") || image.startsWith("http")) return image;
    return apiUrl + image;
  };

  const joinCommunity = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/community/${id}/join`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        navigate("/auth");
        return;
      }
      const data = await response.json();
      if (data.status === "banned_member") {
        setBanReason(data.reason);
        setIsBannedModalOpen(true);
        return;
      }
      const navData = {
        communityId: id,
        communityName: name || "",
        communityImage: image || "",
        communityCreatedAt: createdAt || "",
        communityOwnerId: community?.ownerId || "",
      };
      setCommunities((prev) => {
        const already = prev?.some((c) => c.id === id);
        if (already) return prev;
        return [
          ...(prev || []),
          {
            id: id || "",
            name: name || "",
            image: image || "",
            createdAt: createdAt || "",
            ownerId: community?.ownerId || "",
          },
        ];
      });
      navigate(`/community/${id}`, { state: { community: navData } });
    } catch (error) {
      console.error("Join community error:", error);
    }
  };

  useEffect(() => {
    if (skipFetch) {
      setLoading(false);
      return;
    }
    const fetchId = communityProp?.id || id;
    if (!fetchId) {
      setDoesNotExist(true);
      setLoading(false);
      return;
    }
    const fetchCommunity = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/community/${fetchId}`);
        if (!response.ok) {
          setDoesNotExist(true);
          return;
        }
        const data = await response.json();
        if (!data || !data.id) {
          setDoesNotExist(true);
          return;
        }
        setFetchedCommunity({
          id: data.id,
          name: data.name,
          image: data.image,
          onlineMembers: data.onlineMembers,
          totalMembers: data.totalMembers,
          createdAt: data.createdAt,
          ownerId: data.ownerId,
        });
      } catch (error) {
        setDoesNotExist(true);
        console.log("error failed to fetch community", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [communityProp?.id, id]);

  if (loading) return null;

  if (doesNotExist) {
    return (
      <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-2xl w-[300px] p-4">
        <div className="flex gap-2 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[50px] h-[50px] text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div className="font-bold text-gray-500">Community doesn't exist</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-2xl w-[300px] p-4">
      <div className="flex gap-2 items-center">
        {image ? (
          <CommunityProfile src={getImageSrc(image)} />
        ) : (
          <CommunityProfile name={name?.charAt(0).toUpperCase()} isCommunityPreview />
        )}
        <div className="font-bold">{name}</div>
      </div>
      <div className="h-[40px] px-2 flex justify-between items-center w-full">
        <div className="text-[12px] text-gray-500 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-3 bg-forestgreen rounded-full"></div>
            {onlineMembers || 0} Online
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-3 bg-emerald border border-outline rounded-full"></div>
            {totalMembers} {String(totalMembers).trim() === "1" ? "Member" : "Members"}
          </div>
        </div>
        <div className="text-[12px] text-gray-500">Est. {createdAt}</div>
      </div>
      {joinBtn && (
        <Button text="Join Community" isGreen onClick={() => id && joinCommunity(id)} bold />
      )}
    </div>
      <Modal isOpen={isBannedModalOpen} onClose={() => setIsBannedModalOpen(false)}>
        <Alert text={`You have been banned from ${name} with reason: ${banReason}`} />
      </Modal>
    </>
  );
}