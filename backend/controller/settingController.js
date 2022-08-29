const Setting = require("../model/settingModel");
const request = require("request");
const { base64encode } = require("nodejs-base64");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
exports.connectGoogleMeet = async (req, res, next) => {
  const { code } = req.body;
  try {
    if (code) {
      //convert the clientId and client_secret to base64 string and send as authorization header
      const authorizationString = base64encode(
        `${process.env.GOOGLE_CLIENT_ID}:${process.env.GOOGLE_CLIENT_SECRET}`,
      );

      const data = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.GOOGLE_REDIRECT_URL}?method=MEET`,
      };

      const options = {
        method: "POST",
        url: `https://oauth2.googleapis.com/token?method=MEET`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${authorizationString}`,
        },
        form: data,
      };

      //generate the user acess token from google API
      request(options, async function (error, response, body) {
        if (error) throw new Error(error);

        const data = JSON.parse(body);
        if (data.refresh_token) {
          const date = new Date();

          const addData = await Setting.create({
            token: data.refresh_token,
            tokenExpire: date.setMonth(date.getMonth() + 60),
          });
          res.status(201).json({
            status: "success",
            token: addData.token,
          });
        } else {
          res.status(401).json({
            status: "error",
            message: "refresh token expired",
          });
        }
      });
    } else {
      res.status(401).json({
        status: "error",
        message: "Code is missing",
      });
    }
  } catch (err) {
    res.status(401).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};
exports.getGoogleMeetToken = async (req, res, next) => {
  try {
    const data = await Setting.findOne();

    if (data) {
      const options = {
        method: "POST",
        url: "https://oauth2.googleapis.com/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        form: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: data.token,
          grant_type: "refresh_token",
        },
      };
      request(options, async (error, response, body) => {
        if (error) throw new Error(error);
        const tokenResponse = JSON.parse(body);

        if (tokenResponse.error) {
          await Channel.findByIdAndDelete(data._id);
          res.status(401).json({
            status: "error",
            message:
              "You might have changed your Google account password. Please login again.",
          });
        } else {
          res.status(201).json({
            status: "success",
            token: data.token,
          });
        }
      });
    } else {
      res.status(401).json({
        status: "error",
        message: "Not connected with google Meet",
      });
    }
  } catch (err) {
    res.status(401).json({
      status: "error",
      message: "Not connected with google Meet",
    });
  }
};
const createCalendar = (token) => {
  const scopes =
    "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.readonly";

  //ceate a new oAuth2Client object with folllowing parameters
  const oAuth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    scopes,
  );

  //save the generated token as credentials in oAuth2Client
  oAuth2Client.setCredentials({
    refresh_token: token,
  });

  // Create a new calender instance.
  const calendar = google.calendar({
    version: "v3",
    auth: oAuth2Client,
  });

  return calendar;
};
exports.postInterview = async (req, res, next) => {
  const interviewInfo = req.body;
  console.log("interview info", interviewInfo);
  //create a calender
  const calendar = createCalendar(interviewInfo.google_token);

  // Create a new event start date instance for temp uses in our calendar.
  const eventStartTime = interviewInfo.interviewTime;

  const eventEndTime = moment(interviewInfo.interviewTime)
    .add(interviewInfo.duration, "minutes")
    .format();

  let event = {
    summary: "Meeting Title",
    location: "remote",
    description: "set a Meeting using Google Meet",
    colorId: 1,
    start: {
      dateTime: eventStartTime,
    },
    end: {
      dateTime: eventEndTime,
    },
    attendees: [{ email: interviewInfo.email }],
    sendUpdates: true,
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  // Check if we are busy and have an event on our calendar for the same time.
  calendar.freebusy.query(
    {
      resource: {
        timeMin: eventStartTime,
        timeMax: eventEndTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        items: [{ id: "primary" }],
      },
    },
    (err, googleResponse) => {
      // Check for errors in our query and log them if they exist.
      if (err) {
        return next(new AppError(err, 404));
      }

      // Create an array of all events on our calendar during that time.
      const eventArr = googleResponse.data.calendars.primary.busy;

      // Check if event array is empty which means we are not busy
      if (eventArr.length === 0)
        // If we are not busy create a new calendar event.
        return calendar.events.insert(
          {
            calendarId: "primary",
            resource: event,
            conferenceDataVersion: 1,
            sendUpdates: "all",
          },
          async (err, event) => {
            // Check for errors and log them if they exist.
            if (err) return next(new AppError(err, 404));

            //return the newly created intrview to client side
            return res.json({
              status: "success",
            });
          },
        );

      return res.json({
        status: "warning",
        message: "Interview is already schedule for this time",
      });
    },
  );
};
