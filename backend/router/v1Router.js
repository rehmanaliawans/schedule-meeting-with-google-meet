const express = require("express");
const router = express.Router();
const settingController = require("../controller/settingController");

router.post("/connect-google-meet", settingController.connectGoogleMeet);
router.get("/get-google-meet-token", settingController.getGoogleMeetToken);
router.post("/post-interview", settingController.postInterview);

module.exports = router;
