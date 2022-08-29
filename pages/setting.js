import React from "react";

const Setting = () => {
  const googleLink = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL}?method=MEET&access_type=offline&prompt=consent&scope=https://www.googleapis.com/auth/calendar`;

  return (
    <div>
      <div>
        <button onClick={handleGoogleMeet}>Google meet connecting</button>
      </div>
    </div>
  );
};

export default Setting;
