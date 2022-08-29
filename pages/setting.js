import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axiosInstance from "../utils/axiosInstance";

const Setting = () => {
  const router = useRouter();
  const googleLink = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL}&access_type=offline&prompt=consent&scope=https://www.googleapis.com/auth/calendar`;
  const [googleConnectSuccess, setGoogleConnectSuccess] = useState(false);
  useEffect(() => {
    const handleGoogleMeet = async () => {
      if (router.query.error) {
        router.push(`/setting`);
        return;
      }
      if (router.query.code) {
        const res = await axiosInstance.post(`/connect-google-meet`, {
          code: router.query.code,
        });
        if (res.data.status === "success") {
          setGoogleConnectSuccess(true);
          router.push(`/setting`);
        }
      }
    };
    if (router.query.code || router.query.error) {
      handleGoogleMeet();
    }
  }, [router]);
  return (
    <div>
      <div>
        <button onClick={() => router.push(googleLink)}>
          {googleConnectSuccess
            ? "Connected with Google"
            : "Connect with Google Meet"}
        </button>
      </div>
    </div>
  );
};

export default Setting;
