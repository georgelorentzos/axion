import { useNavigate, useParams } from "react-router-dom";
import CommunityAvatar from "../avatar/CommunityAvatar";
import Button from "../Button";
import { useEffect, useState } from "react";
import { useCommunities } from "../sidebar/contexts/useCommunities";
import { type Community } from "../../features/community/types/community";
import Modal from "../modal/Modal";
import InviteFriend from "../modal/content/InviteFriend";
import { api } from "../../api/client";
import { icons } from "../../constants/Icons";
import Icon from "../Icon";

type CommunityCardProps = {
  isExample?: boolean;
  community?: Community;
  skipFetch?: boolean;
};

export default function CommunityCard({ isExample, community: communityProp, skipFetch }: CommunityCardProps) {
  const [fetchedCommunity, setFetchedCommunity] = useState<Community | null>(null);
  const [doesNotExist, setDoesNotExist] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setCommunities } = useCommunities();
  const { communityId } = useParams();
  const [banReason, setBanReason] = useState("");
  const [isInviteFriendModalOpen, setIsInviteFriendModalOpen] = useState(false);

  const community = fetchedCommunity || communityProp;
  const id = community?.id || communityId;
  const name = community?.name;
  const image = skipFetch ? communityProp?.image : community?.image;
  const onlineMembers = community?.onlineMembers;
  const totalMembers = community?.totalMembers;
  const createdAt = community?.createdAt;

  useEffect(() => {
    if (!banReason) return;
    const timer = setTimeout(() => setBanReason(""), 3000);
    return () => clearTimeout(timer);
  }, [banReason]);

  const joinCommunity = async (id: string) => {
    try {
      const { data } = await api.communities.join(id);
      if (!data.success) {
        setBanReason(data.detail);
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
      const stored = JSON.parse(localStorage.getItem("communities") || "[]");
      const match = stored.find((item: { communityId: string }) => item.communityId === id);
      navigate(
        match?.channelId ? `/community/${id}/${match.channelId}` : `/community/${id}`,
        { state: { community: navData } }
      );
    } catch (error) {
      console.error(error);
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
        const { response, data } = await api.communities.get(fetchId);
        if (!response.ok || !data?.id) {
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
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [communityProp?.id, id]);

  if (loading) return null;

  if (doesNotExist || !community) {
    return (
      <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-2xl w-[300px] p-4">
        <div className="flex gap-2 items-center">
          <Icon svgPaths={icons.alertCircle} className="w-[50px] h-[50px] text-red-700" />
          <div className="font-bold text-gray-500">Community doesn't exist</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-2xl w-[300px] p-4">
        <div className="flex gap-2 items-center">
          <CommunityAvatar community={community} />
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
        {isExample ? (
          <Button text="Example Button" isGreen bold onClick={() => {}} />
        ) : !communityId ? (
          <>
            {banReason ? (
              <Button text="You have been banned" isDanger disabled />
            ) : (
              <Button text="Join Community" isGreen onClick={() => id && joinCommunity(id)} bold />
            )}
          </>
        ) : (
          <Button text="Invite Friends" isGreen onClick={() => setIsInviteFriendModalOpen(true)} bold />
        )}
      </div>
      <Modal isOpen={isInviteFriendModalOpen} onClose={() => setIsInviteFriendModalOpen(false)}>
        <InviteFriend />
      </Modal>
    </>
  );
}