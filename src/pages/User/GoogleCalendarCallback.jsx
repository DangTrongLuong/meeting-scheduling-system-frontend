import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const GoogleCalendarCallback = () => {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("google_calendar_connected");

    if (success === "true") {
      toast.success("Connected to Google Calendar!");
      setIsGoogleConnected(true);
      navigate("/user/meeting-schedule");
    } else if (googleConnected === "false") {
      toast.error("Failed to connect Google Calendar!");
    }
  }, [navigate]);
};
export default GoogleCalendarCallback;
