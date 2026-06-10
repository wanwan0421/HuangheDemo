import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export const useWorkbenchRouteSession = ({
  onRouteSessionChange,
}: {
  onRouteSessionChange: (sessionId: string | null) => void;
}) => {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();

  React.useEffect(() => {
    onRouteSessionChange(routeSessionId || null);
  }, [onRouteSessionChange, routeSessionId]);

  const navigateToRoot = React.useCallback(() => {
    navigate("/simulation");
  }, [navigate]);

  const navigateToSession = React.useCallback(
    (sessionId: string) => {
      navigate(`/simulation/${sessionId}`);
    },
    [navigate],
  );

  return {
    routeSessionId: routeSessionId || null,
    navigateToRoot,
    navigateToSession,
  };
};
