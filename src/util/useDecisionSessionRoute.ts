import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export const useDecisionSessionRoute = ({
  onResetForEmptyRoute,
}: {
  onResetForEmptyRoute: () => void;
}) => {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const isManualSwitch = React.useRef(false);
  const isCreatingNewChat = React.useRef(false);
  const isAutoSessionBootstrap = React.useRef(false);

  React.useEffect(() => {
    if (isAutoSessionBootstrap.current) {
      if (routeSessionId) {
        isAutoSessionBootstrap.current = false;
      }
      return;
    }

    if (isCreatingNewChat.current) {
      if (!routeSessionId) {
        if (activeChatId) {
          setActiveChatId(null);
        }
        isManualSwitch.current = false;
        isCreatingNewChat.current = false;
      }
      return;
    }

    if (!routeSessionId) {
      if (activeChatId) {
        onResetForEmptyRoute();
        setActiveChatId(null);
      }
      return;
    }

    if (routeSessionId !== activeChatId) {
      isManualSwitch.current = true;
      setActiveChatId(routeSessionId);
    }
  }, [activeChatId, onResetForEmptyRoute, routeSessionId]);

  const navigateToNewChat = React.useCallback(() => {
    isCreatingNewChat.current = true;
    onResetForEmptyRoute();
    setActiveChatId(null);
    navigate("/chat");
  }, [navigate, onResetForEmptyRoute]);

  const navigateToSession = React.useCallback(
    (sessionId: string) => {
      isManualSwitch.current = true;
      setActiveChatId(sessionId);
      navigate(`/chat/${sessionId}`);
    },
    [navigate],
  );

  const navigateToAutoCreatedSession = React.useCallback(
    (sessionId: string) => {
      isAutoSessionBootstrap.current = true;
      setActiveChatId(sessionId);
      navigate(`/chat/${sessionId}`);
    },
    [navigate],
  );

  const clearSessionAndNavigateRoot = React.useCallback(() => {
    onResetForEmptyRoute();
    setActiveChatId(null);
    isManualSwitch.current = false;
    navigate("/chat");
  }, [navigate, onResetForEmptyRoute]);

  return {
    activeChatId,
    setActiveChatId,
    isManualSwitch,
    navigate,
    navigateToNewChat,
    navigateToSession,
    navigateToAutoCreatedSession,
    clearSessionAndNavigateRoot,
  };
};
