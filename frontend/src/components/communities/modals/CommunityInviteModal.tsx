import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import ModalCloseButton from "../../common/modals/ModalCloseButton";
import { useLocation } from "react-router-dom";
import { useCurrentUser } from "../../../contexts/useCurrentUser";

type CommunityInviteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (name: string) => void;
};

interface LocationState {
    communityData?: {
        communityId: string;
    }
}

export default function CommunityInviteModal({
  isOpen,
  onClose,
}: CommunityInviteModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
  const location = useLocation();
  const { communityData } = location.state as LocationState;
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setShowFade(true), 10);
    } else {
      setShowFade(false);
      const timer = setTimeout(() => setIsVisible(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${apiUrl}/join/${communityData?.communityId}/${currentUser?.user_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible) return null;
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
        showFade ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border border-outline relative bg-onyx w-[400px] rounded-3xl"
      >
        <ModalCloseButton onClose={onClose} />

        <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
              <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">Invite Friends</div>
                <div className="text-gray-500">Share this link with others.</div>
              </div>

              <Input
                readOnly
                value={`${apiUrl}/join/${communityData?.communityId}/${currentUser?.user_id}`}
              />
          <Button text={copied ? "Copied" : "Copy Link"} isGreen onClick={handleCopy} />
        </div>
      </div>
    </div>
  );
}